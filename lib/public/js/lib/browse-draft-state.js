export const kFileDraftStorageKeyPrefix = "alphaclaw.browse.draft.";
export const kLegacyFileDraftStorageKeyPrefix = "alphaclawBrowseDraft:";
export const kDraftIndexStorageKey = "alphaclaw.draftIndex";
export const kDraftIndexChangedEventName = "alphaclaw:browse-draft-index-changed";

const getStorage = (storage) => storage || window.localStorage;

export const getFileDraftStorageKey = (filePath, useLegacyPrefix = false) =>
  `${useLegacyPrefix ? kLegacyFileDraftStorageKeyPrefix : kFileDraftStorageKeyPrefix}${String(filePath || "").trim()}`;

export const readStoredFileDraft = (filePath, storage) => {
  try {
    if (!filePath) return "";
    const localStorage = getStorage(storage);
    const draft =
      localStorage.getItem(getFileDraftStorageKey(filePath)) ||
      localStorage.getItem(getFileDraftStorageKey(filePath, true));
    return typeof draft === "string" ? draft : "";
  } catch {
    return "";
  }
};

export const writeStoredFileDraft = (filePath, content, storage) => {
  try {
    if (!filePath) return;
    const localStorage = getStorage(storage);
    localStorage.setItem(getFileDraftStorageKey(filePath), String(content || ""));
  } catch {}
};

export const clearStoredFileDraft = (filePath, storage) => {
  try {
    if (!filePath) return;
    const localStorage = getStorage(storage);
    localStorage.removeItem(getFileDraftStorageKey(filePath));
    localStorage.removeItem(getFileDraftStorageKey(filePath, true));
  } catch {}
};

export const readDraftIndex = (storage) => {
  try {
    const localStorage = getStorage(storage);
    const rawValue = localStorage.getItem(kDraftIndexStorageKey);
    if (!rawValue) return new Set();
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return new Set();
    return new Set(
      parsedValue.map((entry) => String(entry || "").trim()).filter(Boolean),
    );
  } catch {
    return new Set();
  }
};

export const writeDraftIndex = (draftPaths, options = {}) => {
  const { storage, dispatchEvent } = options;
  try {
    const localStorage = getStorage(storage);
    const normalizedPaths = Array.from(draftPaths).sort((left, right) =>
      left.localeCompare(right),
    );
    localStorage.setItem(kDraftIndexStorageKey, JSON.stringify(normalizedPaths));
    if (dispatchEvent) {
      dispatchEvent(
        new CustomEvent(kDraftIndexChangedEventName, {
          detail: { paths: normalizedPaths },
        }),
      );
    }
  } catch {}
};

export const updateDraftIndex = (filePath, hasDraft, options = {}) => {
  const { storage, dispatchEvent } = options;
  if (!filePath) return;
  const normalizedPath = String(filePath || "").trim();
  if (!normalizedPath) return;
  const nextDraftPaths = readDraftIndex(storage);
  if (hasDraft) nextDraftPaths.add(normalizedPath);
  else nextDraftPaths.delete(normalizedPath);
  writeDraftIndex(nextDraftPaths, { storage, dispatchEvent });
};

export const readStoredDraftPaths = (storage) => {
  try {
    const localStorage = getStorage(storage);
    const draftIndex = readDraftIndex(localStorage);
    if (draftIndex.size > 0) return draftIndex;
    const nextDraftPaths = new Set();
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || "";
      if (key.startsWith(kFileDraftStorageKeyPrefix)) {
        const path = key.slice(kFileDraftStorageKeyPrefix.length).trim();
        if (path) nextDraftPaths.add(path);
      }
      if (key.startsWith(kLegacyFileDraftStorageKeyPrefix)) {
        const path = key.slice(kLegacyFileDraftStorageKeyPrefix.length).trim();
        if (path) nextDraftPaths.add(path);
      }
    }
    if (nextDraftPaths.size > 0) {
      writeDraftIndex(nextDraftPaths, { storage: localStorage });
    }
    return nextDraftPaths;
  } catch {
    return new Set();
  }
};
