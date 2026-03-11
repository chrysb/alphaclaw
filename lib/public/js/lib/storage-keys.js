// Centralized localStorage key registry.
// All standalone localStorage keys used by the Setup UI should be defined here
// so they stay discoverable, consistently prefixed, and free of collisions.
//
// Naming convention: "alphaclaw.<area>.<purpose>"

// --- UI settings (single JSON blob containing sub-keys) ---
export const kUiSettingsStorageKey = "alphaclaw.ui.settings";

// --- Browse / file viewer ---
export const kFileViewerModeStorageKey = "alphaclaw.browse.viewerMode";
export const kEditorSelectionStorageKey = "alphaclaw.browse.editorSelection";
export const kExpandedFoldersStorageKey = "alphaclaw.browse.expandedFolders";

// --- Browse / drafts ---
export const kFileDraftStorageKeyPrefix = "alphaclaw.browse.draft.";
export const kDraftIndexStorageKey = "alphaclaw.browse.draftIndex";

// --- Onboarding ---
export const kOnboardingStorageKey = "alphaclaw.onboarding.state";

// --- Telegram workspace ---
export const kTelegramWorkspaceStorageKey = "alphaclaw.telegram.workspaceState";
export const kTelegramWorkspaceCacheKey = "alphaclaw.telegram.workspaceCache";

// --- Agent sessions (shared across session pickers) ---
export const kAgentSessionsCacheKey = "alphaclaw.agent.sessionsCache";
export const kAgentLastSessionKey = "alphaclaw.agent.lastSessionKey";

