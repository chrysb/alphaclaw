const { kSqliteTablePageSize } = require("./constants");

const quoteSqliteIdentifier = (value) =>
  `"${String(value || "").replaceAll('"', '""')}"`;

const readSqliteSummary = (targetPath) => {
  let DatabaseSync = null;
  try {
    ({ DatabaseSync } = require("node:sqlite"));
  } catch {
    throw new Error("SQLite preview is unavailable on this Node runtime");
  }
  const database = new DatabaseSync(targetPath, { readOnly: true });
  try {
    const allObjects = database
      .prepare(
        `
          SELECT name, type
          FROM sqlite_master
          WHERE type IN ('table', 'view')
            AND name NOT LIKE 'sqlite_%'
          ORDER BY type, name
        `,
      )
      .all();
    const maxObjects = 12;
    const objects = allObjects.slice(0, maxObjects).map((entry) => {
      const objectName = String(entry?.name || "").trim();
      const objectType = String(entry?.type || "table").trim() || "table";
      if (!objectName) return null;
      const quotedName = quoteSqliteIdentifier(objectName);
      const columns = database
        .prepare(`PRAGMA table_info(${quotedName})`)
        .all()
        .map((column) => ({
          name: String(column?.name || "").trim(),
          type: String(column?.type || "").trim(),
          notNull: Number(column?.notnull || 0) === 1,
          isPrimaryKey: Number(column?.pk || 0) > 0,
        }));
      let sampleRows = [];
      if (objectType === "table") {
        try {
          sampleRows = database.prepare(`SELECT * FROM ${quotedName} LIMIT 5`).all();
        } catch {
          sampleRows = [];
        }
      }
      return {
        name: objectName,
        type: objectType,
        columns,
        sampleRows,
      };
    });
    return {
      totalObjects: allObjects.length,
      truncated: allObjects.length > maxObjects,
      objects: objects.filter(Boolean),
    };
  } finally {
    database.close();
  }
};

const clampSqlitePageValue = (value, fallbackValue, maxValue) => {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsedValue)) return fallbackValue;
  return Math.max(0, Math.min(maxValue, parsedValue));
};

const readSqliteTableData = (targetPath, tableName, limit, offset) => {
  const safeTableName = String(tableName || "").trim();
  if (!safeTableName) {
    return { ok: false, error: "table is required" };
  }
  let DatabaseSync = null;
  try {
    ({ DatabaseSync } = require("node:sqlite"));
  } catch {
    return { ok: false, error: "SQLite preview is unavailable on this Node runtime" };
  }
  const database = new DatabaseSync(targetPath, { readOnly: true });
  try {
    const quotedTableName = quoteSqliteIdentifier(safeTableName);
    const tableExists = database
      .prepare(
        `
          SELECT 1
          FROM sqlite_master
          WHERE type IN ('table', 'view')
            AND name = ?
          LIMIT 1
        `,
      )
      .get(safeTableName);
    if (!tableExists) {
      return { ok: false, error: "table not found" };
    }
    const columns = database
      .prepare(`PRAGMA table_info(${quotedTableName})`)
      .all()
      .map((column) => ({
        name: String(column?.name || "").trim(),
        type: String(column?.type || "").trim(),
        notNull: Number(column?.notnull || 0) === 1,
        isPrimaryKey: Number(column?.pk || 0) > 0,
      }));
    const totalRowsResult = database
      .prepare(`SELECT COUNT(*) AS count FROM ${quotedTableName}`)
      .get();
    const totalRows = Number(totalRowsResult?.count || 0);
    const safeLimit =
      clampSqlitePageValue(limit, kSqliteTablePageSize, 200) || kSqliteTablePageSize;
    const safeOffset = clampSqlitePageValue(offset, 0, Number.MAX_SAFE_INTEGER);
    const rows = database
      .prepare(`SELECT * FROM ${quotedTableName} LIMIT ? OFFSET ?`)
      .all(safeLimit, safeOffset);
    return {
      ok: true,
      table: safeTableName,
      columns,
      rows,
      limit: safeLimit,
      offset: safeOffset,
      totalRows,
    };
  } catch (error) {
    return { ok: false, error: error.message || "Could not read sqlite table" };
  } finally {
    database.close();
  }
};

module.exports = {
  quoteSqliteIdentifier,
  readSqliteSummary,
  clampSqlitePageValue,
  readSqliteTableData,
};
