import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { kWelcomeGroups } from "../onboarding/welcome-config.js";
import { WelcomePreStep } from "../onboarding/welcome-pre-step.js";
import { WelcomeImportStep } from "../onboarding/welcome-import-step.js";
import { WelcomePlaceholderReviewStep } from "../onboarding/welcome-placeholder-review-step.js";
import { WelcomeSecretReviewStep } from "../onboarding/welcome-secret-review-step.js";
import { WelcomeHeader } from "../onboarding/welcome-header.js";
import { WelcomeSetupStep } from "../onboarding/welcome-setup-step.js";
import { WelcomeFormStep } from "../onboarding/welcome-form-step.js";
import { WelcomePairingStep } from "../onboarding/welcome-pairing-step.js";
import { useWelcome } from "./use-welcome.js";

const html = htm.bind(h);

export const Welcome = ({ onComplete, acVersion }) => {
  const { state, actions } = useWelcome({ onComplete });

  return html`
    <div class="max-w-lg w-full space-y-5">
      <${WelcomeHeader}
        groups=${kWelcomeGroups}
        step=${state.step}
        isPreStep=${state.isPreStep}
        isSetupStep=${state.isSetupStep}
        isPairingStep=${state.isPairingStep}
        stepNumber=${state.stepNumber}
        activeStepLabel=${state.activeStepLabel}
      />

      <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
        ${state.isPreStep
          ? html`<${WelcomePreStep} onSelectFlow=${actions.handleSelectFlow} />`
          : state.isImportStep
          ? html`<${WelcomeImportStep}
              scanResult=${state.importScanResult}
              scanning=${state.importScanning}
              error=${state.importError}
              onApprove=${actions.handleImportApprove}
              onShowSecretReview=${actions.handleShowSecretReview}
              onBack=${actions.handleImportBack}
            />`
          : state.isSecretReviewStep
            ? html`<${WelcomeSecretReviewStep}
                secrets=${state.importScanResult?.secrets || []}
                onApprove=${actions.handleImportApprove}
                onBack=${actions.handleSecretReviewBack}
                loading=${state.importScanning}
                error=${state.importError}
              />`
            : state.isPlaceholderReviewStep
              ? html`<${WelcomePlaceholderReviewStep}
                  placeholderReview=${state.placeholderReview}
                  vals=${state.vals}
                  setValue=${actions.setValue}
                  onContinue=${actions.handlePlaceholderReviewContinue}
                />`
              : state.isSetupStep
                ? html`<${WelcomeSetupStep}
                    error=${state.setupError}
                    loading=${state.loading}
                    onRetry=${actions.handleSubmit}
                    onBack=${actions.goBackFromSetupError}
                  />`
                : state.isPairingStep
                  ? html`<${WelcomePairingStep}
                      channel=${state.selectedPairingChannel}
                      pairings=${state.pairingRequestsPoll.data || []}
                      channels=${state.pairingChannels}
                      loading=${!state.pairingStatusPoll.data}
                      error=${state.pairingError}
                      onApprove=${actions.handlePairingApprove}
                      onReject=${actions.handlePairingReject}
                      canFinish=${state.pairingComplete || state.canFinishPairing}
                      onContinue=${actions.finishOnboarding}
                      onSkip=${actions.finishOnboarding}
                    />`
                  : html`
                      <${WelcomeFormStep}
                        activeGroup=${state.activeGroup}
                        vals=${state.vals}
                        hasAi=${state.hasAi}
                        setValue=${actions.setValue}
                        modelOptions=${state.modelOptions}
                        modelsLoading=${state.modelsLoading}
                        modelsError=${state.modelsError}
                        canToggleFullCatalog=${state.canToggleFullCatalog}
                        showAllModels=${state.showAllModels}
                        setShowAllModels=${actions.setShowAllModels}
                        selectedProvider=${state.selectedProvider}
                        codexLoading=${state.codexLoading}
                        codexStatus=${state.codexStatus}
                        startCodexAuth=${actions.startCodexAuth}
                        handleCodexDisconnect=${actions.handleCodexDisconnect}
                        codexAuthStarted=${state.codexAuthStarted}
                        codexAuthWaiting=${state.codexAuthWaiting}
                        codexManualInput=${state.codexManualInput}
                        setCodexManualInput=${actions.setCodexManualInput}
                        completeCodexAuth=${actions.completeCodexAuth}
                        codexExchanging=${state.codexExchanging}
                        visibleAiFieldKeys=${state.visibleAiFieldKeys}
                        error=${state.formError}
                        step=${state.step}
                        totalGroups=${kWelcomeGroups.length}
                        currentGroupValid=${state.currentGroupValid}
                        goBack=${actions.goBack}
                        goNext=${actions.goNext}
                        loading=${state.loading}
                        githubStepLoading=${state.githubStepLoading}
                        allValid=${state.allValid}
                        handleSubmit=${actions.handleSubmit}
                      />
                    `}
      </div>
      ${acVersion
        ? html`
            <div class="text-center text-xs text-gray-500 font-mono mt-8">
              v${acVersion}
            </div>
          `
        : null}
    </div>
  `;
};
