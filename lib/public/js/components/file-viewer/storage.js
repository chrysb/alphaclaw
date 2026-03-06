import {
  kEditorSelectionStorageKey,
  kFileViewerModeStorageKey,
} from "./constants.js";

export const readStoredFileViewerMode = () => {
  try {
    const storedMode = String(
      window.localStorage.getItem(kFileViewerModeStorageKey) || "",
    ).trim();
    return storedMode === "preview" ? "preview" : "edit";
  } catch {
    return "edit";
  }
};

export const readEditorSelectionStorageMap = () => {
  try {
    const rawStorageValue = window.localStorage.getItem(kEditorSelectionStorageKey);
    if (!rawStorageValue) return {};
    const parsedStorageValue = JSON.parse(rawStorageValue);
    if (!parsedStorageValue || typeof parsedStorageValue !== "object") return {};
    return parsedStorageValue;
  } catch {
    return {};
  }
};

export const readStoredEditorSelection = (filePath) => {
  const safePath = String(filePath || "").trim();
  if (!safePath) return null;
  const storageMap = readEditorSelectionStorageMap();
  const selection = storageMap[safePath];
  if (!selection || typeof selection !== "object") return null;
  return {
    start: selection.start,
    end: selection.end,
  };
};

export const writeStoredEditorSelection = (filePath, selection) => {
  const safePath = String(filePath || "").trim();
  if (!safePath || !selection || typeof selection !== "object") return;
  try {
    const nextStorageValue = readEditorSelectionStorageMap();
    nextStorageValue[safePath] = {
      start: selection.start,
      end: selection.end,
    };
    window.localStorage.setItem(
      kEditorSelectionStorageKey,
      JSON.stringify(nextStorageValue),
    );
  } catch {}
};
