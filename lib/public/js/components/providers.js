import { h } from "https://esm.sh/preact";
import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
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
import { PageHeader } from "./page-header.js";
import { LoadingSpinner } from "./loading-spinner.js";
import { ActionButton } from "./action-button.js";
import {
  getModelProvider,
  getAuthProviderFromModelProvider,
  getFeaturedModels,
  kProviderAuthFields,
  kProviderLabels,
  kProviderOrder,
  kProviderFeatures,
  kCoreProviders,
} from "../lib/model-config.js";

const html = htm.bind(h);

const getKeyVal = (vars, key) => vars.find((v) => v.key === key)?.value || "";
const kAiCredentialKeys = Object.values(kProviderAuthFields)
  .flat()
  .map((field) => field.key)
  .filter((key, idx, arr) => arr.indexOf(key) === idx);
let kProvidersTabCache = null;

const FeatureTags = ({ provider, features = null }) => {
  const resolvedFeatures = Array.isArray(features)
    ? features
    : kProviderFeatures[provider] || [];
  const uniqueFeatures = Array.from(new Set(resolvedFeatures));
  if (!uniqueFeatures.length) return null;
  return html`
    <div class="flex flex-wrap gap-1.5">
      ${uniqueFeatures.map(
        (f) => html`
          <span
            class="text-xs px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400"
            >${f}</span
          >
        `,
      )}
    </div>
  `;
};

export const Providers = ({ onRestartRequired = () => {} }) => {
  const [envVars, setEnvVars] = useState(
    () => kProvidersTabCache?.envVars || [],
  );
  const [models, setModels] = useState(() => kProvidersTabCache?.models || []);
  const [selectedModel, setSelectedModel] = useState(
    () => kProvidersTabCache?.selectedModel || "",
  );
  const [showAllModels, setShowAllModels] = useState(
    () => kProvidersTabCache?.showAllModels || false,
  );
  const [savingChanges, setSavingChanges] = useState(false);
  const [codexStatus, setCodexStatus] = useState(
    () => kProvidersTabCache?.codexStatus || { connected: false },
  );
  const [codexManualInput, setCodexManualInput] = useState("");
  const [codexExchanging, setCodexExchanging] = useState(false);
  const [codexAuthStarted, setCodexAuthStarted] = useState(false);
  const [codexAuthWaiting, setCodexAuthWaiting] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(() => !kProvidersTabCache);
  const [modelsError, setModelsError] = useState(
    () => kProvidersTabCache?.modelsError || "",
  );
  const [ready, setReady] = useState(() => !!kProvidersTabCache);
  const [savedModel, setSavedModel] = useState(
    () => kProvidersTabCache?.savedModel || "",
  );
  const [modelDirty, setModelDirty] = useState(false);
  const [savedAiValues, setSavedAiValues] = useState(
    () => kProvidersTabCache?.savedAiValues || {},
  );
  const [showMoreProviders, setShowMoreProviders] = useState(false);
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
      const catalogModels = Array.isArray(modelCatalog.models)
        ? modelCatalog.models
        : [];
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
      kProvidersTabCache = {
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
      setModelsError("Failed to load provider settings");
      showToast(`Failed to load provider settings: ${err.message}`, "error");
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
      kProvidersTabCache = {
        ...(kProvidersTabCache || {}),
        codexStatus: codex || { connected: false },
      };
    } catch {
      setCodexStatus({ connected: false });
      kProvidersTabCache = {
        ...(kProvidersTabCache || {}),
        codexStatus: { connected: false },
      };
    }
  };

  useEffect(() => {
    refresh();
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

  useEffect(() => {
    const onMessage = async (e) => {
      if (e.data?.codex === "success") {
        showToast("Codex connected", "success");
        await refreshCodexConnection();
      } else if (e.data?.codex === "error") {
        showToast(
          `Codex auth failed: ${e.data.message || "unknown error"}`,
          "error",
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const setEnvValue = (key, value) => {
    setEnvVars((prev) => {
      const next = prev.map((v) => (v.key === key ? { ...v, value } : v));
      kProvidersTabCache = { ...(kProvidersTabCache || {}), envVars: next };
      return next;
    });
  };

  const selectedModelProvider = getModelProvider(selectedModel);
  const selectedAuthProvider = getAuthProviderFromModelProvider(
    selectedModelProvider,
  );
  const primaryProvider = kProviderOrder.includes(selectedAuthProvider)
    ? selectedAuthProvider
    : kProviderOrder[0];
  const otherProviders = kProviderOrder.filter((p) => p !== primaryProvider);
  const featuredModels = getFeaturedModels(models);
  const baseModelOptions = showAllModels
    ? models
    : featuredModels.length > 0
      ? featuredModels
      : models;
  const selectedModelOption = models.find(
    (model) => model.key === selectedModel,
  );
  const modelOptions =
    selectedModelOption &&
    !baseModelOptions.some((model) => model.key === selectedModelOption.key)
      ? [...baseModelOptions, selectedModelOption]
      : baseModelOptions;
  const canToggleFullCatalog =
    featuredModels.length > 0 && models.length > featuredModels.length;

  const aiCredentialsDirty = kAiCredentialKeys.some(
    (key) => getKeyVal(envVars, key) !== (savedAiValues[key] || ""),
  );
  const hasSelectedProviderAuth =
    selectedModelProvider === "anthropic"
      ? !!(
          getKeyVal(envVars, "ANTHROPIC_API_KEY") ||
          getKeyVal(envVars, "ANTHROPIC_TOKEN")
        )
      : selectedModelProvider === "openai"
        ? !!getKeyVal(envVars, "OPENAI_API_KEY")
        : selectedModelProvider === "openai-codex"
          ? !!codexStatus.connected
          : selectedModelProvider === "google"
            ? !!getKeyVal(envVars, "GEMINI_API_KEY")
            : false;
  const canSaveChanges =
    !savingChanges &&
    (aiCredentialsDirty || (modelDirty && hasSelectedProviderAuth));

  const saveChanges = async () => {
    if (savingChanges) return;
    if (!modelDirty && !aiCredentialsDirty) return;
    if (modelDirty && !hasSelectedProviderAuth) {
      showToast(
        "Add credentials for the selected model provider before saving model changes",
        "error",
      );
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
        if (!envResult.ok)
          throw new Error(envResult.error || "Failed to save env vars");
        if (envResult.restartRequired) onRestartRequired(true);
      }

      if (modelDirty && targetModel) {
        const modelResult = await setPrimaryModel(targetModel);
        if (!modelResult.ok)
          throw new Error(modelResult.error || "Failed to set primary model");
        const status = await fetchModelStatus();
        if (status?.ok === false) {
          throw new Error(status.error || "Failed to verify primary model");
        }
        const activeModel = status?.modelKey || "";
        if (activeModel && activeModel !== targetModel) {
          throw new Error(
            `Primary model did not apply. Expected ${targetModel} but active is ${activeModel}`,
          );
        }
        setSavedModel(targetModel);
        setModelDirty(false);
        kProvidersTabCache = {
          ...(kProvidersTabCache || {}),
          selectedModel: targetModel,
          savedModel: targetModel,
        };
      }

      await refresh();
      showToast("Changes saved", "success");
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
    const popup = window.open(
      "/auth/codex/start",
      "codex-auth",
      "popup=yes,width=640,height=780",
    );
    if (!popup || popup.closed) {
      setCodexAuthWaiting(false);
      window.location.href = "/auth/codex/start";
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
    try {
      const result = await exchangeCodexOAuth(codexManualInput.trim());
      if (!result.ok)
        throw new Error(result.error || "Codex OAuth exchange failed");
      setCodexManualInput("");
      showToast("Codex connected", "success");
      setCodexAuthStarted(false);
      setCodexAuthWaiting(false);
      await refreshCodexConnection();
    } catch (err) {
      showToast(err.message || "Codex OAuth exchange failed", "error");
    } finally {
      setCodexExchanging(false);
    }
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

  const renderCredentialField = (field) => html`
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <label class="text-xs font-medium text-gray-400">${field.label}</label>
        ${field.url && !getKeyVal(envVars, field.key)
          ? html`<a
              href=${field.url}
              target="_blank"
              class="text-xs hover:underline"
              style="color: var(--accent-link)"
              >Get</a
            >`
          : null}
      </div>
      <${SecretInput}
        value=${getKeyVal(envVars, field.key)}
        onInput=${(e) => setEnvValue(field.key, e.target.value)}
        placeholder=${field.placeholder || ""}
        isSecret=${!field.isText}
        inputClass="flex-1 w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
      />
      ${field.hint
        ? html`<p class="text-xs text-gray-600">${field.hint}</p>`
        : null}
    </div>
  `;

  const renderCodexOAuth = () => html`
    <div class="border border-border rounded-lg p-3 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400">Codex OAuth</span>
        ${codexStatus.connected
          ? html`<${Badge} tone="success">Connected</${Badge}>`
          : html`<${Badge} tone="warning">Not connected</${Badge}>`}
      </div>
      ${codexStatus.connected
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
        : !codexAuthStarted
          ? html`
              <button
                onclick=${startCodexAuth}
                class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-cyan"
              >
                Connect Codex OAuth
              </button>
            `
          : html`
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs text-gray-500">
                  ${codexAuthWaiting
                    ? "Complete login in the popup, then paste the redirect URL."
                    : "Paste the redirect URL from your browser to finish connecting."}
                </p>
                <button
                  onclick=${startCodexAuth}
                  class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary shrink-0"
                >
                  Restart
                </button>
              </div>
            `}
      ${!codexStatus.connected && codexAuthStarted
        ? html`
            <p class="text-xs text-gray-500">
              After login, copy the full redirect URL (starts with
              <code class="text-xs bg-black/30 px-1 rounded"
                >http://localhost:1455/auth/callback</code
              >) and paste it here.
            </p>
            <input
              type="text"
              value=${codexManualInput}
              onInput=${(e) => setCodexManualInput(e.target.value)}
              placeholder="http://localhost:1455/auth/callback?code=...&state=..."
              class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-gray-500"
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
  `;

  const providerHasKey = (provider) => {
    const fields = kProviderAuthFields[provider] || [];
    return fields.some((f) => !!getKeyVal(envVars, f.key));
  };

  const renderProviderCard = (provider) => {
    const fields = kProviderAuthFields[provider] || [];
    const hasCodex = provider === "openai";
    const hasKey = providerHasKey(provider);
    const openAiFeatures = kProviderFeatures.openai || [];
    return html`
      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold text-sm">
            ${kProviderLabels[provider] || provider}
          </h3>
          ${hasKey
            ? html`<span
                class="inline-block w-1.5 h-1.5 rounded-full bg-green-500"
              />`
            : null}
        </div>
        ${fields.map((field) => renderCredentialField(field))}
        ${provider === "openai"
          ? html`<${FeatureTags} features=${openAiFeatures} />`
          : null}
        ${hasCodex ? renderCodexOAuth() : null}
        ${provider !== "openai"
          ? html`<${FeatureTags} provider=${provider} />`
          : null}
      </div>
    `;
  };

  if (!ready) {
    return html`
      <div class="space-y-4">
        <${PageHeader}
          title="Providers"
          actions=${html`
            <${ActionButton}
              disabled=${true}
              tone="primary"
              size="sm"
              idleLabel="Save changes"
              className="transition-all"
            />
          `}
        />
        <div class="bg-surface border border-border rounded-xl p-4">
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <${LoadingSpinner} className="h-4 w-4" />
            Loading provider settings...
          </div>
        </div>
      </div>
    `;
  }

  const renderPrimaryProviderContent = () => {
    const fields = kProviderAuthFields[primaryProvider] || [];
    const hasCodex = primaryProvider === "openai";
    return html`
      ${fields.map((field) => renderCredentialField(field))}
      ${hasCodex ? renderCodexOAuth() : null}
    `;
  };

  return html`
    <div class="space-y-4">
      <${PageHeader}
        title="Providers"
        actions=${html`
          <${ActionButton}
            onClick=${saveChanges}
            disabled=${!canSaveChanges}
            loading=${savingChanges}
            tone="primary"
            size="sm"
            idleLabel="Save changes"
            loadingLabel="Saving..."
            className="transition-all"
          />
        `}
      />

      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        <h2 class="font-semibold text-sm">Primary Agent Model</h2>
        <select
          value=${selectedModel}
          onInput=${(e) => {
            const next = e.target.value;
            setSelectedModel(next);
            setModelDirty(next !== savedModel);
            kProvidersTabCache = {
              ...(kProvidersTabCache || {}),
              selectedModel: next,
            };
          }}
          class="w-full bg-black/30 border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
        >
          <option value="">Select a model</option>
          ${modelOptions.map(
            (model) =>
              html`<option value=${model.key}>
                ${model.label || model.key}
              </option>`,
          )}
        </select>
        <p class="text-xs text-gray-600">
          ${modelsLoading
            ? "Loading model catalog..."
            : modelsError
              ? modelsError
              : ""}
        </p>
        ${canToggleFullCatalog
          ? html`
              <div>
                <button
                  type="button"
                  onclick=${() =>
                    setShowAllModels((prev) => {
                      const next = !prev;
                      kProvidersTabCache = {
                        ...(kProvidersTabCache || {}),
                        showAllModels: next,
                      };
                      return next;
                    })}
                  class="text-xs text-gray-500 hover:text-gray-300"
                >
                  ${showAllModels
                    ? "Show recommended models"
                    : "Show full model catalog"}
                </button>
              </div>
            `
          : null}
        <div class="pt-2 border-t border-border space-y-3">
          ${renderPrimaryProviderContent()}
        </div>
      </div>

      ${otherProviders
        .filter((p) => kCoreProviders.has(p))
        .map((provider) => renderProviderCard(provider))}
      ${showMoreProviders
        ? otherProviders
            .filter((p) => !kCoreProviders.has(p))
            .map((provider) => renderProviderCard(provider))
        : null}
      ${otherProviders.some((p) => !kCoreProviders.has(p))
        ? html`
            <button
              type="button"
              onclick=${() => setShowMoreProviders((prev) => !prev)}
              class="w-full text-xs px-3 py-1.5 rounded-lg ac-btn-ghost"
            >
              ${showMoreProviders
                ? "Hide additional providers"
                : "More providers"}
            </button>
          `
        : null}
      ${modelDirty && !hasSelectedProviderAuth
        ? html`
            <p class="text-xs text-yellow-500">
              Set credentials for the selected provider before saving this model
              change.
            </p>
          `
        : null}
    </div>
  `;
};
