import { useEffect, useState } from "https://esm.sh/preact/hooks";

import { kOnboardingStorageKey } from "../../lib/storage-keys.js";
export { kOnboardingStorageKey };
export const kOnboardingStepKey = "_step";
export const kPairingChannelKey = "_pairingChannel";
export const kOnboardingSetupErrorKey = "_lastSetupError";

const loadInitialSetupState = () => {
  try {
    return JSON.parse(localStorage.getItem(kOnboardingStorageKey) || "{}");
  } catch {
    return {};
  }
};

export const useWelcomeStorage = ({
  kSetupStepIndex,
  kPairingStepIndex,
} = {}) => {
  const [initialSetupState] = useState(loadInitialSetupState);
  const [vals, setVals] = useState(() => ({ ...initialSetupState }));
  const [setupError, setSetupError] = useState(null);
  const initialSetupError = String(
    initialSetupState?.[kOnboardingSetupErrorKey] || "",
  ).trim();
  const shouldRecoverFromSetupState = !!initialSetupError;
  const [step, setStep] = useState(() => {
    const parsedStep = Number.parseInt(
      String(initialSetupState?.[kOnboardingStepKey] || ""),
      10,
    );
    if (!Number.isFinite(parsedStep)) return 0;
    const clampedStep = Math.max(0, Math.min(kPairingStepIndex, parsedStep));
    if (clampedStep === kSetupStepIndex && shouldRecoverFromSetupState) return 0;
    return clampedStep;
  });

  useEffect(() => {
    localStorage.setItem(
      kOnboardingStorageKey,
      JSON.stringify({
        ...vals,
        [kOnboardingStepKey]: step,
        ...(setupError ? { [kOnboardingSetupErrorKey]: setupError } : {}),
      }),
    );
  }, [vals, step, setupError]);

  const setValue = (key, value) => setVals((prev) => ({ ...prev, [key]: value }));

  return {
    vals,
    setVals,
    setValue,
    step,
    setStep,
    setupError,
    setSetupError,
  };
};
