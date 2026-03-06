import { h } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  runOnboard,
  verifyGithubOnboardingRepo,
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
} from "./onboarding/welcome-config.js";
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
      if (!vals.GITHUB_TOKEN || !isValidGithubRepoInput(vals.GITHUB_WORKSPACE_REPO)) {
        return 'GITHUB_WORKSPACE_REPO must be in "owner/repo" format.';
      }
      return "";
    })();
    if (preflightError) {
      setFormError(preflightError);
      setSetupError(null);
      setStep(Math.max(0, kWelcomeGroups.findIndex((g) => g.id === "github")));
      return;
    }
    setStep(kSetupStepIndex);
    setLoading(true);
    setFormError(null);
    setSetupError(null);
    resetPairingState();

    try {
      const result = await runOnboard(vars, vals.MODEL_KEY);
      if (!result.ok) throw new Error(result.error || "Onboarding failed");
      const pairingChannel = getPreferredPairingChannel(vals);
      if (!pairingChannel) {
        throw new Error("No Telegram or Discord bot token configured for pairing.");
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
      setGithubStepLoading(true);
      try {
        const result = await verifyGithubOnboardingRepo(
          vals.GITHUB_WORKSPACE_REPO,
          vals.GITHUB_TOKEN,
        );
        if (!result?.ok) {
          setFormError(result?.error || "GitHub verification failed");
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

  const activeStepLabel = isSetupStep
    ? "Initializing"
    : isPairingStep
      ? "Pairing"
      : activeGroup?.title || "Setup";
  const stepNumber = isSetupStep
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
        ${isSetupStep
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
