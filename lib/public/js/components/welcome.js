import { h } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  runOnboard,
  verifyGithubOnboardingRepo,
  scanImportRepo,
  applyImport,
  fetchModels,
} from "../lib/api.js";
import {
  getModelProvider,
  getFeaturedModels,
  getVisibleAiFieldKeys,
} from "../lib/model-config.js";
import {
  kWelcomeGroups,
  isValidGithubRepoInput,
  kGithubFlowFresh,
  kGithubFlowImport,
  kGithubTargetRepoModeCreate,
  kGithubTargetRepoModeExistingEmpty,
  kRepoModeNew,
  kRepoModeExisting,
} from "./onboarding/welcome-config.js";
import { WelcomeImportStep } from "./onboarding/welcome-import-step.js";
import { WelcomeSecretReviewStep } from "./onboarding/welcome-secret-review-step.js";
import { WelcomeHeader } from "./onboarding/welcome-header.js";
import { WelcomeSetupStep } from "./onboarding/welcome-setup-step.js";
import { WelcomeFormStep } from "./onboarding/welcome-form-step.js";
import { WelcomePairingStep } from "./onboarding/welcome-pairing-step.js";
import { getPreferredPairingChannel } from "./onboarding/pairing-utils.js";
import {
  kOnboardingStorageKey,
  kPairingChannelKey,
  useWelcomeStorage,
} from "./onboarding/use-welcome-storage.js";
import { useWelcomeCodex } from "./onboarding/use-welcome-codex.js";
import { useWelcomePairing } from "./onboarding/use-welcome-pairing.js";
const html = htm.bind(h);
const kMaxOnboardingVars = 64;
const kMaxEnvKeyLength = 128;
const kMaxEnvValueLength = 4096;
const kImportStepId = "import";
const kSecretReviewStepId = "secret-review";

export const Welcome = ({ onComplete }) => {
  const kSetupStepIndex = kWelcomeGroups.length;
  const kPairingStepIndex = kSetupStepIndex + 1;
  const { vals, setVals, setValue, step, setStep, setupError, setSetupError } =
    useWelcomeStorage({
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
  const [importStep, setImportStep] = useState(null);
  const [importTempDir, setImportTempDir] = useState(null);
  const [importScanResult, setImportScanResult] = useState(null);
  const [importScanning, setImportScanning] = useState(false);
  const [importError, setImportError] = useState(null);

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
            ? !!codexStatus.connected
            : false;

  const allValid = kWelcomeGroups.every((g) => g.validate(vals, { hasAi }));
  const isSetupStep = step === kSetupStepIndex;
  const isPairingStep = step === kPairingStepIndex;
  const activeGroup = step < kSetupStepIndex ? kWelcomeGroups[step] : null;
  const currentGroupValid = activeGroup
    ? activeGroup.validate(vals, { hasAi })
    : false;
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
    if (!allValid || loading) return;
    const vars = Object.entries(vals)
      .filter(
        ([key]) => key !== "MODEL_KEY" && !String(key || "").startsWith("_"),
      )
      .filter(([, v]) => v)
      .map(([key, value]) => ({ key, value }));
    const preflightError = (() => {
      if (!vals.MODEL_KEY || !String(vals.MODEL_KEY).includes("/")) {
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
        !vals.GITHUB_TOKEN ||
        !isValidGithubRepoInput(vals.GITHUB_WORKSPACE_REPO)
      ) {
        return 'Target repo must be in "owner/repo" format.';
      }
      if (
        (vals._GITHUB_FLOW || kGithubFlowFresh) === kGithubFlowImport &&
        !isValidGithubRepoInput(vals._GITHUB_SOURCE_REPO)
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
          kWelcomeGroups.findIndex((g) => g.id === "github"),
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
      (vals._GITHUB_FLOW || kGithubFlowFresh) === kGithubFlowImport;
    try {
      const result = await runOnboard(vars, vals.MODEL_KEY, {
        importMode: wasImport,
      });
      if (!result.ok) throw new Error(result.error || "Onboarding failed");
      const pairingChannel = getPreferredPairingChannel(vals);
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
    setStep((prev) => Math.max(0, prev - 1));
  };
  const goBackFromSetupError = () => {
    setLoading(false);
    setSetupError(null);
    setStep(kWelcomeGroups.length - 1);
  };

  const goNext = async () => {
    if (!activeGroup || !currentGroupValid) return;
    setFormError(null);
    if (activeGroup.id === "github") {
      const githubFlow = vals._GITHUB_FLOW || kGithubFlowFresh;
      const targetRepoMode =
        githubFlow === kGithubFlowImport
          ? kGithubTargetRepoModeCreate
          : vals._GITHUB_TARGET_REPO_MODE || kGithubTargetRepoModeCreate;
      const sourceRepo =
        githubFlow === kGithubFlowImport
          ? vals._GITHUB_SOURCE_REPO
          : vals.GITHUB_WORKSPACE_REPO;
      setGithubStepLoading(true);
      try {
        if (githubFlow === kGithubFlowImport) {
          const sourceResult = await verifyGithubOnboardingRepo(
            sourceRepo,
            vals.GITHUB_TOKEN,
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
            vals.GITHUB_WORKSPACE_REPO,
            vals.GITHUB_TOKEN,
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
          vals.GITHUB_WORKSPACE_REPO,
          vals.GITHUB_TOKEN,
          kRepoModeNew,
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
      if (result.preFill) {
        setVals((prev) => ({ ...prev, ...result.preFill }));
      }
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
  };

  const isImportStep = importStep === kImportStepId;
  const isSecretReviewStep = importStep === kSecretReviewStepId;
  const activeStepLabel = isImportStep
    ? "Import"
    : isSecretReviewStep
      ? "Review Secrets"
      : isSetupStep
        ? "Initializing"
        : isPairingStep
          ? "Pairing"
          : activeGroup?.title || "Setup";
  const stepNumber =
    isImportStep || isSecretReviewStep
      ? step + 1
      : isSetupStep
        ? kWelcomeGroups.length + 1
        : isPairingStep
          ? kWelcomeGroups.length + 2
          : step + 1;

  return html`
    <div class="max-w-lg w-full space-y-5">
      <${WelcomeHeader}
        groups=${kWelcomeGroups}
        step=${step}
        isSetupStep=${isSetupStep}
        isPairingStep=${isPairingStep}
        stepNumber=${stepNumber}
        activeStepLabel=${activeStepLabel}
      />

      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        ${isImportStep
          ? html`<${WelcomeImportStep}
              scanResult=${importScanResult}
              scanning=${importScanning}
              error=${importError}
              onApprove=${handleImportApprove}
              onShowSecretReview=${handleShowSecretReview}
              onBack=${handleImportBack}
            />`
          : isSecretReviewStep
            ? html`<${WelcomeSecretReviewStep}
                secrets=${importScanResult?.secrets || []}
                onApprove=${handleImportApprove}
                onBack=${handleSecretReviewBack}
                loading=${importScanning}
                error=${importError}
              />`
            : isSetupStep
              ? html`<${WelcomeSetupStep}
                  error=${setupError}
                  loading=${loading}
                  onRetry=${handleSubmit}
                  onBack=${goBackFromSetupError}
                />`
              : isPairingStep
                ? html`<${WelcomePairingStep}
                    channel=${selectedPairingChannel}
                    pairings=${pairingRequestsPoll.data || []}
                    channels=${pairingChannels}
                    loading=${!pairingStatusPoll.data}
                    error=${pairingError}
                    onApprove=${handlePairingApprove}
                    onReject=${handlePairingReject}
                    canFinish=${pairingComplete || canFinishPairing}
                    onContinue=${finishOnboarding}
                  />`
                : html`
                    <${WelcomeFormStep}
                      activeGroup=${activeGroup}
                      vals=${vals}
                      hasAi=${hasAi}
                      setValue=${setValue}
                      modelOptions=${modelOptions}
                      modelsLoading=${modelsLoading}
                      modelsError=${modelsError}
                      canToggleFullCatalog=${canToggleFullCatalog}
                      showAllModels=${showAllModels}
                      setShowAllModels=${setShowAllModels}
                      selectedProvider=${selectedProvider}
                      codexLoading=${codexLoading}
                      codexStatus=${codexStatus}
                      startCodexAuth=${startCodexAuth}
                      handleCodexDisconnect=${handleCodexDisconnect}
                      codexAuthStarted=${codexAuthStarted}
                      codexAuthWaiting=${codexAuthWaiting}
                      codexManualInput=${codexManualInput}
                      setCodexManualInput=${setCodexManualInput}
                      completeCodexAuth=${completeCodexAuth}
                      codexExchanging=${codexExchanging}
                      visibleAiFieldKeys=${visibleAiFieldKeys}
                      error=${formError}
                      step=${step}
                      totalGroups=${kWelcomeGroups.length}
                      currentGroupValid=${currentGroupValid}
                      goBack=${goBack}
                      goNext=${goNext}
                      loading=${loading}
                      githubStepLoading=${githubStepLoading}
                      allValid=${allValid}
                      handleSubmit=${handleSubmit}
                    />
                  `}
      </div>
    </div>
  `;
};
