import { h } from "https://esm.sh/preact";
import { useMemo } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { PageHeader } from "../page-header.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { ActionButton } from "../action-button.js";
import { PopActions } from "../pop-actions.js";
import { PaneShell } from "../pane-shell.js";
import { Badge } from "../badge.js";
import { useModels } from "./use-models.js";
import {
  buildProviderHasAuth,
  getModelCatalogProvider,
  getModelsTabAuthProvider,
  getProviderSortIndex,
  SearchableModelPicker,
} from "./model-picker.js";
import { ProviderAuthCard } from "./provider-auth-card.js";
import {
  getFeaturedModels,
  kProviderOrder,
} from "../../lib/model-config.js";

const html = htm.bind(h);

const deriveRequiredProviders = (configuredModels) => {
  const providers = new Set();
  for (const modelKey of Object.keys(configuredModels)) {
    const provider = getModelsTabAuthProvider(modelKey);
    if (provider) providers.add(provider);
  }
  return [...providers];
};

const kProviderDisplayOrder = [
  "anthropic",
  "openai",
  "openai-codex",
  ...kProviderOrder.filter((provider) => !["anthropic", "openai"].includes(provider)),
];

export const Models = ({ onRestartRequired = () => {}, agentId, embedded = false }) => {
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
  } = useModels(agentId);

  const configuredKeys = useMemo(
    () => new Set(Object.keys(configuredModels)),
    [configuredModels],
  );

  const featuredModels = useMemo(() => getFeaturedModels(catalog), [catalog]);
  const popularPickerModels = useMemo(
    () => featuredModels.filter((model) => !configuredKeys.has(model.key)),
    [featuredModels, configuredKeys],
  );

  const pickerModels = useMemo(() => {
    return [...catalog]
      .filter((model) => !configuredKeys.has(model.key))
      .sort((a, b) => {
        const providerCompare =
          getProviderSortIndex(getModelCatalogProvider(a)) -
          getProviderSortIndex(getModelCatalogProvider(b));
        if (providerCompare !== 0) return providerCompare;
        return String(a.label || a.key).localeCompare(String(b.label || b.key));
      });
  }, [catalog, configuredKeys]);

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

  const providerHasAuth = useMemo(
    () => buildProviderHasAuth({ authProfiles, codexStatus }),
    [authProfiles, codexStatus],
  );

  const configuredModelEntries = useMemo(
    () =>
      Object.keys(configuredModels).map((key) => {
        const catalogEntry = catalog.find((m) => m.key === key);
        const provider = getModelsTabAuthProvider(key);
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

  const headerActions = html`
    <${PopActions} visible=${isDirty}>
      <${ActionButton}
        onClick=${cancelChanges}
        disabled=${saving}
        tone="secondary"
        size="sm"
        idleLabel="Cancel"
        className="text-xs"
      />
      <${ActionButton}
        onClick=${saveAll}
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
  `;

  if (!ready) {
    const loadingBody = html`
      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <${LoadingSpinner} className="h-4 w-4" />
          Loading model settings...
        </div>
      </div>
    `;
    if (embedded) return loadingBody;
    return html`
      <${PaneShell}
        header=${html`<${PageHeader} title="Models" />`}
      >
        ${loadingBody}
      </${PaneShell}>
    `;
  }

  const bodyContent = html`
    <!-- Configured Models -->
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <h2 class="card-label">Available Models</h2>

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

      <div class="space-y-2">
        <${SearchableModelPicker}
          options=${pickerModels}
          popularModels=${popularPickerModels}
          placeholder="Add model..."
          onSelect=${(modelKey) => {
            addModel(modelKey);
            if (!primary) setPrimaryModel(modelKey);
          }}
        />
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
            <h2 class="font-semibold text-base">
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
  `;

  if (embedded) {
    return html`
      <div class="space-y-4">
        <div class="flex items-center justify-end gap-2">
          ${headerActions}
        </div>
        ${bodyContent}
      </div>
    `;
  }

  return html`
    <${PaneShell}
      header=${html`<${PageHeader} title="Models" actions=${headerActions} />`}
    >
      ${bodyContent}
    </${PaneShell}>
  `;
};
