const kCodexAuthStartPath = "/auth/codex/start";
const kCodexAuthWindowName = "codex-auth";
const kCodexAuthPopupFeatures = "popup=yes,width=640,height=780";
const kCodexAuthCallbackMessageType = "callback-input";

export const openCodexAuthWindow = () => {
  const popup = window.open(
    kCodexAuthStartPath,
    kCodexAuthWindowName,
    kCodexAuthPopupFeatures,
  );
  if (!popup || popup.closed) {
    window.location.href = kCodexAuthStartPath;
    return null;
  }
  return popup;
};

export const isCodexAuthCallbackMessage = (value) =>
  value?.codex === kCodexAuthCallbackMessageType &&
  typeof value.input === "string" &&
  value.input.trim().length > 0;
