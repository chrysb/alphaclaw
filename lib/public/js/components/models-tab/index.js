import { h } from "https://esm.sh/preact";
import { useState, useMemo, useRef, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { PageHeader } from "../page-header.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";
import { useModels } from "./use-models.js";
import { ProviderAuthCard } from "./provider-auth-card.js";
import {
  getModelProvider,
  getAuthProviderFromModelProvider,
  getFeaturedModels,
  kProviderLabels,
  kProviderOrder,
} from "../../lib/model-config.js";

const html = htm.bind(h);

const getModelsTabAuthProvider = (modelKey) => {
  const provider = getModelProvider(modelKey);
  if (provider === "openai-codex") return "openai-codex";
  return getAuthProviderFromModelProvider(provider);
};

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

const getModelCatalogProvider = (model) =>
  String(model?.provider || getModelProvider(model?.key)).trim();

const getProviderSortIndex = (provider) => {
  const index = kProviderDisplayOrder.indexOf(provider);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
};

const formatProviderSectionLabel = (provider) =>
  String(kProviderLabels[provider] || provider).toUpperCase();

const normalizeSearch = (value) => String(value || "").trim().toLowerCase();
const getModelDisplayLabel = (model) => model?.featuredLabel || model?.label || model?.key;
const buildModelSearchText = (model) =>
  [
    model?.featuredLabel || "",
    model?.label || "",
    model?.key || "",
    model?.provider || getModelProvider(model?.key),
  ]
    .join(" ")
    .toLowerCase();

const SearchableModelPicker = ({
  options = [],
  popularModels = [],
  placeholder = "Add model...",
  onSelect = () => {},
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const normalizedQuery = normalizeSearch(query);
  const filteredOptions = useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) =>
            buildModelSearchText(option).includes(normalizedQuery),
          )
        : options,
    [options, normalizedQuery],
  );
  const groupedOptions = useMemo(() => {
    const groups = [];
    const showPopularGroup = !normalizedQuery;
    const visibleOptionKeys = new Set(filteredOptions.map((option) => option.key));
    const visiblePopularModels = popularModels.filter((model) =>
      visibleOptionKeys.has(model.key),
    );
    if (showPopularGroup && visiblePopularModels.length > 0) {
      groups.push({
        provider: "popular",
        label: "POPULAR",
        options: visiblePopularModels,
      });
    }
    for (const option of filteredOptions) {
      const provider = getModelCatalogProvider(option);
      const label = formatProviderSectionLabel(provider);
      const currentGroup = groups[groups.length - 1];
      if (!currentGroup || currentGroup.provider !== provider) {
        groups.push({ provider, label, options: [option] });
        continue;
      }
      currentGroup.options.push(option);
    }
    return groups;
  }, [filteredOptions, popularModels, normalizedQuery]);

  useEffect(() => {
    const handleOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsidePointer);
    return () => document.removeEventListener("mousedown", handleOutsidePointer);
  }, []);

  const handleSelect = (modelKey) => {
    if (!modelKey) return;
    onSelect(modelKey);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    const firstVisibleOption = groupedOptions[0]?.options?.[0];
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" && firstVisibleOption?.key) {
      event.preventDefault();
      handleSelect(firstVisibleOption.key);
    }
  };

  return html`
    <div class="relative" ref=${rootRef}>
      <input
        type="text"
        value=${query}
        placeholder=${placeholder}
        onFocus=${() => setOpen(true)}
        onInput=${(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown=${handleKeyDown}
        class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
      />
      ${open
        ? html`
            <div
              class="absolute left-0 right-0 top-full mt-2 z-20 bg-modal border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div class="max-h-80 overflow-y-auto">
                ${filteredOptions.length > 0
                  ? groupedOptions.map(
                      (group, index) => html`
                        <div key=${group.provider}>
                          <div
                            class=${`sticky top-0 z-10 h-[22px] px-3 text-[12px] font-semibold tracking-wide text-gray-400 bg-[#151922] border-b border-border flex items-center ${
                              index > 0 ? "border-t border-border" : ""
                            }`}
                          >
                            ${group.label}
                          </div>
                          ${group.options.map(
                            (model) => html`
                              <button
                                key=${model.key}
                                type="button"
                                onMouseDown=${(event) => event.preventDefault()}
                                onClick=${() => handleSelect(model.key)}
                                class="w-full text-left px-3 py-2 hover:bg-white/5 border-b border-border last:border-b-0"
                              >
                                <div class="flex flex-col gap-1">
                                  <div class="text-sm text-gray-200">
                                    ${getModelDisplayLabel(model)}
                                  </div>
                                  <div class="text-xs text-gray-500 font-mono">
                                    ${model.key}
                                  </div>
                                </div>
                              </button>
                            `,
                          )}
                        </div>
                      `,
                    )
                  : html`
                      <div class="px-3 py-3 text-xs text-gray-500">
                        No models match that search.
                      </div>
                    `}
              </div>
            </div>
          `
        : null}
    </div>
  `;
};

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
              <h2 class="card-label">
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
