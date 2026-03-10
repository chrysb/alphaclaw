const parseEventPayload = (value) => {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const subscribeToSse = ({
  url = "",
  onMessage = () => {},
  onError = () => {},
}) => {
  if (typeof window?.EventSource !== "function") {
    throw new Error("Server events are not supported in this browser");
  }
  const source = new window.EventSource(String(url || ""), { withCredentials: true });
  const handlePhase = (event) => {
    onMessage({
      event: "phase",
      data: parseEventPayload(event?.data || ""),
    });
  };
  const handleDone = (event) => {
    onMessage({
      event: "done",
      data: parseEventPayload(event?.data || ""),
    });
  };
  const handleFailure = (event) => {
    onMessage({
      event: "error",
      data: parseEventPayload(event?.data || ""),
    });
  };
  const handleError = (event) => {
    onError(event);
  };
  source.addEventListener("phase", handlePhase);
  source.addEventListener("done", handleDone);
  source.addEventListener("error", handleFailure);
  source.onerror = handleError;
  return () => {
    source.removeEventListener("phase", handlePhase);
    source.removeEventListener("done", handleDone);
    source.removeEventListener("error", handleFailure);
    source.onerror = null;
    source.close();
  };
};
