import { useEffect, useState } from "preact/hooks";
import {
  runOnboard,
  verifyGithubOnboardingRepo,
  scanImportRepo,
  applyImport,
  fetchModels,
} from "../../lib/api.js";
import { useCachedFetch } from "../../hooks/use-cached-fetch.js";
import {
  getModelProvider,
  getAuthProviderFromModelProvider,
  getFeaturedModels,
  getVisibleAiFieldKeys,
  kProviderAuthFields,
} from "../../lib/model-config.js";
import {
  getInitialOnboardingModelKey,
  getModelCatalogModels,
  kModelCatalogCacheKey,
  preloadModelCatalog,
} from "../../lib/model-catalog.js";
import {
  kWelcomeGroups,
  getWelcomeGroupError,
  findFirstInvalidWelcomeGroup,
  isValidGithubRepoInput,
  kGithubFlowFresh,
  kGithubFlowImport,
  kGithubTargetRepoModeCreate,
  kGithubTargetRepoModeExistingEmpty,
  kRepoModeNew,
  kRepoModeExisting,
} from "../onboarding/welcome-config.js";
import { getPreferredPairingChannel } from "../onboarding/pairing-utils.js";
import {
  kOnboardingStorageKey,
  kPairingChannelKey,
  useWelcomeStorage,
} from "../onboarding/use-welcome-storage.js";
import { useWelcomeCodex } from "../onboarding/use-welcome-codex.js";
import { useWelcomePairing } from "../onboarding/use-welcome-pairing.js";
import { buildApprovedImportVals } from "../onboarding/welcome-secret-review-utils.js";

const kMaxOnboardingVars = 64;
const kMaxEnvKeyLength = 128;
const kMaxEnvValueLength = 4096;
export const kImportStepId = "import";
export const kSecretReviewStepId = "secret-review";
export const kPlaceholderReviewStepId = "placeholder-review";
const kImportSubstepKey = "_IMPORT_SUBSTEP";
const kImportPlaceholderReviewKey = "_IMPORT_PLACEHOLDER_REVIEW";
const kImportPlaceholderSkipConfirmedKey = "_IMPORT_PLACEHOLDER_SKIP_CONFIRMED";

const normalizeOnboardingVals = (currentVals = {}) => {
  let didChange = false;
  const normalizedEntries = Object.entries(currentVals).map(([key, value]) => {
    const normalizedValue = typeof value === "string" ? value.trim() : value;
    if (normalizedValue !== value) didChange = true;
    return [key, normalizedValue];
  });
  return {
    normalizedVals: didChange ? Object.fromEntries(normalizedEntries) : currentVals,
    didChange,
  };
};

const normalizePlaceholderReview = (review) => {
  if (!review || !Array.isArray(review.vars) || review.vars.length === 0) {
    return { found: false, count: 0, vars: [] };
  }
  return {
    found: true,
    count:
      typeof review.count === "number" ? review.count : review.vars.length,
    vars: review.vars
      .map((item) => ({
        key: String(item?.key || "").trim(),
        status: String(item?.status || "missing").trim() || "missing",
      }))
      .filter((item) => item.key),
  };
};

export const useWelcome = ({ onComplete }) => {
  const kSetupStepIndex = kWelcomeGroups.length;
  const kPairingStepIndex = kSetupStepIndex + 1;
  const {
    vals,
    setVals,
    setValue: setStoredValue,
    step,
    setStep,
    setupError,
    setSetupError,
  } = useWelcomeStorage({
    kSetupStepIndex,
    kPairingStepIndex,
  });
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(null);
  const [showAllModels, setShowAllModels] = useState(false);
  const [loading, setLoading] = useState(false);
  const [githubStepLoading, setGithubStepLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const {
    codexStatus,
    codexLoading,
    codexManualInput,
    setCodexManualInput,
    codexExchanging,
    codexAuthStarted,
    codexAuthWaiting,
    startCodexAuth,
    completeCodexAuth,
    handleCodexDisconnect,
  } = useWelcomeCodex({ setFormError });
  const [importStep, setImportStepState] = useState(() => {
    const storedStep = String(vals[kImportSubstepKey] || "").trim();
    return storedStep === kPlaceholderReviewStepId
      ? storedStep
      : null;
  });
  const [importTempDir, setImportTempDir] = useState(null);
  const [importScanResult, setImportScanResult] = useState(null);
  const [importScanning, setImportScanning] = useState(false);
  const [importError, setImportError] = useState(null);
  const modelsFetchState = useCachedFetch(kModelCatalogCacheKey, fetchModels, {
    maxAgeMs: 30000,
  });

  useEffect(() => {
    // Warm the real catalog immediately so the AI step usually opens ready.
    preloadModelCatalog().catch(() => {});
  }, []);

  const setValue = (key, value) => {
    if (formError) setFormError(null);
    setStoredValue(key, value);
  };

  const setImportStep = (nextStep) => {
    setImportStepState(nextStep);
    setVals((prev) => ({
      ...prev,
      [kImportSubstepKey]:
        nextStep === kPlaceholderReviewStepId ? nextStep : "",
    }));
  };

  const clearPlaceholderReview = () => {
    setVals((prev) => ({
      ...prev,
      [kImportPlaceholderReviewKey]: null,
      [kImportPlaceholderSkipConfirmedKey]: false,
    }));
  };

  useEffect(() => {
    const list = getModelCatalogModels(modelsFetchState.data);
    if (!modelsFetchState.data) return;
    setModels(list);
    setModelsError(list.length > 0 ? null : "No models found");
    const defaultModelKey = getInitialOnboardingModelKey({
      catalog: list,
      currentModelKey: vals.MODEL_KEY,
    });
    if (!vals.MODEL_KEY && defaultModelKey) {
      setVals((prev) => ({ ...prev, MODEL_KEY: defaultModelKey }));
    }
  }, [modelsFetchState.data, setVals, vals.MODEL_KEY]);

  useEffect(() => {
    const hasModels = getModelCatalogModels(modelsFetchState.data).length > 0;
    setModelsLoading(modelsFetchState.loading && !hasModels);
  }, [modelsFetchState.data, modelsFetchState.loading]);

  useEffect(() => {
    if (!modelsFetchState.error) return;
    setModelsError("Failed to load models");
    setModelsLoading(false);
  }, [modelsFetchState.error]);

  const getValidationContext = (currentVals = {}) => {
    const currentSelectedProvider = getModelProvider(
      String(currentVals.MODEL_KEY || "").trim(),
    );
    const currentSelectedAuthProvider =
      getAuthProviderFromModelProvider(currentSelectedProvider);
    const currentProviderAuthFields =
      kProviderAuthFields[currentSelectedAuthProvider] || [];
    const currentHasAi =
      currentSelectedProvider === "openai-codex"
        ? !!codexStatus.connected
        : currentProviderAuthFields.some((field) =>
            !!String(currentVals[field.key] || "").trim(),
          );

    return {
      hasAi: currentHasAi,
      selectedProvider: currentSelectedProvider,
      codexLoading,
    };
  };

  const validationContext = getValidationContext(vals);
  const { selectedProvider, hasAi } = validationContext;
  const placeholderReview = normalizePlaceholderReview(
    vals[kImportPlaceholderReviewKey],
  );
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
  const isPreStep = step === -1;
  const isSetupStep = step === kSetupStepIndex;
  const isPairingStep = step === kPairingStepIndex;
  const activeGroup = step >= 0 && step < kSetupStepIndex ? kWelcomeGroups[step] : null;
  const selectedPairingChannel = String(
    vals[kPairingChannelKey] || getPreferredPairingChannel(vals),
  );
  const {
    pairingStatusPoll,
    pairingRequestsPoll,
    pairingChannels,
    canFinishPairing,
    pairingError,
    pairingComplete,
    handlePairingApprove,
    handlePairingReject,
    resetPairingState,
  } = useWelcomePairing({
    isPairingStep,
    selectedPairingChannel,
  });

  const handleSubmit = async () => {
    const { normalizedVals, didChange } = normalizeOnboardingVals(vals);
    if (didChange) setVals(normalizedVals);
    const submitValidationContext = getValidationContext(normalizedVals);
    const invalidGroup = findFirstInvalidWelcomeGroup(
      normalizedVals,
      submitValidationContext,
    );
    if (invalidGroup) {
      setFormError(
        getWelcomeGroupError(
          invalidGroup.id,
          normalizedVals,
          submitValidationContext,
        ),
      );
      setSetupError(null);
      setStep(kWelcomeGroups.findIndex((group) => group.id === invalidGroup.id));
      return;
    }
    if (loading) return;
    const vars = Object.entries(normalizedVals)
      .filter(
        ([key]) => key !== "MODEL_KEY" && !String(key || "").startsWith("_"),
      )
      .filter(([, value]) => value)
      .map(([key, value]) => ({ key, value }));
    const preflightError = (() => {
      if (!normalizedVals.MODEL_KEY || !String(normalizedVals.MODEL_KEY).includes("/")) {
        return "A model selection is required";
      }
      if (vars.length > kMaxOnboardingVars) {
        return `Too many environment variables (max ${kMaxOnboardingVars})`;
      }
      for (const entry of vars) {
        const key = String(entry?.key || "");
        const value = String(entry?.value || "");
        if (!key) return "Each variable must include a key";
        if (key.length > kMaxEnvKeyLength) {
          return `Variable key is too long: ${key.slice(0, 32)}...`;
        }
        if (value.length > kMaxEnvValueLength) {
          return `Value too long for ${key} (max ${kMaxEnvValueLength} chars)`;
        }
      }
      if (
        !normalizedVals.GITHUB_TOKEN ||
        !isValidGithubRepoInput(normalizedVals.GITHUB_WORKSPACE_REPO)
      ) {
        return 'Target repo must be in "owner/repo" format.';
      }
      if (
        (normalizedVals._GITHUB_FLOW || kGithubFlowFresh) === kGithubFlowImport &&
        !isValidGithubRepoInput(normalizedVals._GITHUB_SOURCE_REPO)
      ) {
        return 'Source repo must be in "owner/repo" format.';
      }
      return "";
    })();
    if (preflightError) {
      setFormError(preflightError);
      setSetupError(null);
      setStep(
        Math.max(
          0,
          kWelcomeGroups.findIndex((group) => group.id === "github"),
        ),
      );
      return;
    }
    setStep(kSetupStepIndex);
    setLoading(true);
    setFormError(null);
    setSetupError(null);
    resetPairingState();

    const wasImport =
      (normalizedVals._GITHUB_FLOW || kGithubFlowFresh) === kGithubFlowImport;
    try {
      const result = await runOnboard(vars, normalizedVals.MODEL_KEY, {
        importMode: wasImport,
      });
      if (!result.ok) throw new Error(result.error || "Onboarding failed");
      const pairingChannel = getPreferredPairingChannel(normalizedVals);
      if (!pairingChannel) {
        throw new Error(
          "No Telegram or Discord bot token configured for pairing.",
        );
      }
      setVals((prev) => ({
        ...prev,
        [kPairingChannelKey]: pairingChannel,
      }));
      setLoading(false);
      setStep(kPairingStepIndex);
      resetPairingState();
      setSetupError(null);
    } catch (err) {
      console.error("Onboard error:", err);
      setSetupError(err.message || "Onboarding failed");
      setLoading(false);
    }
  };

  const finishOnboarding = () => {
    localStorage.removeItem(kOnboardingStorageKey);
    onComplete();
  };

  const goBack = () => {
    if (isSetupStep) return;
    setFormError(null);
    setStep((prev) => Math.max(-1, prev - 1));
  };

  const goBackFromSetupError = () => {
    setLoading(false);
    setSetupError(null);
    setStep(kWelcomeGroups.length - 1);
  };

  const goNext = async () => {
    const { normalizedVals, didChange } = normalizeOnboardingVals(vals);
    if (didChange) setVals(normalizedVals);
    if (!activeGroup) return;
    const stepValidationContext = getValidationContext(normalizedVals);
    const stepValidationError = getWelcomeGroupError(
      activeGroup.id,
      normalizedVals,
      stepValidationContext,
    );
    if (stepValidationError) {
      setFormError(stepValidationError);
      return;
    }
    setFormError(null);
    if (activeGroup.id === "github") {
      const githubFlow = normalizedVals._GITHUB_FLOW || kGithubFlowFresh;
      const targetRepoMode =
        githubFlow === kGithubFlowImport
          ? kGithubTargetRepoModeCreate
          : normalizedVals._GITHUB_TARGET_REPO_MODE ||
            kGithubTargetRepoModeCreate;
      const targetVerifyMode =
        targetRepoMode === kGithubTargetRepoModeExistingEmpty
          ? kRepoModeExisting
          : kRepoModeNew;
      const sourceRepo =
        githubFlow === kGithubFlowImport
          ? normalizedVals._GITHUB_SOURCE_REPO
          : normalizedVals.GITHUB_WORKSPACE_REPO;
      setGithubStepLoading(true);
      clearPlaceholderReview();
      try {
        if (githubFlow === kGithubFlowImport) {
          const sourceResult = await verifyGithubOnboardingRepo(
            sourceRepo,
            normalizedVals.GITHUB_TOKEN,
            kRepoModeExisting,
          );
          if (!sourceResult?.ok) {
            setFormError(sourceResult?.error || "GitHub source verification failed");
            return;
          }
          if (sourceResult.repoIsEmpty) {
            setFormError(
              "That source repository is empty. Use Start fresh if you want AlphaClaw to bootstrap a new setup there.",
            );
            return;
          }
          const targetResult = await verifyGithubOnboardingRepo(
            normalizedVals.GITHUB_WORKSPACE_REPO,
            normalizedVals.GITHUB_TOKEN,
            kRepoModeNew,
          );
          if (!targetResult?.ok) {
            setFormError(targetResult?.error || "GitHub target verification failed");
            return;
          }
          if (
            targetRepoMode === kGithubTargetRepoModeCreate &&
            targetResult.repoExists
          ) {
            setFormError(
              "That target repository already exists. Choose Use existing empty repo or pick a new target repo name.",
            );
            return;
          }
          if (
            targetRepoMode === kGithubTargetRepoModeExistingEmpty &&
            !targetResult.repoExists
          ) {
            setFormError(
              "That target repository does not exist yet. Choose Create new repo or enter an existing empty target repo.",
            );
            return;
          }
          if (sourceResult.tempDir && !sourceResult.repoIsEmpty) {
            setImportTempDir(sourceResult.tempDir);
            setImportStep(kImportStepId);
            setImportScanning(true);
            setImportError(null);
            try {
              const scanResult = await scanImportRepo(sourceResult.tempDir);
              if (!scanResult?.ok) {
                setImportError(scanResult?.error || "Import scan failed");
                setImportScanning(false);
                return;
              }
              setImportScanResult(scanResult);
            } catch (scanErr) {
              setImportError(scanErr?.message || "Import scan failed");
            } finally {
              setImportScanning(false);
            }
            return;
          }
        }
        const targetResult = await verifyGithubOnboardingRepo(
          normalizedVals.GITHUB_WORKSPACE_REPO,
          normalizedVals.GITHUB_TOKEN,
          targetVerifyMode,
        );
        if (!targetResult?.ok) {
          setFormError(targetResult?.error || "GitHub verification failed");
          return;
        }
        if (
          targetRepoMode === kGithubTargetRepoModeCreate &&
          targetResult.repoExists
        ) {
          setFormError(
            "That target repository already exists. Choose Use existing empty repo or pick a new target repo name.",
          );
          return;
        }
        if (
          targetRepoMode === kGithubTargetRepoModeExistingEmpty &&
          !targetResult.repoExists
        ) {
          setFormError(
            "That target repository does not exist yet. Choose Create new repo or enter an existing empty target repo.",
          );
          return;
        }
      } catch (err) {
        setFormError(err?.message || "GitHub verification failed");
        return;
      } finally {
        setGithubStepLoading(false);
      }
    }
    setStep((prev) => Math.min(kWelcomeGroups.length - 1, prev + 1));
  };

  const handleImportApprove = async (approvedSecrets = []) => {
    setImportScanning(true);
    setImportError(null);
    try {
      const skipSecretExtraction = approvedSecrets.length === 0;
      const approvedImportVals = buildApprovedImportVals(approvedSecrets);
      const result = await applyImport({
        tempDir: importTempDir,
        approvedSecrets,
        skipSecretExtraction,
        githubRepo: vals.GITHUB_WORKSPACE_REPO,
        githubToken: vals.GITHUB_TOKEN,
      });
      if (!result?.ok) {
        setImportError(result?.error || "Import failed");
        setImportScanning(false);
        return;
      }
      const nextPlaceholderReview = normalizePlaceholderReview(
        result.placeholderReview,
      );
      setVals((prev) => ({
        ...prev,
        ...approvedImportVals,
        ...(result.preFill || {}),
        [kImportPlaceholderReviewKey]: nextPlaceholderReview,
        [kImportPlaceholderSkipConfirmedKey]: false,
      }));
      if (nextPlaceholderReview.found) {
        setImportStep(kPlaceholderReviewStepId);
        return;
      }
      clearPlaceholderReview();
      setImportStep(null);
      setStep((prev) => Math.min(kWelcomeGroups.length - 1, prev + 1));
    } catch (err) {
      setImportError(err?.message || "Import failed");
    } finally {
      setImportScanning(false);
    }
  };

  const handleShowSecretReview = () => {
    setImportStep(kSecretReviewStepId);
  };

  const handleSecretReviewBack = () => {
    setImportStep(kImportStepId);
  };

  const handleImportBack = () => {
    setImportStep(null);
    setImportTempDir(null);
    setImportScanResult(null);
    setImportError(null);
    clearPlaceholderReview();
  };

  const handlePlaceholderReviewContinue = () => {
    clearPlaceholderReview();
    setImportStep(null);
    setStep((prev) => Math.min(kWelcomeGroups.length - 1, prev + 1));
  };

  const handleSelectFlow = (flow) => {
    setValue("_GITHUB_FLOW", flow);
    setStep(0);
  };

  const isImportStep = importStep === kImportStepId;
  const isSecretReviewStep = importStep === kSecretReviewStepId;
  const isPlaceholderReviewStep = importStep === kPlaceholderReviewStepId;
  const activeStepLabel = isPreStep
    ? "Getting Started"
    : isImportStep
    ? "Import"
    : isSecretReviewStep
      ? "Review Secrets"
      : isPlaceholderReviewStep
        ? "Review Env Vars"
        : isSetupStep
          ? "Initializing"
          : isPairingStep
            ? "Pairing"
            : activeGroup?.title || "Setup";
  const stepNumber =
    isPreStep
      ? 0
      : isImportStep || isSecretReviewStep || isPlaceholderReviewStep
      ? step + 1
      : isSetupStep
        ? kWelcomeGroups.length + 1
        : isPairingStep
          ? kWelcomeGroups.length + 2
          : step + 1;

  return {
    state: {
      vals,
      step,
      setupError,
      modelsLoading,
      modelsError,
      showAllModels,
      loading,
      githubStepLoading,
      formError,
      importScanResult,
      importScanning,
      importError,
      selectedProvider,
      modelOptions,
      canToggleFullCatalog,
      visibleAiFieldKeys,
      hasAi,
      isPreStep,
      isSetupStep,
      isPairingStep,
      activeGroup,
      selectedPairingChannel,
      placeholderReview,
      isImportStep,
      isSecretReviewStep,
      isPlaceholderReviewStep,
      activeStepLabel,
      stepNumber,
      codexStatus,
      codexLoading,
      codexManualInput,
      codexExchanging,
      codexAuthStarted,
      codexAuthWaiting,
      pairingStatusPoll,
      pairingRequestsPoll,
      pairingChannels,
      canFinishPairing,
      pairingError,
      pairingComplete,
    },
    actions: {
      setVals,
      setValue,
      setShowAllModels,
      setCodexManualInput,
      startCodexAuth,
      completeCodexAuth,
      handleCodexDisconnect,
      handleSubmit,
      finishOnboarding,
      goBack,
      goBackFromSetupError,
      goNext,
      handleSelectFlow,
      handleImportApprove,
      handleShowSecretReview,
      handleSecretReviewBack,
      handleImportBack,
      handlePlaceholderReviewContinue,
      handlePairingApprove,
      handlePairingReject,
    },
  };
};
