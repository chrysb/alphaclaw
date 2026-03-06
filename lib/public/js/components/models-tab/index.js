import { h } from "https://esm.sh/preact";
import { useState, useMemo } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { PageHeader } from "../page-header.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";
import { useModels } from "./use-models.js";
import { ProviderAuthCard } from "./provider-auth-card.js";
import { getModelProvider, getFeaturedModels } from "../../lib/model-config.js";

const html = htm.bind(h);

const deriveRequiredProviders = (configuredModels) => {
  const providers = new Set();
  for (const modelKey of Object.keys(configuredModels)) {
    const provider = getModelProvider(modelKey);
    if (provider) providers.add(provider);
  }
  return [...providers];
};

const kProviderDisplayOrder = [
  "anthropic",
  "openai",
  "openai-codex",
  "google",
];

export const Models = ({ onRestartRequired = () => {} }) => {
  const {
    catalog,
    primary,
    configuredModels,
    authProfiles,
    authOrder,
    codexStatus,
    loading,
    saving,
    ready,
    error,
    isDirty,
    addModel,
    removeModel,
    setPrimaryModel,
    editProfile,
    editAuthOrder,
    getProfileValue,
    getEffectiveOrder,
    cancelChanges,
    saveAll,
    refreshCodexStatus,
  } = useModels();

  const [showAllModels, setShowAllModels] = useState(false);

  const configuredKeys = useMemo(
    () => new Set(Object.keys(configuredModels)),
    [configuredModels],
  );

  const featuredModels = useMemo(() => getFeaturedModels(catalog), [catalog]);

  const pickerModels = useMemo(() => {
    const base = showAllModels
      ? catalog
      : featuredModels.length > 0
        ? featuredModels
        : catalog;
    return base.filter((m) => !configuredKeys.has(m.key));
  }, [catalog, featuredModels, showAllModels, configuredKeys]);

  const canToggleFullCatalog =
    featuredModels.length > 0 && catalog.length > featuredModels.length;

  const requiredProviders = useMemo(
    () => deriveRequiredProviders(configuredModels),
    [configuredModels],
  );

  const sortedProviders = useMemo(() => {
    const ordered = [];
    for (const p of kProviderDisplayOrder) {
      if (requiredProviders.includes(p)) ordered.push(p);
    }
    for (const p of requiredProviders) {
      if (!ordered.includes(p)) ordered.push(p);
    }
    return ordered;
  }, [requiredProviders]);

  const providerHasAuth = useMemo(() => {
    const result = {};
    for (const p of authProfiles) {
      if (p.key || p.token || p.access) {
        result[p.provider] = true;
      }
    }
    if (codexStatus?.connected) {
      result["openai-codex"] = true;
    }
    return result;
  }, [authProfiles, codexStatus]);

  const configuredModelEntries = useMemo(
    () =>
      Object.keys(configuredModels).map((key) => {
        const catalogEntry = catalog.find((m) => m.key === key);
        const provider = getModelProvider(key);
        const hasAuth = !!providerHasAuth[provider];
        return {
          key,
          label: catalogEntry?.label || key,
          isPrimary: key === primary,
          hasAuth,
        };
      }),
    [configuredModels, catalog, primary, providerHasAuth],
  );

  if (!ready) {
    return html`
      <div class="space-y-4">
        <${PageHeader}
          title="Models"
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
            Loading model settings...
          </div>
        </div>
      </div>
    `;
  }

  return html`
    <div class="space-y-4">
      <${PageHeader}
        title="Models"
        actions=${html`
          <${ActionButton}
            onClick=${cancelChanges}
            disabled=${!isDirty || saving}
            tone="secondary"
            size="sm"
            idleLabel="Cancel"
            className="transition-all"
          />
          <${ActionButton}
            onClick=${saveAll}
            disabled=${!isDirty || saving}
            loading=${saving}
            tone="primary"
            size="sm"
            idleLabel="Save changes"
            loadingLabel="Saving..."
            className="transition-all"
          />
        `}
      />

      <!-- Configured Models -->
      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        <h2 class="font-semibold text-sm">Available Models</h2>

        ${configuredModelEntries.length === 0
          ? html`<p class="text-xs text-gray-500">
              No models configured. Add a model below.
            </p>`
          : html`
              <div class="space-y-1">
                ${configuredModelEntries.map(
                  (entry) => html`
                    <div
                      class="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-sm text-gray-200 truncate"
                          >${entry.label}</span
                        >
                        ${entry.isPrimary
                          ? html`<${Badge} tone="cyan">Primary</${Badge}>`
                          : entry.hasAuth
                            ? html`
                                <button
                                  onclick=${() => setPrimaryModel(entry.key)}
                                  class="text-xs px-2 py-0.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                >
                                  Set primary
                                </button>
                              `
                            : html`<${Badge} tone="warning">Needs auth</${Badge}>`}
                      </div>
                      <button
                        onclick=${() => removeModel(entry.key)}
                        class="text-xs text-gray-600 hover:text-red-400 shrink-0 px-1"
                      >
                        Remove
                      </button>
                    </div>
                  `,
                )}
              </div>
            `}

        <div class="pt-2 border-t border-border space-y-2">
          <label class="text-xs font-medium text-gray-400">Add model</label>
          <select
            onInput=${(e) => {
              const val = e.target.value;
              if (val) {
                addModel(val);
                if (!primary) setPrimaryModel(val);
              }
              e.target.value = "";
            }}
            class="w-full bg-black/30 border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
          >
            <option value="">Select a model to add...</option>
            ${pickerModels.map(
              (m) =>
                html`<option value=${m.key}>${m.label || m.key}</option>`,
            )}
          </select>
          ${canToggleFullCatalog
            ? html`
                <button
                  type="button"
                  onclick=${() => setShowAllModels((prev) => !prev)}
                  class="text-xs text-gray-500 hover:text-gray-300"
                >
                  ${showAllModels
                    ? "Show recommended models"
                    : "Show full model catalog"}
                </button>
              `
            : null}
        </div>

        ${loading
          ? html`<p class="text-xs text-gray-600">
              Loading model catalog...
            </p>`
          : error
            ? html`<p class="text-xs text-gray-600">${error}</p>`
            : null}
      </div>

      <!-- Provider Auth -->
      ${sortedProviders.length > 0
        ? html`
            <div class="space-y-3">
              <h2 class="font-semibold text-sm text-gray-300">
                Provider Authentication
              </h2>
              ${sortedProviders.map(
                (provider) => html`
                  <${ProviderAuthCard}
                    provider=${provider}
                    authProfiles=${authProfiles}
                    authOrder=${authOrder}
                    codexStatus=${codexStatus}
                    onEditProfile=${editProfile}
                    onEditAuthOrder=${editAuthOrder}
                    getProfileValue=${getProfileValue}
                    getEffectiveOrder=${getEffectiveOrder}
                    onRefreshCodex=${refreshCodexStatus}
                  />
                `,
              )}
            </div>
          `
        : null}
    </div>
  `;
};
