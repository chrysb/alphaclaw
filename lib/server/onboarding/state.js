const fs = require("fs");
const { kOnboardingMarkerPath } = require("../constants");

const readOnboardingMarker = ({
  fsModule = fs,
  markerPath = kOnboardingMarkerPath,
} = {}) => {
  try {
    if (!fsModule.existsSync(markerPath)) return null;
    const raw = fsModule.readFileSync(markerPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const isReadOnlyOnboarding = (options = {}) =>
  !!readOnboardingMarker(options)?.readOnly;

module.exports = {
  readOnboardingMarker,
  isReadOnlyOnboarding,
};
