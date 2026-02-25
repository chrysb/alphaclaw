import { h } from "https://esm.sh/preact";
import { useState, useEffect, useRef } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  runOnboard,
  fetchModels,
  fetchCodexStatus,
  disconnectCodex,
  exchangeCodexOAuth,
} from "../lib/api.js";
import {
  getModelProvider,
  getFeaturedModels,
  getVisibleAiFieldKeys,
  kAllAiAuthFields,
} from "../lib/model-config.js";
const html = htm.bind(h);

const kGroups = [
  {
    id: "ai",
    title: "Primary Agent Model",
    description: "Choose your main model and authenticate its provider",
    fields: kAllAiAuthFields,
    validate: (vals, ctx = {}) => !!(vals.MODEL_KEY && ctx.hasAi),
  },
  {
    id: "github",
    title: "GitHub",
    description: "Backs up your agent's config and workspace",
    fields: [
      {
        key: "GITHUB_TOKEN",
        label: "Personal Access Token",
        hint: html`Create a classic PAT at${" "}<a
            href="https://github.com/settings/tokens"
            target="_blank"
            class="text-blue-400 hover:underline"
            >github.com/settings/tokens</a
          >${" "}with${" "}<code class="text-xs bg-black/30 px-1 rounded">repo</code>${" "}scope`,
        placeholder: "ghp_...",
      },
      {
        key: "GITHUB_WORKSPACE_REPO",
        label: "Workspace Repo",
        hint: "A new private repo will be created for you",
        placeholder: "username/my-agent",
        isText: true,
      },
    ],
    validate: (vals) => !!(vals.GITHUB_TOKEN && vals.GITHUB_WORKSPACE_REPO),
  },
  {
    id: "channels",
    title: "Channels",
    description: "At least one is required to talk to your agent",
    fields: [
      {
        key: "TELEGRAM_BOT_TOKEN",
        label: "Telegram Bot Token",
        hint: html`From${" "}<a
            href="https://t.me/BotFather"
            target="_blank"
            class="text-blue-400 hover:underline"
            >@BotFather</a
          >${" "}·${" "}<a
            href="https://docs.openclaw.ai/channels/telegram"
            target="_blank"
            class="text-blue-400 hover:underline"
            >full guide</a
          >`,
        placeholder: "123456789:AAH...",
      },
      {
        key: "DISCORD_BOT_TOKEN",
        label: "Discord Bot Token",
        hint: html`From${" "}<a
            href="https://discord.com/developers/applications"
            target="_blank"
            class="text-blue-400 hover:underline"
            >Developer Portal</a
          >${" "}·${" "}<a
            href="https://docs.openclaw.ai/channels/discord"
            target="_blank"
            class="text-blue-400 hover:underline"
            >full guide</a
          >`,
        placeholder: "MTQ3...",
      },
    ],
    validate: (vals) => !!(vals.TELEGRAM_BOT_TOKEN || vals.DISCORD_BOT_TOKEN),
  },
  {
    id: "tools",
    title: "Tools (optional)",
    description: "Enable extra capabilities for your agent",
    fields: [
      {
        key: "BRAVE_API_KEY",
        label: "Brave Search API Key",
        hint: html`From${" "}<a
            href="https://brave.com/search/api/"
            target="_blank"
            class="text-blue-400 hover:underline"
            >brave.com/search/api</a
          >${" "}-${" "}free tier available`,
        placeholder: "BSA...",
      },
    ],
    validate: () => true,
  },
];

export const Welcome = ({ onComplete }) => {
  const [vals, setVals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("openclaw_setup") || "{}");
    } catch {
      return {};
    }
  });
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(null);
  const [showAllModels, setShowAllModels] = useState(false);
  const [codexStatus, setCodexStatus] = useState({ connected: false });
  const [codexLoading, setCodexLoading] = useState(true);
  const [codexManualInput, setCodexManualInput] = useState("");
  const [codexExchanging, setCodexExchanging] = useState(false);
  const [codexAuthStarted, setCodexAuthStarted] = useState(false);
  const [codexAuthWaiting, setCodexAuthWaiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const codexPopupPollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("openclaw_setup", JSON.stringify(vals));
  }, [vals]);

  useEffect(() => {
    fetchModels()
      .then((result) => {
        const list = Array.isArray(result.models) ? result.models : [];
        const featured = getFeaturedModels(list);
        setModels(list);
        if (!vals.MODEL_KEY && list.length > 0) {
          const defaultModel = featured[0] || list[0];
          setVals((prev) => ({ ...prev, MODEL_KEY: defaultModel.key }));
        }
      })
      .catch(() => setModelsError("Failed to load models"))
      .finally(() => setModelsLoading(false));
  }, []);

  const refreshCodexStatus = async () => {
    try {
      const status = await fetchCodexStatus();
      setCodexStatus(status);
      if (status?.connected) {
        setCodexAuthStarted(false);
        setCodexAuthWaiting(false);
      }
    } catch {
      setCodexStatus({ connected: false });
    } finally {
      setCodexLoading(false);
    }
  };

  useEffect(() => {
    refreshCodexStatus();
  }, []);

  useEffect(() => {
    const onMessage = async (e) => {
      if (e.data?.codex === "success") {
        await refreshCodexStatus();
      }
      if (e.data?.codex === "error") {
        setError(`Codex auth failed: ${e.data.message || "unknown error"}`);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(
    () => () => {
      if (codexPopupPollRef.current) {
        clearInterval(codexPopupPollRef.current);
        codexPopupPollRef.current = null;
      }
    },
    [],
  );

  const set = (key, value) => setVals((prev) => ({ ...prev, [key]: value }));

  const selectedProvider = getModelProvider(vals.MODEL_KEY);
  const featuredModels = getFeaturedModels(models);
  const baseModelOptions = showAllModels
    ? models
    : featuredModels.length > 0
      ? featuredModels
      : models;
  const selectedModelOption = models.find(
    (model) => model.key === vals.MODEL_KEY,
  );
  const modelOptions =
    selectedModelOption &&
    !baseModelOptions.some((model) => model.key === selectedModelOption.key)
      ? [...baseModelOptions, selectedModelOption]
      : baseModelOptions;
  const canToggleFullCatalog =
    featuredModels.length > 0 && models.length > featuredModels.length;
  const visibleAiFieldKeys = getVisibleAiFieldKeys(selectedProvider);
  const hasAi =
    selectedProvider === "anthropic"
      ? !!(vals.ANTHROPIC_API_KEY || vals.ANTHROPIC_TOKEN)
      : selectedProvider === "openai"
        ? !!vals.OPENAI_API_KEY
        : selectedProvider === "google"
          ? !!vals.GEMINI_API_KEY
          : selectedProvider === "openai-codex"
            ? !!(codexStatus.connected || vals.OPENAI_API_KEY)
            : false;

  const allValid = kGroups.every((g) => g.validate(vals, { hasAi }));

  const startCodexAuth = () => {
    if (codexStatus.connected) return;
    setCodexAuthStarted(true);
    setCodexAuthWaiting(true);
    const authUrl = "/auth/codex/start";
    const popup = window.open(
      authUrl,
      "codex-auth",
      "popup=yes,width=640,height=780",
    );
    if (!popup || popup.closed) {
      setCodexAuthWaiting(false);
      window.location.href = authUrl;
      return;
    }
    if (codexPopupPollRef.current) {
      clearInterval(codexPopupPollRef.current);
    }
    codexPopupPollRef.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(codexPopupPollRef.current);
        codexPopupPollRef.current = null;
        setCodexAuthWaiting(false);
      }
    }, 500);
  };

  const completeCodexAuth = async () => {
    if (!codexManualInput.trim() || codexExchanging) return;
    setCodexExchanging(true);
    setError(null);
    try {
      const result = await exchangeCodexOAuth(codexManualInput.trim());
      if (!result.ok)
        throw new Error(result.error || "Codex OAuth exchange failed");
      setCodexManualInput("");
      setCodexAuthStarted(false);
      setCodexAuthWaiting(false);
      await refreshCodexStatus();
    } catch (err) {
      setError(err.message || "Codex OAuth exchange failed");
    } finally {
      setCodexExchanging(false);
    }
  };

  const handleCodexDisconnect = async () => {
    const result = await disconnectCodex();
    if (!result.ok) {
      setError(result.error || "Failed to disconnect Codex");
      return;
    }
    setCodexAuthStarted(false);
    setCodexAuthWaiting(false);
    setCodexManualInput("");
    await refreshCodexStatus();
  };

  const handleSubmit = async () => {
    if (!allValid || loading) return;
    setLoading(true);
    setError(null);

    try {
      const vars = Object.entries(vals)
        .filter(([key]) => key !== "MODEL_KEY")
        .filter(([, v]) => v)
        .map(([key, value]) => ({ key, value }));
      const result = await runOnboard(vars, vals.MODEL_KEY);
      if (!result.ok) throw new Error(result.error || "Onboarding failed");
      localStorage.removeItem("openclaw_setup");
      onComplete();
    } catch (err) {
      console.error("Onboard error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return html`
      <div
        class="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50"
      >
        <div class="flex flex-col items-center gap-4">
          <svg
            class="animate-spin h-8 w-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <h2 class="text-lg font-semibold text-white">
            Initializing OpenClaw
          </h2>
          <p class="text-sm text-gray-500">This could take 10–15 seconds</p>
        </div>
      </div>
    `;
  }

  return html`
    <div class="max-w-lg w-full space-y-4">
      <div class="flex items-center gap-3">
        <div class="text-4xl">🦞</div>
        <div>
          <h1 class="text-2xl font-semibold">Welcome to OpenClaw</h1>
          <p class="text-gray-500 text-sm">Let's get your agent running</p>
        </div>
      </div>

      ${kGroups.map(
        (group) => html`
          <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-sm font-medium text-gray-200">
                  ${group.title}
                </h2>
                <p class="text-xs text-gray-500">${group.description}</p>
              </div>
              ${group.validate(vals, { hasAi })
                ? html`<span
                    class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-900/50 text-green-400"
                    >✓</span
                  >`
                : group.id !== "tools"
                  ? html`<span
                      class="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400"
                      >Required</span
                    >`
                  : null}
            </div>

            ${group.id === "ai" &&
            html`
              <div class="space-y-1">
                <label class="text-xs font-medium text-gray-400">Model</label>
                <select
                  value=${vals.MODEL_KEY || ""}
                  onInput=${(e) => set("MODEL_KEY", e.target.value)}
                  class="w-full bg-black/30 border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
                >
                  <option value="">Select a model</option>
                  ${modelOptions.map(
                    (model) => html`
                      <option value=${model.key}>
                        ${model.label || model.key}
                      </option>
                    `,
                  )}
                </select>
                <p class="text-xs text-gray-600">
                  ${modelsLoading
                    ? "Loading model catalog..."
                    : modelsError
                      ? modelsError
                      : ""}
                </p>
                ${canToggleFullCatalog &&
                html`
                  <button
                    type="button"
                    onclick=${() => setShowAllModels((prev) => !prev)}
                    class="text-xs text-gray-500 hover:text-gray-300"
                  >
                    ${showAllModels
                      ? "Show recommended models"
                      : "Show full model catalog"}
                  </button>
                `}
              </div>
            `}
            ${group.id === "ai" &&
            selectedProvider === "openai-codex" &&
            html`
              <div
                class="bg-black/20 border border-border rounded-lg p-3 space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-400">Codex OAuth</span>
                  ${codexLoading
                    ? html`<span class="text-xs text-gray-500"
                        >Checking...</span
                      >`
                    : codexStatus.connected
                      ? html`<span class="text-xs text-green-400"
                          >Connected</span
                        >`
                      : html`<span class="text-xs text-yellow-400"
                          >Not connected</span
                        >`}
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onclick=${startCodexAuth}
                    class="text-xs font-medium px-3 py-1.5 rounded-lg ${codexStatus.connected
                      ? "border border-border text-gray-300 hover:border-gray-500"
                      : "bg-white text-black hover:opacity-85"}"
                  >
                    ${codexStatus.connected
                      ? "Reconnect Codex"
                      : "Connect Codex OAuth"}
                  </button>
                  ${codexStatus.connected &&
                  html`
                    <button
                      type="button"
                      onclick=${handleCodexDisconnect}
                      class="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-gray-300 hover:border-gray-500"
                    >
                      Disconnect
                    </button>
                  `}
                </div>
                ${!codexStatus.connected &&
                codexAuthStarted &&
                html`
                  <div class="space-y-1 pt-1">
                    <p class="text-xs text-gray-500">
                      ${codexAuthWaiting
                        ? "Complete login in the popup, then paste the full redirect URL from the address bar (starts with "
                        : "Paste the full redirect URL from the address bar (starts with "}
                      <code class="text-xs bg-black/30 px-1 rounded"
                        >http://localhost:1455/auth/callback</code
                      >)
                      ${codexAuthWaiting
                        ? " to finish setup."
                        : " to finish setup."}
                    </p>
                    <input
                      type="text"
                      value=${codexManualInput}
                      onInput=${(e) => setCodexManualInput(e.target.value)}
                      placeholder="http://localhost:1455/auth/callback?code=...&state=..."
                      class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-gray-500"
                    />
                    <button
                      type="button"
                      onclick=${completeCodexAuth}
                      disabled=${!codexManualInput.trim() || codexExchanging}
                      class="text-xs font-medium px-3 py-1.5 rounded-lg ${!codexManualInput.trim() ||
                      codexExchanging
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-white text-black hover:opacity-85"}"
                    >
                      ${codexExchanging
                        ? "Completing..."
                        : "Complete Codex OAuth"}
                    </button>
                  </div>
                `}
              </div>
            `}
            ${(group.id === "ai"
              ? group.fields.filter((field) =>
                  visibleAiFieldKeys.has(field.key),
                )
              : group.fields
            ).map(
              (field) => html`
                <div class="space-y-1">
                  <label class="text-xs font-medium text-gray-400"
                    >${field.label}</label
                  >
                  <input
                    type=${field.isText ? "text" : "password"}
                    placeholder=${field.placeholder || ""}
                    value=${vals[field.key] || ""}
                    onInput=${(e) => set(field.key, e.target.value)}
                    class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
                  />
                  <p class="text-xs text-gray-600">${field.hint}</p>
                </div>
              `,
            )}
          </div>
        `,
      )}
      ${error
        ? html`<div
            class="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-300 text-sm"
          >
            ${error}
          </div>`
        : null}

      <button
        onclick=${handleSubmit}
        disabled=${!allValid}
        class="w-full text-sm font-medium px-4 py-3 rounded-xl transition-all ${allValid
          ? "bg-white text-black hover:opacity-85"
          : "bg-gray-800 text-gray-500 cursor-not-allowed"}"
      >
        Complete Setup
      </button>
    </div>
  `;
};
