import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { OverflowMenu, OverflowMenuItem } from "../overflow-menu.js";
import { fetchAgentWorkspaceSize } from "../../lib/api.js";
import { formatBytes } from "../../lib/format.js";
import { AgentBindingsSection } from "./agent-bindings-section.js";
import { AgentPairingSection } from "./agent-pairing-section.js";
import { useModels } from "../models-tab/use-models.js";
import {
  buildProviderHasAuth,
  getModelCatalogProvider,
  getModelDisplayLabel,
  getModelsTabAuthProvider,
  getProviderSortIndex,
  SearchableModelPicker,
} from "../models-tab/model-picker.js";

const html = htm.bind(h);

const resolveModelDisplay = (model) => {
  if (!model) return null;
  if (typeof model === "string") return model;
  return model.primary || null;
};

const resolveCatalogModel = (catalog = [], modelKey = "") =>
  catalog.find(
    (model) =>
      String(model?.key || "").trim() === String(modelKey || "").trim(),
  ) || null;

export const AgentOverview = ({
  agent = {},
  agents = [],
  saving = false,
  onUpdateAgent = async () => {},
  onSetLocation = () => {},
  onOpenWorkspace = () => {},
  onSwitchToModels = () => {},
  onSetDefault = () => {},
  onDelete = () => {},
}) => {
  const [updatingModel, setUpdatingModel] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [workspaceSizeBytes, setWorkspaceSizeBytes] = useState(null);
  const [workspaceSizeExists, setWorkspaceSizeExists] = useState(true);
  const [loadingWorkspaceSize, setLoadingWorkspaceSize] = useState(false);
  const {
    catalog,
    primary: defaultPrimaryModel,
    configuredModels,
    authProfiles,
    codexStatus,
    loading: loadingModels,
    ready: modelsReady,
  } = useModels();
  const explicitModel = resolveModelDisplay(agent.model);
  const effectiveModel = explicitModel || defaultPrimaryModel || "";
  const hasDistinctModelOverride =
    !!explicitModel &&
    String(explicitModel).trim() !== String(defaultPrimaryModel || "").trim();
  const isMain = String(agent.id || "") === "main";
  const showManageSection = !agent.default || !isMain;
  const providerHasAuth = useMemo(
    () => buildProviderHasAuth({ authProfiles, codexStatus }),
    [authProfiles, codexStatus],
  );
  const authorizedModelOptions = useMemo(
    () =>
      Object.keys(configuredModels || {})
        .map(
          (modelKey) =>
            resolveCatalogModel(catalog, modelKey) || {
              key: modelKey,
              label: modelKey,
            },
        )
        .filter((model) => {
          const provider = getModelsTabAuthProvider(model.key);
          return !!providerHasAuth[provider];
        })
        .sort((left, right) => {
          const providerCompare =
            getProviderSortIndex(getModelCatalogProvider(left)) -
            getProviderSortIndex(getModelCatalogProvider(right));
          if (providerCompare !== 0) return providerCompare;
          return String(left?.label || left?.key).localeCompare(
            String(right?.label || right?.key),
          );
        }),
    [catalog, configuredModels, providerHasAuth],
  );
  const effectiveModelEntry = useMemo(
    () =>
      resolveCatalogModel(catalog, effectiveModel) ||
      (effectiveModel ? { key: effectiveModel, label: effectiveModel } : null),
    [catalog, effectiveModel],
  );
  const popularOverviewModels = useMemo(
    () =>
      authorizedModelOptions.filter((model) => {
        const normalizedProvider = getModelCatalogProvider(model);
        return (
          normalizedProvider === "anthropic" || normalizedProvider === "openai"
        );
      }),
    [authorizedModelOptions],
  );
  const canEditModel = modelsReady && !loadingModels;
  const modelEntries = useMemo(() => {
    if (!effectiveModelEntry) return [];
    const currentKey = String(effectiveModelEntry?.key || "").trim();
    const rest = authorizedModelOptions.filter(
      (model) => String(model?.key || "").trim() !== currentKey,
    );
    return [effectiveModelEntry, ...rest];
  }, [authorizedModelOptions, effectiveModelEntry]);
  const modelEntryKeySet = useMemo(
    () =>
      new Set(
        modelEntries
          .map((entry) => String(entry?.key || "").trim())
          .filter(Boolean),
      ),
    [modelEntries],
  );
  const remainingModelOptions = useMemo(
    () =>
      authorizedModelOptions.filter(
        (model) => !modelEntryKeySet.has(String(model?.key || "").trim()),
      ),
    [authorizedModelOptions, modelEntryKeySet],
  );
  const showModelLoadingState = !modelsReady || loadingModels;

  useEffect(() => {
    if (!modelMenuOpen) return undefined;
    const handleWindowClick = () => setModelMenuOpen(false);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [modelMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    const agentId = String(agent?.id || "").trim();
    const workspacePath = String(agent?.workspace || "").trim();
    if (!agentId || !workspacePath) {
      setWorkspaceSizeBytes(null);
      setWorkspaceSizeExists(true);
      setLoadingWorkspaceSize(false);
      return undefined;
    }
    setLoadingWorkspaceSize(true);
    fetchAgentWorkspaceSize(agentId)
      .then((result) => {
        if (cancelled) return;
        setWorkspaceSizeBytes(Number(result?.sizeBytes || 0));
        setWorkspaceSizeExists(result?.exists !== false);
      })
      .catch(() => {
        if (cancelled) return;
        setWorkspaceSizeBytes(null);
        setWorkspaceSizeExists(false);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingWorkspaceSize(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agent?.id, agent?.workspace]);

  const handleSelectModel = async (modelKey) => {
    const normalizedModelKey = String(modelKey || "").trim();
    if (!normalizedModelKey || normalizedModelKey === effectiveModel) return;
    setUpdatingModel(true);
    try {
      await onUpdateAgent(
        String(agent.id || "").trim(),
        {
          model: { primary: normalizedModelKey },
        },
        "Agent model updated",
      );
    } finally {
      setUpdatingModel(false);
    }
  };

  const handleClearModelOverride = async () => {
    if (!hasDistinctModelOverride) return;
    setUpdatingModel(true);
    try {
      await onUpdateAgent(
        String(agent.id || "").trim(),
        {
          model: null,
        },
        "Agent model reset to default",
      );
    } finally {
      setUpdatingModel(false);
    }
  };

  return html`
    <div class="space-y-4">
      <div class="bg-surface border border-border rounded-xl p-4 space-y-2">
        <h3 class="card-label">Workspace</h3>
        ${agent.workspace
          ? html`
              <div
                class="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-3"
              >
                <button
                  type="button"
                  class="text-sm font-mono break-all text-left ac-tip-link hover:underline md:min-w-0"
                  onclick=${() => onOpenWorkspace(agent.workspace)}
                >
                  ${agent.workspace}
                </button>
                <div class="text-xs text-gray-500 md:shrink-0 md:text-right">
                  ${loadingWorkspaceSize
                    ? "Calculating size..."
                    : workspaceSizeBytes != null
                      ? formatBytes(workspaceSizeBytes)
                      : workspaceSizeExists
                        ? "Size unavailable"
                        : "Workspace directory not found"}
                </div>
              </div>
            `
          : html`<p class="text-sm text-gray-500">No workspace configured</p>`}
      </div>
      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <h3 class="card-label">Model</h3>
          ${showModelLoadingState
            ? null
            : html`
                <div class="flex items-center gap-2 min-h-6">
                  ${
                    effectiveModelEntry && !hasDistinctModelOverride
                      ? html`<${Badge} tone="neutral">Inherited</${Badge}>`
                      : null
                  }
                  <${OverflowMenu}
                    open=${modelMenuOpen}
                    ariaLabel="Open model actions"
                    title="Open model actions"
                    onToggle=${() => setModelMenuOpen((current) => !current)}
                  >
                    ${
                      hasDistinctModelOverride
                        ? html`
                          <${OverflowMenuItem}
                            onClick=${() => {
                              setModelMenuOpen(false);
                              handleClearModelOverride();
                            }}
                          >
                            Inherit from defaults
                          </${OverflowMenuItem}>
                        `
                        : null
                    }
                    <${OverflowMenuItem}
                      onClick=${() => {
                        setModelMenuOpen(false);
                        onSwitchToModels();
                      }}
                    >
                      Manage models
                    </${OverflowMenuItem}>
                  </${OverflowMenu}>
                </div>
              `}
        </div>
        ${showModelLoadingState
          ? html`
              <div class="flex items-center gap-2 text-sm text-gray-400 py-1">
                <${LoadingSpinner} className="h-4 w-4" />
                Loading model settings...
              </div>
            `
          : modelEntries.length === 0
            ? html`<p class="text-xs text-gray-500">
                No authorized models available yet. Add one from the Models tab
                first.
              </p>`
            : html`
                <div class="space-y-1">
                  ${modelEntries.map(
                    (entry) => html`
                      <div
                        key=${entry.key}
                        class="flex items-center justify-between py-1"
                      >
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="text-sm text-gray-200 truncate">
                            ${getModelDisplayLabel(entry)}
                          </span>
                          ${entry.key === effectiveModel
                            ? html`<${Badge} tone="cyan">Primary</${Badge}>`
                            : html`
                                <button
                                  type="button"
                                  onclick=${() => handleSelectModel(entry.key)}
                                  class="text-xs px-2 py-0.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                >
                                  Set primary
                                </button>
                              `}
                        </div>
                      </div>
                    `,
                  )}
                </div>
              `}
        ${showModelLoadingState
          ? null
          : remainingModelOptions.length > 0
            ? html`
                <div class="space-y-2">
                  <${SearchableModelPicker}
                    options=${remainingModelOptions}
                    popularModels=${popularOverviewModels}
                    placeholder=${authorizedModelOptions.length > 0
                      ? "Add model..."
                      : "No authorized models available"}
                    onSelect=${handleSelectModel}
                    disabled=${saving ||
                    updatingModel ||
                    !canEditModel ||
                    remainingModelOptions.length === 0}
                  />
                  ${authorizedModelOptions.length === 0
                    ? html`
                        <p class="text-xs text-gray-500">
                          Add and authorize models from the Models tab before
                          assigning one here.
                        </p>
                      `
                    : html`
                        <p class="text-xs text-gray-500">
                          Only models that already have working auth are
                          available here.
                        </p>
                      `}
                </div>
              `
            : null}
      </div>

      <${AgentBindingsSection}
        agent=${agent}
        agents=${agents}
        onSetLocation=${onSetLocation}
      />
      ${showManageSection
        ? html`
            <div class="bg-surface border border-border rounded-xl p-4">
              <h3 class="card-label mb-3">Manage</h3>
              <div class="flex flex-wrap items-center gap-2">
                ${!agent.default
                  ? html`
                      <${ActionButton}
                        onClick=${() => onSetDefault(agent.id)}
                        disabled=${saving}
                        tone="secondary"
                        size="sm"
                        idleLabel="Set as default"
                      />
                    `
                  : null}
                ${!isMain
                  ? html`
                      <${ActionButton}
                        onClick=${() => onDelete(agent)}
                        disabled=${saving}
                        tone="danger"
                        size="sm"
                        idleLabel="Delete agent"
                      />
                    `
                  : null}
              </div>
            </div>
          `
        : null}
      <${AgentPairingSection} agent=${agent} />
    </div>
  `;
};
