import { h } from "https://esm.sh/preact";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { fetchEnvVars, saveEnvVars } from "../lib/api.js";
import { showToast } from "./toast.js";
import { SecretInput } from "./secret-input.js";
import { PageHeader } from "./page-header.js";
import { ActionButton } from "./action-button.js";
import { PopActions } from "./pop-actions.js";
import { PaneShell } from "./pane-shell.js";
import {
  Brain2LineIcon,
  ChatVoiceLineIcon,
  ChevronDownIcon,
  ImageAiLineIcon,
  TextToSpeechLineIcon,
} from "./icons.js";
import { Tooltip } from "./tooltip.js";
const html = htm.bind(h);

const kGroupLabels = {
  ai: "AI Provider Keys",
  github: "GitHub",
  channels: "Channels",
  tools: "Tools",
  custom: "Custom",
};

const kGroupOrder = ["ai", "github", "channels", "tools", "custom"];
const kDefaultVisibleAiKeys = new Set(["OPENAI_API_KEY", "GEMINI_API_KEY"]);
const kFeatureIconByName = {
  Embeddings: {
    Icon: Brain2LineIcon,
    label: "Memory embeddings",
  },
  Image: {
    Icon: ImageAiLineIcon,
    label: "Image generation",
  },
  TTS: {
    Icon: TextToSpeechLineIcon,
    label: "Text to speech",
  },
  STT: {
    Icon: ChatVoiceLineIcon,
    label: "Speech to text",
  },
};
const normalizeEnvVarKey = (raw) =>
  raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
const kManagedChannelTokenPattern =
  /^(?:TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN|SLACK_BOT_TOKEN|SLACK_APP_TOKEN)(?:_[A-Z0-9_]+)?$/;
const stripSurroundingQuotes = (raw) => {
  const value = String(raw || "").trim();
  if (value.length < 2) return value;
  const startsWithDouble = value.startsWith('"');
  const endsWithDouble = value.endsWith('"');
  if (startsWithDouble && endsWithDouble) return value.slice(1, -1);
  const startsWithSingle = value.startsWith("'");
  const endsWithSingle = value.endsWith("'");
  if (startsWithSingle && endsWithSingle) return value.slice(1, -1);
  return value;
};
const isManagedChannelTokenKey = (key = "") =>
  kManagedChannelTokenPattern.test(
    String(key || "")
      .trim()
      .toUpperCase(),
  );
const getVarsSignature = (items) =>
  JSON.stringify(
    (items || [])
      .map((v) => ({
        key: String(v?.key || ""),
        value: String(v?.value || ""),
      }))
      .sort((a, b) => a.key.localeCompare(b.key)),
  );

const sortCustomVarsAlphabetically = (items) => {
  const list = Array.isArray(items) ? [...items] : [];
  const customSorted = list
    .filter((item) => (item?.group || "custom") === "custom")
    .sort((a, b) => String(a?.key || "").localeCompare(String(b?.key || "")));
  let customIdx = 0;
  return list.map((item) => {
    if ((item?.group || "custom") !== "custom") return item;
    const next = customSorted[customIdx];
    customIdx += 1;
    return next;
  });
};

const kHintByKey = {
  ANTHROPIC_API_KEY: html`from${" "}
    <a
      href="https://console.anthropic.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >console.anthropic.com</a
    >`,
  ANTHROPIC_TOKEN: html`from
    <code class="text-xs bg-black/30 px-1 rounded">claude setup-token</code>`,
  OPENAI_API_KEY: html`from${" "}
    <a
      href="https://platform.openai.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >platform.openai.com</a
    >`,
  GEMINI_API_KEY: html`from${" "}
    <a
      href="https://aistudio.google.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >aistudio.google.com</a
    >`,
  ELEVENLABS_API_KEY: html`from${" "}
    <a
      href="https://elevenlabs.io"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >elevenlabs.io</a
    >${" "} · ${" "}
    <code class="text-xs bg-black/30 px-1 rounded">XI_API_KEY</code> also
    supported`,
  GITHUB_WORKSPACE_REPO: html`use
    <code class="text-xs bg-black/30 px-1 rounded">owner/repo</code> or
    <code class="text-xs bg-black/30 px-1 rounded"
      >https://github.com/owner/repo</code
    >`,
  TELEGRAM_BOT_TOKEN: html`from${" "}
    <a
      href="https://t.me/BotFather"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >@BotFather</a
    >
    ·
    <a
      href="https://docs.openclaw.ai/channels/telegram"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >full guide</a
    >`,
  DISCORD_BOT_TOKEN: html`from${" "}
    <a
      href="https://discord.com/developers/applications"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >developer portal</a
    >
    ·
    <a
      href="https://docs.openclaw.ai/channels/discord"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >full guide</a
    >`,
  MISTRAL_API_KEY: html`from${" "}
    <a
      href="https://console.mistral.ai"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >console.mistral.ai</a
    >`,
  VOYAGE_API_KEY: html`from${" "}
    <a
      href="https://dash.voyageai.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >dash.voyageai.com</a
    >`,
  GROQ_API_KEY: html`from${" "}
    <a
      href="https://console.groq.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >console.groq.com</a
    >`,
  DEEPGRAM_API_KEY: html`from${" "}
    <a
      href="https://console.deepgram.com"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >console.deepgram.com</a
    >`,
  BRAVE_API_KEY: html`from${" "}
    <a
      href="https://brave.com/search/api/"
      target="_blank"
      class="hover:underline"
      style="color: var(--accent-link)"
      >brave.com/search/api</a
    >${" "} — free tier available`,
};

const getHintContent = (envVar) => kHintByKey[envVar.key] || envVar.hint || "";

const getVisibleFeatureIcons = (envVar) =>
  (Array.isArray(envVar?.features) ? envVar.features : []).filter(
    (feature) => !!kFeatureIconByName[feature],
  );

const splitAiVars = (items) => {
  const visible = [];
  const hidden = [];
  (items || []).forEach((item) => {
    const hasValue = !!String(item?.value || "").trim();
    if (kDefaultVisibleAiKeys.has(item?.key) || hasValue) {
      visible.push(item);
      return;
    }
    hidden.push(item);
  });
  return { visible, hidden };
};

const FeatureIcon = ({ feature }) => {
  const entry = kFeatureIconByName[feature];
  if (!entry) return null;
  const { Icon, label } = entry;
  return html`
    <${Tooltip} text=${label} widthClass="w-auto" tooltipClassName="whitespace-nowrap">
      <span
        class="inline-flex items-center justify-center text-gray-500 hover:text-gray-300 focus-within:text-gray-300"
        tabindex="0"
        aria-label=${label}
      >
        <${Icon} className="w-3.5 h-3.5" />
      </span>
    </${Tooltip}>
  `;
};

const EnvRow = ({ envVar, onChange, onDelete, disabled }) => {
  const hint = getHintContent(envVar);
  const featureIcons = getVisibleFeatureIcons(envVar);

  return html`
    <div class="flex items-start gap-4 px-4 py-3">
      <div class="shrink-0" style="width: 200px">
        <div class="flex items-center gap-2 pt-1.5">
          <span
            class="inline-block w-1.5 h-1.5 rounded-full shrink-0 ${envVar.value
              ? "bg-green-500"
              : "bg-gray-600"}"
          />
          <code class="text-sm truncate">${envVar.key}</code>
        </div>
        ${featureIcons.length > 0
          ? html`
              <div class="flex items-center gap-2 mt-1 pl-3.5">
                ${featureIcons.map(
                  (feature) =>
                    html`<${FeatureIcon} key=${feature} feature=${feature} />`,
                )}
              </div>
            `
          : null}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1">
          <${SecretInput}
            value=${envVar.value}
            onInput=${(e) => onChange(envVar.key, e.target.value)}
            placeholder=${envVar.value ? "" : "not set"}
            isSecret=${!!envVar.value}
            inputClass="flex-1 min-w-0 bg-black/30 border border-border rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
            disabled=${disabled}
          />
          ${envVar.group === "custom"
            ? html`<button
                onclick=${() => onDelete(envVar.key)}
                class="text-gray-600 hover:text-red-400 px-1 text-xs shrink-0"
                title="Delete"
              >
                ✕
              </button>`
            : null}
        </div>
        ${hint ? html`<p class="text-xs text-gray-600 mt-1">${hint}</p>` : null}
      </div>
    </div>
  `;
};

export const Envars = ({ onRestartRequired = () => {} }) => {
  const [vars, setVars] = useState([]);
  const [reservedKeys, setReservedKeys] = useState(() => new Set());
  const [pendingCustomKeys, setPendingCustomKeys] = useState([]);
  const [secretMaskEpoch, setSecretMaskEpoch] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAllAiKeys, setShowAllAiKeys] = useState(false);
  const [newKey, setNewKey] = useState("");
  const baselineSignatureRef = useRef("[]");

  const load = useCallback(async () => {
    try {
      const data = await fetchEnvVars();
      const nextVars = sortCustomVarsAlphabetically(data.vars || []);
      baselineSignatureRef.current = getVarsSignature(nextVars);
      setVars(nextVars);
      setPendingCustomKeys([]);
      setReservedKeys(new Set(data.reservedKeys || []));
      onRestartRequired(!!data.restartRequired);
    } catch (err) {
      console.error("Failed to load env vars:", err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setDirty(getVarsSignature(vars) !== baselineSignatureRef.current);
  }, [vars]);

  const handleChange = (key, value) => {
    setVars((prev) => prev.map((v) => (v.key === key ? { ...v, value } : v)));
  };

  const handleDelete = (key) => {
    setVars((prev) => prev.filter((v) => v.key !== key));
    setPendingCustomKeys((prev) =>
      prev.filter((pendingKey) => pendingKey !== key),
    );
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const toSave = vars
        .filter((v) => v.editable && !isManagedChannelTokenKey(v?.key))
        .map((v) => ({ key: v.key, value: v.value }));
      const result = await saveEnvVars(toSave);
      const needsRestart = !!result?.restartRequired;
      if (needsRestart) onRestartRequired(true);
      showToast(
        needsRestart
          ? "Environment variables saved. Restart gateway to apply."
          : "Environment variables saved",
        "success",
      );
      const sortedVars = sortCustomVarsAlphabetically(vars);
      setVars(sortedVars);
      setPendingCustomKeys([]);
      setSecretMaskEpoch((prev) => prev + 1);
      baselineSignatureRef.current = getVarsSignature(sortedVars);
      setDirty(false);
    } catch (err) {
      showToast("Failed to save: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const [newVal, setNewVal] = useState("");

  const parsePaste = (input) => {
    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !l.startsWith("#"));
    const pairs = [];
    for (const line of lines) {
      const eqIdx = line.indexOf("=");
      if (eqIdx > 0)
        pairs.push({
          key: line.slice(0, eqIdx).trim(),
          value: stripSurroundingQuotes(line.slice(eqIdx + 1)),
        });
    }
    return pairs;
  };

  const addVars = (pairs) => {
    let added = 0;
    const blocked = [];
    const managedChannelKeys = [];
    const addedCustomKeys = [];
    setVars((prev) => {
      const next = [...prev];
      for (const { key: rawKey, value } of pairs) {
        const key = normalizeEnvVarKey(rawKey);
        if (!key) continue;
        if (isManagedChannelTokenKey(key)) {
          managedChannelKeys.push(key);
          continue;
        }
        if (reservedKeys.has(key)) {
          blocked.push(key);
          continue;
        }
        const existing = next.find((v) => v.key === key);
        if (existing) {
          existing.value = value;
        } else {
          next.push({
            key,
            value,
            label: key,
            group: "custom",
            hint: "",
            source: "env_file",
            editable: true,
          });
          addedCustomKeys.push(key);
        }
        added++;
      }
      return next;
    });
    if (addedCustomKeys.length) {
      setPendingCustomKeys((prev) => [...prev, ...addedCustomKeys]);
    }
    return { added, blocked, managedChannelKeys };
  };

  const handlePaste = (e, fallbackField) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    const pairs = parsePaste(text);
    if (pairs.length > 1) {
      e.preventDefault();
      const { added, blocked, managedChannelKeys } = addVars(pairs);
      setNewKey("");
      setNewVal("");
      if (blocked.length) {
        const uniqueBlocked = Array.from(new Set(blocked));
        showToast(
          `Reserved vars can't be added: ${uniqueBlocked.join(", ")}`,
          "error",
        );
      }
      if (managedChannelKeys.length) {
        const uniqueManagedKeys = Array.from(new Set(managedChannelKeys));
        showToast(
          `Channel tokens are managed from Channels: ${uniqueManagedKeys.join(", ")}`,
          "error",
        );
      }
      if (added) {
        showToast(
          `Added ${added} variable${added !== 1 ? "s" : ""}`,
          "success",
        );
      }
      return;
    }
    if (pairs.length === 1) {
      e.preventDefault();
      setNewKey(pairs[0].key);
      setNewVal(pairs[0].value);
      return;
    }
  };

  const handleKeyInput = (raw) => {
    const pairs = parsePaste(raw);
    if (pairs.length === 1) {
      setNewKey(pairs[0].key);
      setNewVal(pairs[0].value);
      return;
    }
    setNewKey(raw);
  };

  const handleValInput = (raw) => {
    const pairs = parsePaste(raw);
    if (pairs.length === 1) {
      setNewKey(pairs[0].key);
      setNewVal(pairs[0].value);
      return;
    }
    setNewVal(raw);
  };

  const handleAddVar = () => {
    const key = normalizeEnvVarKey(newKey);
    if (!key) return;
    if (isManagedChannelTokenKey(key)) {
      showToast(`Channel tokens are managed from Channels: ${key}`, "error");
      return;
    }
    if (reservedKeys.has(key)) {
      showToast(`Reserved var can't be added: ${key}`, "error");
      return;
    }
    addVars([{ key, value: newVal }]);
    setNewKey("");
    setNewVal("");
  };

  const visibleVars = vars.filter((v) => !isManagedChannelTokenKey(v?.key));

  // Group vars
  const grouped = {};
  for (const v of visibleVars) {
    const g = v.group || "custom";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(v);
  }
  if (grouped.custom?.length) {
    const pending = new Set(pendingCustomKeys);
    const nonPending = grouped.custom
      .filter((item) => !pending.has(item.key))
      .sort((a, b) => String(a?.key || "").localeCompare(String(b?.key || "")));
    const pendingAtBottom = grouped.custom.filter((item) =>
      pending.has(item.key),
    );
    grouped.custom = [...nonPending, ...pendingAtBottom];
  }
  const aiSplit = splitAiVars(grouped.ai || []);
  const renderEnvRows = (items) =>
    items.map(
      (v) =>
        html`<${EnvRow}
          key=${`${secretMaskEpoch}:${v.key}`}
          envVar=${v}
          onChange=${handleChange}
          onDelete=${handleDelete}
          disabled=${saving}
        />`,
    );
  const renderGroupCard = (groupKey) => {
    const items = grouped[groupKey] || [];
    if (!items.length) return null;
    if (groupKey === "ai") {
      const { visible, hidden } = aiSplit;
      const expanded = showAllAiKeys && hidden.length > 0;
      return html`
        <div class="bg-surface border border-border rounded-xl overflow-hidden">
          <h3 class="card-label text-xs px-4 pt-3 pb-2">
            ${kGroupLabels[groupKey] || groupKey}
          </h3>
          <div class="divide-y divide-border">${renderEnvRows(visible)}</div>
          ${hidden.length > 0
            ? html`
                <div class="border-t border-border px-4 py-2">
                  <button
                    type="button"
                    onclick=${() => setShowAllAiKeys((prev) => !prev)}
                    class="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300"
                  >
                    <${ChevronDownIcon}
                      className=${`transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                    ${expanded ? "Show fewer" : `Show more (${hidden.length})`}
                  </button>
                </div>
              `
            : null}
          ${expanded
            ? html`<div class="divide-y divide-border border-t border-border">
                ${renderEnvRows(hidden)}
              </div>`
            : null}
        </div>
      `;
    }
    return html`
      <div class="bg-surface border border-border rounded-xl overflow-hidden">
        <h3 class="card-label text-xs px-4 pt-3 pb-2">
          ${kGroupLabels[groupKey] || groupKey}
        </h3>
        <div class="divide-y divide-border">${renderEnvRows(items)}</div>
      </div>
    `;
  };

  return html`
    <${PaneShell}
      header=${html`
        <${PageHeader}
          title="Envars"
          actions=${html`
            <${PopActions} visible=${dirty}>
              <${ActionButton}
                onClick=${load}
                disabled=${saving}
                tone="secondary"
                size="sm"
                idleLabel="Cancel"
                className="text-xs"
              />
              <${ActionButton}
                onClick=${handleSave}
                disabled=${saving}
                loading=${saving}
                loadingMode="inline"
                tone="primary"
                size="sm"
                idleLabel="Save changes"
                loadingLabel="Saving…"
                className="text-xs"
              />
            </${PopActions}>
          `}
        />
      `}
    >
      ${kGroupOrder
        .filter((g) => grouped[g]?.length)
        .map((g) => renderGroupCard(g))}

      <div
        class="bg-surface border border-border rounded-xl overflow-hidden"
      >
        <div class="flex items-center justify-between px-4 pt-3 pb-2">
          <h3 class="card-label text-xs">Add Variable</h3>
          <span class="text-xs" style="color: var(--text-dim)"
            >Paste KEY=VALUE or multiple lines</span
          >
        </div>
        <div
          class="flex items-start gap-4 px-4 py-3 border-t border-border"
        >
          <div class="shrink-0" style="width: 200px">
            <input
              type="text"
              value=${newKey}
              placeholder="KEY"
              onInput=${(e) => handleKeyInput(e.target.value)}
              onPaste=${(e) => handlePaste(e, "key")}
              onKeyDown=${(e) => e.key === "Enter" && handleAddVar()}
              class="w-full bg-black/30 border border-border rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono uppercase"
            />
          </div>
          <div class="flex-1 flex gap-2">
            <input
              type="text"
              value=${newVal}
              placeholder="value"
              onInput=${(e) => handleValInput(e.target.value)}
              onPaste=${(e) => handlePaste(e, "val")}
              onKeyDown=${(e) => e.key === "Enter" && handleAddVar()}
              class="flex-1 bg-black/30 border border-border rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
            />
            <button
              onclick=${handleAddVar}
              class="text-xs px-3 py-1.5 rounded-lg border border-border text-gray-400 hover:text-gray-200 hover:border-gray-500 shrink-0"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </${PaneShell}>
  `;
};
