import {
  createChannelAccount,
  createChannelAccountJob,
  subscribeOperationEvents,
} from "./api.js";

export const createChannelAccountWithProgress = async ({
  payload = {},
  onPhase = () => {},
}) => {
  onPhase("Loading...");
  if (typeof window?.EventSource !== "function") {
    return createChannelAccount(payload);
  }
  const startResult = await createChannelAccountJob(payload);
  const operationId = String(startResult?.operationId || "").trim();
  if (!operationId) {
    throw new Error("Could not start channel creation operation");
  }
  return new Promise((resolve, reject) => {
    let settleCalled = false;
    let activePhase = "";
    let activePhaseAtMs = 0;
    let deferredPhase = null;
    let deferredTimer = null;
    const kPhaseMinimumVisibleMs = {
      restarting: 1200,
    };
    const clearDeferredTimer = () => {
      if (!deferredTimer) return;
      clearTimeout(deferredTimer);
      deferredTimer = null;
    };
    const applyPhase = ({ phase = "", label = "" } = {}) => {
      const nextPhase = String(phase || "").trim();
      const nextLabel = String(label || "").trim();
      if (!nextLabel) return;
      const minVisibleMs = Number(kPhaseMinimumVisibleMs[activePhase] || 0);
      const elapsedMs = activePhaseAtMs > 0 ? Date.now() - activePhaseAtMs : 0;
      if (
        minVisibleMs > 0 &&
        nextPhase &&
        nextPhase !== activePhase &&
        elapsedMs < minVisibleMs
      ) {
        deferredPhase = { phase: nextPhase, label: nextLabel };
        clearDeferredTimer();
        deferredTimer = setTimeout(() => {
          deferredTimer = null;
          const next = deferredPhase;
          deferredPhase = null;
          if (!next) return;
          applyPhase(next);
        }, minVisibleMs - elapsedMs);
        return;
      }
      clearDeferredTimer();
      deferredPhase = null;
      onPhase(nextLabel);
      activePhase = nextPhase;
      activePhaseAtMs = Date.now();
    };
    const closeWithCleanup = () => {
      clearDeferredTimer();
      close();
    };
    const close = subscribeOperationEvents({
      operationId,
      onMessage: (entry) => {
        const eventName = String(entry?.event || "").trim();
        if (eventName === "phase") {
          applyPhase({
            phase: String(entry?.data?.phase || "").trim(),
            label: String(entry?.data?.label || "").trim(),
          });
          return;
        }
        if (eventName === "done") {
          if (settleCalled) return;
          settleCalled = true;
          closeWithCleanup();
          resolve(entry?.data || {});
          return;
        }
        if (eventName === "error") {
          if (settleCalled) return;
          settleCalled = true;
          closeWithCleanup();
          reject(
            new Error(String(entry?.data?.error || "Could not create channel")),
          );
        }
      },
      onError: () => {
        if (settleCalled) return;
        settleCalled = true;
        closeWithCleanup();
        reject(new Error("Channel operation stream disconnected"));
      },
    });
  });
};
