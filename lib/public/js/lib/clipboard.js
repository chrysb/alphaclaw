export const copyTextToClipboard = async (value) => {
  const text = String(value || "");
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  let fallbackElement = null;
  let appendedFallbackElement = false;
  try {
    if (
      !document?.createElement ||
      !document?.body?.appendChild ||
      !document?.body?.removeChild ||
      typeof document.execCommand !== "function"
    ) {
      return false;
    }

    fallbackElement = document.createElement("textarea");
    fallbackElement.value = text;
    fallbackElement.setAttribute("readonly", "");
    fallbackElement.style.position = "fixed";
    fallbackElement.style.opacity = "0";
    document.body.appendChild(fallbackElement);
    appendedFallbackElement = true;
    fallbackElement.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    if (fallbackElement && appendedFallbackElement) {
      document.body.removeChild(fallbackElement);
    }
  }
};
