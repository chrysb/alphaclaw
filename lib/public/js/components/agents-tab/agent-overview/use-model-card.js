import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import { useModels } from "../../models-tab/use-models.js";
import {
  buildProviderHasAuth,
  getModelCatalogProvider,
  getModelsTabAuthProvider,
  getProviderSortIndex,
} from "../../models-tab/model-picker.js";

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

export const useModelCard = ({
  agent = {},
  onUpdateAgent = async () => {},
}) => {
  const [updatingModel, setUpdatingModel] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const popularModels = useMemo(
    () =>
      authorizedModelOptions.filter((model) => {
        const normalizedProvider = getModelCatalogProvider(model);
        return (
          normalizedProvider === "anthropic" || normalizedProvider === "openai"
        );
      }),
    [authorizedModelOptions],
  );

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

  return {
    authorizedModelOptions,
    canEditModel: modelsReady && !loadingModels,
    effectiveModel,
    effectiveModelEntry,
    handleClearModelOverride,
    handleSelectModel,
    hasDistinctModelOverride,
    loading: !modelsReady || loadingModels,
    menuOpen,
    modelEntries,
    popularModels,
    remainingModelOptions,
    setMenuOpen,
    updatingModel,
  };
};
