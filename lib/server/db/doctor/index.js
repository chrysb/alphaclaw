const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { createSchema } = require("./schema");
const {
  kDoctorCardStatus,
  kDoctorDefaultRunsLimit,
  kDoctorMaxRunsLimit,
  kDoctorPriority,
  kDoctorRunStatus,
} = require("../../doctor/constants");

let db = null;
const kDoctorInitialBaselineMetaKey = "initial_workspace_baseline";

const ensureDb = () => {
  if (!db) throw new Error("Doctor DB not initialized");
  return db;
};

const closeDoctorDb = () => {
  if (!db) return;
  const database = db;
  db = null;
  database.close();
};

const parseJsonText = (value, fallbackValue) => {
  if (typeof value !== "string" || !value) return fallbackValue;
  try {
    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
};

const buildPriorityCounts = (cards = []) => ({
  P0: cards.filter((card) => card.priority === kDoctorPriority.P0).length,
  P1: cards.filter((card) => card.priority === kDoctorPriority.P1).length,
  P2: cards.filter((card) => card.priority === kDoctorPriority.P2).length,
});

const buildStatusCounts = (cards = []) => ({
  open: cards.filter((card) => card.status === kDoctorCardStatus.open).length,
  dismissed: cards.filter((card) => card.status === kDoctorCardStatus.dismissed).length,
  fixed: cards.filter((card) => card.status === kDoctorCardStatus.fixed).length,
});

const toCardModel = (row) => {
  if (!row) return null;
  return {
    id: Number(row.id || 0),
    runId: Number(row.run_id || 0),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    priority: row.priority || kDoctorPriority.P2,
    category: row.category || "workspace",
    title: row.title || "",
    summary: row.summary || "",
    recommendation: row.recommendation || "",
    evidence: parseJsonText(row.evidence_json, []),
    targetPaths: parseJsonText(row.target_paths_json, []),
    fixPrompt: row.fix_prompt || "",
    status: row.status || kDoctorCardStatus.open,
  };
};

const attachRunCounts = (run, cards = []) =>
  run
    ? {
        ...run,
        cardCount: cards.length,
        priorityCounts: buildPriorityCounts(cards),
        statusCounts: buildStatusCounts(cards),
      }
    : null;

const getCardsByRunId = (runId) => {
  const database = ensureDb();
  const rows = database
    .prepare(`
      SELECT
        id,
        run_id,
        created_at,
        updated_at,
        priority,
        category,
        title,
        summary,
        recommendation,
        evidence_json,
        target_paths_json,
        fix_prompt,
        status
      FROM doctor_cards
      WHERE run_id = $run_id
      ORDER BY
        CASE priority
          WHEN 'P0' THEN 0
          WHEN 'P1' THEN 1
          ELSE 2
        END ASC,
        created_at DESC
    `)
    .all({ $run_id: Number(runId || 0) });
  return rows.map(toCardModel);
};

const listDoctorCards = ({ runId } = {}) => {
  const database = ensureDb();
  const hasRunFilter =
    runId !== undefined &&
    runId !== null &&
    String(runId || "").trim() !== "" &&
    String(runId || "").trim().toLowerCase() !== "all";
  const rows = database
    .prepare(`
      SELECT
        c.id,
        c.run_id,
        c.created_at,
        c.updated_at,
        c.priority,
        c.category,
        c.title,
        c.summary,
        c.recommendation,
        c.evidence_json,
        c.target_paths_json,
        c.fix_prompt,
        c.status,
        r.started_at AS run_started_at,
        r.completed_at AS run_completed_at,
        r.status AS run_status
      FROM doctor_cards c
      INNER JOIN doctor_runs r ON r.id = c.run_id
      ${hasRunFilter ? "WHERE c.run_id = $run_id" : ""}
      ORDER BY
        CASE c.status
          WHEN 'open' THEN 0
          WHEN 'dismissed' THEN 1
          ELSE 2
        END ASC,
        CASE c.priority
          WHEN 'P0' THEN 0
          WHEN 'P1' THEN 1
          ELSE 2
        END ASC,
        c.created_at DESC
    `)
    .all(hasRunFilter ? { $run_id: Number(runId || 0) } : {});
  return rows.map((row) => ({
    ...toCardModel(row),
    runStartedAt: row.run_started_at || null,
    runCompletedAt: row.run_completed_at || null,
    runStatus: row.run_status || kDoctorRunStatus.failed,
  }));
};

const toRunModel = (row) => {
  if (!row) return null;
  return {
    id: Number(row.id || 0),
    startedAt: row.started_at || null,
    completedAt: row.completed_at || null,
    status: row.status || kDoctorRunStatus.failed,
    engine: row.engine || "",
    workspaceRoot: row.workspace_root || "",
    workspaceFingerprint: row.workspace_fingerprint || "",
    workspaceManifest: parseJsonText(row.workspace_manifest_json, null),
    promptVersion: row.prompt_version || "",
    summary: row.summary || "",
    rawResult: parseJsonText(row.raw_result_json, null),
    error: row.error || "",
    reusedFromRunId: Number(row.reused_from_run_id || 0),
  };
};

const initDoctorDb = ({ rootDir }) => {
  closeDoctorDb();
  const dbDir = path.join(rootDir, "db");
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, "doctor.db");
  db = new DatabaseSync(dbPath);
  createSchema(db);
  markIncompleteRunsFailed();
  return { path: dbPath };
};

const getDoctorMeta = (key) => {
  const database = ensureDb();
  const row = database
    .prepare(`
      SELECT
        key,
        value_json,
        updated_at
      FROM doctor_meta
      WHERE key = $key
      LIMIT 1
    `)
    .get({ $key: String(key || "") });
  if (!row) return null;
  return {
    key: row.key || "",
    value: parseJsonText(row.value_json, null),
    updatedAt: row.updated_at || null,
  };
};

const setDoctorMeta = ({ key, value = null }) => {
  const database = ensureDb();
  database
    .prepare(`
      INSERT INTO doctor_meta (
        key,
        value_json,
        updated_at
      ) VALUES (
        $key,
        $value_json,
        strftime('%Y-%m-%dT%H:%M:%fZ','now')
      )
      ON CONFLICT(key) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = excluded.updated_at
    `)
    .run({
      $key: String(key || ""),
      $value_json: value == null ? null : JSON.stringify(value),
    });
  return getDoctorMeta(key);
};

const getInitialWorkspaceBaseline = () => getDoctorMeta(kDoctorInitialBaselineMetaKey)?.value || null;

const setInitialWorkspaceBaseline = (baseline) =>
  setDoctorMeta({
    key: kDoctorInitialBaselineMetaKey,
    value: baseline,
  })?.value || null;

const markIncompleteRunsFailed = (errorMessage = "Doctor run interrupted before completion") => {
  const database = ensureDb();
  const result = database
    .prepare(`
      UPDATE doctor_runs
      SET
        status = $status,
        completed_at = COALESCE(completed_at, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        error = COALESCE(NULLIF(error, ''), $error)
      WHERE status = $running_status
    `)
    .run({
      $status: kDoctorRunStatus.failed,
      $running_status: kDoctorRunStatus.running,
      $error: String(errorMessage || ""),
    });
  return Number(result.changes || 0);
};

const createDoctorRun = ({
  status = kDoctorRunStatus.running,
  engine,
  workspaceRoot,
  workspaceFingerprint = "",
  workspaceManifest = null,
  promptVersion,
  reusedFromRunId = 0,
}) => {
  const database = ensureDb();
  const result = database
    .prepare(`
      INSERT INTO doctor_runs (
        status,
        engine,
        workspace_root,
        workspace_fingerprint,
        workspace_manifest_json,
        prompt_version,
        reused_from_run_id
      ) VALUES (
        $status,
        $engine,
        $workspace_root,
        $workspace_fingerprint,
        $workspace_manifest_json,
        $prompt_version,
        $reused_from_run_id
      )
    `)
    .run({
      $status: String(status || kDoctorRunStatus.running),
      $engine: String(engine || ""),
      $workspace_root: String(workspaceRoot || ""),
      $workspace_fingerprint: String(workspaceFingerprint || ""),
      $workspace_manifest_json: workspaceManifest == null ? null : JSON.stringify(workspaceManifest),
      $prompt_version: String(promptVersion || ""),
      $reused_from_run_id: Number(reusedFromRunId || 0),
    });
  return Number(result.lastInsertRowid || 0);
};

const completeDoctorRun = ({
  id,
  status,
  summary = "",
  rawResult = null,
  error = "",
}) => {
  const database = ensureDb();
  const result = database
    .prepare(`
      UPDATE doctor_runs
      SET
        completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
        status = $status,
        summary = $summary,
        raw_result_json = $raw_result_json,
        error = $error
      WHERE id = $id
    `)
    .run({
      $id: Number(id || 0),
      $status: String(status || kDoctorRunStatus.failed),
      $summary: String(summary || ""),
      $raw_result_json: rawResult == null ? null : JSON.stringify(rawResult),
      $error: String(error || ""),
    });
  return Number(result.changes || 0);
};

const insertDoctorCards = ({ runId, cards = [] }) => {
  const database = ensureDb();
  database.exec("BEGIN");
  try {
    const stmt = database.prepare(`
      INSERT INTO doctor_cards (
        run_id,
        priority,
        category,
        title,
        summary,
        recommendation,
        evidence_json,
        target_paths_json,
        fix_prompt,
        status
      ) VALUES (
        $run_id,
        $priority,
        $category,
        $title,
        $summary,
        $recommendation,
        $evidence_json,
        $target_paths_json,
        $fix_prompt,
        $status
      )
    `);
    for (const card of cards) {
      stmt.run({
        $run_id: Number(runId || 0),
        $priority: String(card?.priority || kDoctorPriority.P2),
        $category: String(card?.category || "workspace"),
        $title: String(card?.title || ""),
        $summary: String(card?.summary || ""),
        $recommendation: String(card?.recommendation || ""),
        $evidence_json: JSON.stringify(card?.evidence || []),
        $target_paths_json: JSON.stringify(card?.targetPaths || []),
        $fix_prompt: String(card?.fixPrompt || ""),
        $status: String(card?.status || kDoctorCardStatus.open),
      });
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
};

const getDoctorRun = (id) => {
  const database = ensureDb();
  const row = database
    .prepare(`
      SELECT
        id,
        started_at,
        completed_at,
        status,
        engine,
        workspace_root,
        workspace_fingerprint,
        workspace_manifest_json,
        prompt_version,
        summary,
        raw_result_json,
        error,
        reused_from_run_id
      FROM doctor_runs
      WHERE id = $id
      LIMIT 1
    `)
    .get({ $id: Number(id || 0) });
  const run = toRunModel(row);
  if (!run) return null;
  return attachRunCounts(run, getCardsByRunId(run.id));
};

const getLatestDoctorRun = () => {
  const database = ensureDb();
  const row = database
    .prepare(`
      SELECT
        id,
        started_at,
        completed_at,
        status,
        engine,
        workspace_root,
        workspace_fingerprint,
        workspace_manifest_json,
        prompt_version,
        summary,
        raw_result_json,
        error,
        reused_from_run_id
      FROM doctor_runs
      ORDER BY started_at DESC
      LIMIT 1
    `)
    .get();
  const run = toRunModel(row);
  if (!run) return null;
  return attachRunCounts(run, getCardsByRunId(run.id));
};

const listDoctorRuns = ({ limit = kDoctorDefaultRunsLimit } = {}) => {
  const database = ensureDb();
  const safeLimit = Math.max(
    1,
    Math.min(Number.parseInt(String(limit || kDoctorDefaultRunsLimit), 10) || kDoctorDefaultRunsLimit, kDoctorMaxRunsLimit),
  );
  const rows = database
    .prepare(`
      SELECT
        id,
        started_at,
        completed_at,
        status,
        engine,
        workspace_root,
        workspace_fingerprint,
        workspace_manifest_json,
        prompt_version,
        summary,
        raw_result_json,
        error,
        reused_from_run_id
      FROM doctor_runs
      ORDER BY started_at DESC
      LIMIT $limit
    `)
    .all({ $limit: safeLimit });
  return rows.map((row) => {
    const run = toRunModel(row);
    return attachRunCounts(run, getCardsByRunId(run.id));
  });
};

const getDoctorCard = (id) => {
  const database = ensureDb();
  const row = database
    .prepare(`
      SELECT
        id,
        run_id,
        created_at,
        updated_at,
        priority,
        category,
        title,
        summary,
        recommendation,
        evidence_json,
        target_paths_json,
        fix_prompt,
        status
      FROM doctor_cards
      WHERE id = $id
      LIMIT 1
    `)
    .get({ $id: Number(id || 0) });
  return toCardModel(row);
};

const updateDoctorCardStatus = ({ id, status }) => {
  const database = ensureDb();
  const nextStatus =
    status === kDoctorCardStatus.fixed || status === kDoctorCardStatus.dismissed
      ? status
      : kDoctorCardStatus.open;
  const result = database
    .prepare(`
      UPDATE doctor_cards
      SET
        status = $status,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = $id
    `)
    .run({
      $id: Number(id || 0),
      $status: nextStatus,
    });
  return Number(result.changes || 0) > 0 ? getDoctorCard(id) : null;
};

module.exports = {
  initDoctorDb,
  closeDoctorDb,
  markIncompleteRunsFailed,
  getDoctorMeta,
  setDoctorMeta,
  getInitialWorkspaceBaseline,
  setInitialWorkspaceBaseline,
  createDoctorRun,
  completeDoctorRun,
  insertDoctorCards,
  getDoctorRun,
  getLatestDoctorRun,
  listDoctorRuns,
  listDoctorCards,
  getDoctorCardsByRunId: getCardsByRunId,
  getDoctorCard,
  updateDoctorCardStatus,
};
