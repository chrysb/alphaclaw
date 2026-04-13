import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import htm from "htm";
import {
  fetchEnvVars,
  saveEnvVars,
  fetchModels,
  fetchModelStatus,
  setPrimaryModel,
  fetchCodexStatus,
  disconnectCodex,
  exchangeCodexOAuth,
} from "../lib/api.js";
import { showToast } from "./toast.js";
import { Badge } from "./badge.js";
import { SecretInput } from "./secret-input.js";
import { LoadingSpinner } from "./loading-spinner.js";
import { ActionButton } from "./action-button.js";
import {
  getModelProvider,
  getAuthProviderFromModelProvider,
  getFeaturedModels,
  kProviderAuthFields,
  kProviderLabels,
  kProviderOrder,
} from "../lib/model-config.js";
import {
  isCodexAuthCallbackMessage,
  openCodexAuthWindow,
} from "../lib/codex-oauth-window.js";

const html = htm.bind(h);

const getKeyVal = (vars, key) => vars.find((v) => v.key === key)?.value || "";
const kAiCredentialKeys = Object.values(kProviderAuthFields)
  .flat()
  .map((field) => field.key)
  .filter((key, idx, arr) => arr.indexOf(key) === idx);
let kModelsTabCache = null;

export const Models = () => {
  const [envVars, setEnvVars] = useState(() => kModelsTabCache?.envVars || []);
  const [models, setModels] = useState(() => kModelsTabCache?.models || []);
  const [selectedModel, setSelectedModel] = useState(() => kModelsTabCache?.selectedModel || "");
  const [showAllModels, setShowAllModels] = useState(() => kModelsTabCache?.showAllModels || false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [codexStatus, setCodexStatus] = useState(() => kModelsTabCache?.codexStatus || { connected: false });
  const [codexManualInput, setCodexManualInput] = useState("");
  const [codexExchanging, setCodexExchanging] = useState(false);
  const [codexAuthStarted, setCodexAuthStarted] = useState(false);
  const [codexAuthWaiting, setCodexAuthWaiting] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(() => !kModelsTabCache);
  const [modelsError, setModelsError] = useState(() => kModelsTabCache?.modelsError || "");
  const [ready, setReady] = useState(() => !!kModelsTabCache);
  const [savedModel, setSavedModel] = useState(() => kModelsTabCache?.savedModel || "");
  const [modelDirty, setModelDirty] = useState(false);
  const [savedAiValues, setSavedAiValues] = useState(() => kModelsTabCache?.savedAiValues || {});
  const codexExchangeInFlightRef = useRef(false);
  const codexPopupPollRef = useRef(null);

  const refresh = async () => {
    if (!ready) setModelsLoading(true);
    setModelsError("");
    try {
      const [env, modelCatalog, modelStatus, codex] = await Promise.all([
        fetchEnvVars(),
        fetchModels(),
        fetchModelStatus(),
        fetchCodexStatus(),
      ]);
      setEnvVars(env.vars || []);
      const catalogModels = Array.isArray(modelCatalog.models) ? modelCatalog.models : [];
      setModels(catalogModels);
      const currentModel = modelStatus.modelKey || "";
      setSelectedModel(currentModel);
      setCodexStatus(codex || { connected: false });
      setSavedModel(currentModel);
      setModelDirty(false);
      const nextSavedAiValues = Object.fromEntries(
        kAiCredentialKeys.map((key) => [key, getKeyVal(env.vars || [], key)]),
      );
      setSavedAiValues(nextSavedAiValues);
      const nextModelsError = catalogModels.length ? "" : "No models found";
      setModelsError(nextModelsError);
      kModelsTabCache = {
        envVars: env.vars || [],
        models: catalogModels,
        selectedModel: currentModel,
        savedModel: currentModel,
        savedAiValues: nextSavedAiValues,
        codexStatus: codex || { connected: false },
        showAllModels,
        modelsError: nextModelsError,
      };
    } catch (err) {
      setModelsError("Failed to load model settings");
      showToast(`Failed to load model settings: ${err.message}`, "error");
    } finally {
      setReady(true);
      setModelsLoading(false);
    }
  };

  const refreshCodexConnection = async () => {
    try {
      const codex = await fetchCodexStatus();
      setCodexStatus(codex || { connected: false });
      if (codex?.connected) {
        setCodexAuthStarted(false);
        setCodexAuthWaiting(false);
      }
      kModelsTabCache = { ...(kModelsTabCache || {}), codexStatus: codex || { connected: false } };
    } catch {
      setCodexStatus({ connected: false });
      kModelsTabCache = { ...(kModelsTabCache || {}), codexStatus: { connected: false } };
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => () => {
    if (codexPopupPollRef.current) {
      clearInterval(codexPopupPollRef.current);
      codexPopupPollRef.current = null;
    }
  }, []);

  const submitCodexAuthInput = async (input) => {
    const normalizedInput = String(input || "").trim();
    if (!normalizedInput || codexExchangeInFlightRef.current) return;
    codexExchangeInFlightRef.current = true;
    setCodexManualInput(normalizedInput);
    setCodexExchanging(true);
    try {
      const result = await exchangeCodexOAuth(normalizedInput);
      if (!result.ok) throw new Error(result.error || "Codex OAuth exchange failed");
      setCodexManualInput("");
      showToast("Codex connected", "success");
      setCodexAuthStarted(false);
      setCodexAuthWaiting(false);
      await refreshCodexConnection();
    } catch (err) {
      setCodexAuthWaiting(false);
      showToast(err.message || "Codex OAuth exchange failed", "error");
    } finally {
      codexExchangeInFlightRef.current = false;
      setCodexExchanging(false);
    }
  };

  useEffect(() => {
    const onMessage = async (e) => {
      if (e.data?.codex === "success") {
        showToast("Codex connected", "success");
        await refreshCodexConnection();
      } else if (isCodexAuthCallbackMessage(e.data)) {
        await submitCodexAuthInput(e.data.input);
      } else if (e.data?.codex === "error") {
        showToast(`Codex auth failed: ${e.data.message || "unknown error"}`, "error");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [submitCodexAuthInput]);

  const setEnvValue = (key, value) => {
    setEnvVars((prev) => {
      const existing = prev.some((entry) => entry.key === key);
      const next = existing
        ? prev.map((v) => (v.key === key ? { ...v, value } : v))
        : [...prev, { key, value, editable: true }];
      kModelsTabCache = { ...(kModelsTabCache || {}), envVars: next };
      return next;
    });
  };

  const saveChanges = async () => {
    if (savingChanges) return;
    if (!modelDirty && !aiCredentialsDirty) return;
    if (modelDirty && !hasSelectedProviderAuth) {
      showToast("Add credentials for the selected model provider before saving model changes", "error");
      return;
    }
    setSavingChanges(true);
    try {
      const targetModel = selectedModel;

      if (aiCredentialsDirty) {
        const payload = envVars
          .filter((v) => v.editable)
          .map((v) => ({ key: v.key, value: v.value }));
        const envResult = await saveEnvVars(payload);
        if (!envResult.ok) throw new Error(envResult.error || "Failed to save env vars");
      }

      if (modelDirty && targetModel) {
        const modelResult = await setPrimaryModel(targetModel);
        if (!modelResult.ok) throw new Error(modelResult.error || "Failed to set primary model");
        const status = await fetchModelStatus();
        if (status?.ok === false) {
          throw new Error(status.error || "Failed to verify primary model");
        }
        const activeModel = status?.modelKey || "";
        if (activeModel && activeModel !== targetModel) {
          throw new Error(`Primary model did not apply. Expected ${targetModel} but active is ${activeModel}`);
        }
        setSavedModel(targetModel);
        setModelDirty(false);
        kModelsTabCache = { ...(kModelsTabCache || {}), selectedModel: targetModel, savedModel: targetModel };
      }

      showToast("Changes saved", "success");
      await refresh();
    } catch (err) {
      showToast(err.message || "Failed to save changes", "error");
    } finally {
      setSavingChanges(false);
    }
  };

  const startCodexAuth = () => {
    if (codexStatus.connected) return;
    setCodexAuthStarted(true);
    setCodexAuthWaiting(true);
    const popup = openCodexAuthWindow();
    if (!popup || popup.closed) {
      setCodexAuthWaiting(false);
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
    await submitCodexAuthInput(codexManualInput);
  };

  const handleCodexDisconnect = async () => {
    const result = await disconnectCodex();
    if (!result.ok) {
      showToast(result.error || "Failed to disconnect Codex", "error");
      return;
    }
    showToast("Codex disconnected", "success");
    setCodexAuthStarted(false);
    setCodexAuthWaiting(false);
    setCodexManualInput("");
    await refreshCodexConnection();
  };

  const selectedModelProvider = getModelProvider(selectedModel);
  const selectedAuthProvider = getAuthProviderFromModelProvider(selectedModelProvider);
  const featuredModels = getFeaturedModels(models);
  const baseModelOptions = showAllModels
    ? models
    : featuredModels.length > 0
    ? featuredModels
    : models;
  const selectedModelOption = models.find((model) => model.key === selectedModel);
  const modelOptions =
    selectedModelOption &&
    !baseModelOptions.some((model) => model.key === selectedModelOption.key)
      ? [...baseModelOptions, selectedModelOption]
      : baseModelOptions;
  const canToggleFullCatalog = featuredModels.length > 0 && models.length > featuredModels.length;
  const primaryProvider = kProviderOrder.includes(selectedAuthProvider)
    ? selectedAuthProvider
    : kProviderOrder[0];
  const otherProviders = kProviderOrder.filter((provider) => provider !== primaryProvider);
  const aiCredentialsDirty = kAiCredentialKeys.some(
    (key) => getKeyVal(envVars, key) !== (savedAiValues[key] || ""),
  );
  const hasSelectedProviderAuth =
    selectedModelProvider === "openai-codex"
      ? !!codexStatus.connected
      : (kProviderAuthFields[selectedAuthProvider] || []).some((field) =>
          Boolean(getKeyVal(envVars, field.key)),
        );
  const canSaveChanges = !savingChanges && (aiCredentialsDirty || (modelDirty && hasSelectedProviderAuth));

  const renderCredentialField = (field) => html`
    <div class="space-y-1">
      <label class="text-xs font-medium text-fg-muted">${field.label}</label>
      <${SecretInput}
        value=${getKeyVal(envVars, field.key)}
        onInput=${(e) => setEnvValue(field.key, e.target.value)}
        placeholder=${field.placeholder || ""}
        isSecret=${!field.isText}
        inputClass="flex-1 w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted font-mono"
      />
      <p class="text-xs text-fg-dim">${field.hint}</p>
    </div>
  `;

  const renderProviderContent = (provider) => {
    const fields = kProviderAuthFields[provider] || [];
    const hasCodex = provider === "openai";
    return html`
      ${fields.map((field) => renderCredentialField(field))}
      ${hasCodex &&
      html`
        <div class="border border-border rounded-lg p-3 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs text-fg-muted">Codex OAuth</span>
            ${codexStatus.connected
              ? html`<${Badge} tone="success">Connected</${Badge}>`
              : html`<${Badge} tone="warning">Not connected</${Badge}>`}
          </div>
          ${codexAuthStarted
            ? html`
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs text-fg-muted">
                    ${codexAuthWaiting
                      ? "Complete login in the popup. AlphaClaw should finish automatically, but you can paste the redirect URL below if it doesn't."
                      : "Paste the redirect URL from your browser to finish connecting."}
                  </p>
                  <button
                    onclick=${startCodexAuth}
                    class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary shrink-0"
                  >
                    Restart
                  </button>
                </div>
              `
            : codexStatus.connected
            ? html`
                <div class="flex gap-2">
                  <button
                    onclick=${startCodexAuth}
                    class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary"
                  >
                    Reconnect Codex
                  </button>
                  <button
                    onclick=${handleCodexDisconnect}
                    class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-ghost"
                  >
                    Disconnect
                  </button>
                </div>
              `
            : html`
                <button
                  onclick=${startCodexAuth}
                  class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-cyan"
                >
                  Connect Codex OAuth
                </button>
              `}
          ${codexAuthStarted
            ? html`
                <p class="text-xs text-fg-muted">
                  After login, copy the full redirect URL (starts with
                  <code class="text-xs bg-field px-1 rounded">http://localhost:1455/auth/callback</code>)
                  and paste it here.
                </p>
                <input
                  type="text"
                  value=${codexManualInput}
                  onInput=${(e) => setCodexManualInput(e.target.value)}
                  placeholder="http://localhost:1455/auth/callback?code=...&state=..."
                  class="w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body outline-none focus:border-fg-muted"
                />
                <${ActionButton}
                  onClick=${completeCodexAuth}
                  disabled=${!codexManualInput.trim() || codexExchanging}
                  loading=${codexExchanging}
                  tone="primary"
                  size="sm"
                  idleLabel="Complete Codex OAuth"
                  loadingLabel="Completing..."
                  className="text-xs font-medium px-3 py-1.5"
                />
              `
            : null}
        </div>
      `}
    `;
  };

  if (!ready) {
    return html`
      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center gap-2 text-sm text-fg-muted">
          <${LoadingSpinner} className="h-4 w-4" />
          Loading model settings...
        </div>
      </div>
    `;
  }

  return html`
    <div class="space-y-4">
      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        <h2 class="font-semibold text-sm">Primary Agent Model</h2>
        <select
          value=${selectedModel}
          onInput=${(e) => {
            const next = e.target.value;
            setSelectedModel(next);
            setModelDirty(next !== savedModel);
            kModelsTabCache = { ...(kModelsTabCache || {}), selectedModel: next };
          }}
          class="w-full bg-field border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-body outline-none focus:border-fg-muted"
        >
          <option value="">Select a model</option>
          ${modelOptions.map(
            (model) => html`<option value=${model.key}>${model.label || model.key}</option>`,
          )}
        </select>
        <p class="text-xs text-fg-dim">
          ${modelsLoading ? "Loading model catalog..." : modelsError ? modelsError : ""}
        </p>
        ${canToggleFullCatalog
          ? html`
              <div>
                <button
                  type="button"
                  onclick=${() =>
                    setShowAllModels((prev) => {
                      const next = !prev;
                      kModelsTabCache = { ...(kModelsTabCache || {}), showAllModels: next };
                      return next;
                    })}
                  class="text-xs text-fg-muted hover:text-body"
                >
                  ${showAllModels ? "Show recommended models" : "Show full model catalog"}
                </button>
              </div>
            `
          : null}
        <div class="pt-2 border-t border-border space-y-3">
          ${renderProviderContent(primaryProvider)}
        </div>
      </div>

      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        <h2 class="font-semibold text-sm">Other Providers</h2>
        ${otherProviders.map(
          (provider) => html`
            <div class="bg-field border border-border rounded-lg p-3 space-y-3">
              <h3 class="text-xs font-semibold text-body">${kProviderLabels[provider] || provider}</h3>
              ${renderProviderContent(provider)}
            </div>
          `,
        )}
      </div>

      <${ActionButton}
        onClick=${saveChanges}
        disabled=${!canSaveChanges}
        loading=${savingChanges}
        tone="primary"
        size="md"
        idleLabel="Save changes"
        loadingLabel="Saving..."
        className="w-full py-2.5 transition-all"
      />
      ${modelDirty && !hasSelectedProviderAuth
        ? html`
            <p class="text-xs text-status-warning-muted">
              Set credentials for the selected provider before saving this model change.
            </p>
          `
        : null}

    </div>
  `;
};
