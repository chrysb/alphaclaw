export const kUiSettingsStorageKey = "alphaclaw.uiSettings";

const parseSettings = (rawValue) => {
  if (!rawValue) return {};
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const readUiSettings = () => {
  try {
    const rawValue = window.localStorage.getItem(kUiSettingsStorageKey);
    return parseSettings(rawValue);
  } catch {
    return {};
  }
};

export const writeUiSettings = (nextSettings) => {
  try {
    window.localStorage.setItem(
      kUiSettingsStorageKey,
      JSON.stringify(
        nextSettings && typeof nextSettings === "object" ? nextSettings : {},
      ),
    );
  } catch {}
};

export const updateUiSettings = (updater) => {
  const currentSettings = readUiSettings();
  const nextSettings = updater(currentSettings);
  writeUiSettings(nextSettings);
  return nextSettings;
};
