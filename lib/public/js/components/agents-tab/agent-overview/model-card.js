import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Badge } from "../../badge.js";
import { LoadingSpinner } from "../../loading-spinner.js";
import { OverflowMenu, OverflowMenuItem } from "../../overflow-menu.js";
import {
  getModelDisplayLabel,
  SearchableModelPicker,
} from "../../models-tab/model-picker.js";
import { useModelCard } from "./use-model-card.js";

const html = htm.bind(h);

export const AgentModelCard = ({
  agent = {},
  saving = false,
  onUpdateAgent = async () => {},
  onSwitchToModels = () => {},
}) => {
  const {
    authorizedModelOptions,
    canEditModel,
    effectiveModel,
    effectiveModelEntry,
    handleClearModelOverride,
    handleSelectModel,
    hasDistinctModelOverride,
    loading,
    menuOpen,
    modelEntries,
    popularModels,
    remainingModelOptions,
    setMenuOpen,
    updatingModel,
  } = useModelCard({
    agent,
    onUpdateAgent,
  });

  return html`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <h3 class="card-label">Model</h3>
        ${loading
          ? null
          : html`
              <div class="flex items-center gap-2 min-h-6">
                ${effectiveModelEntry && !hasDistinctModelOverride
                  ? html`<${Badge} tone="neutral">Inherited</${Badge}>`
                  : null}
                <${OverflowMenu}
                  open=${menuOpen}
                  ariaLabel="Open model actions"
                  title="Open model actions"
                  onClose=${() => setMenuOpen(false)}
                  onToggle=${() => setMenuOpen((current) => !current)}
                >
                  ${hasDistinctModelOverride
                    ? html`
                        <${OverflowMenuItem}
                          onClick=${() => {
                            setMenuOpen(false);
                            handleClearModelOverride();
                          }}
                        >
                          Inherit from defaults
                        </${OverflowMenuItem}>
                      `
                    : null}
                  <${OverflowMenuItem}
                    onClick=${() => {
                      setMenuOpen(false);
                      onSwitchToModels();
                    }}
                  >
                    Manage models
                  </${OverflowMenuItem}>
                </${OverflowMenu}>
              </div>
            `}
      </div>
      ${loading
        ? html`
            <div class="flex items-center gap-2 text-sm text-gray-400 py-1">
              <${LoadingSpinner} className="h-4 w-4" />
              Loading model settings...
            </div>
          `
        : modelEntries.length === 0
          ? html`<p class="text-xs text-gray-500">
              No authorized models available yet. Add one from the Models tab
              first.
            </p>`
          : html`
              <div class="space-y-1">
                ${modelEntries.map(
                  (entry) => html`
                    <div
                      key=${entry.key}
                      class="flex items-center justify-between py-1"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-sm text-gray-200 truncate">
                          ${getModelDisplayLabel(entry)}
                        </span>
                        ${entry.key === effectiveModel
                          ? html`<${Badge} tone="cyan">Primary</${Badge}>`
                          : html`
                              <button
                                type="button"
                                onclick=${() => handleSelectModel(entry.key)}
                                class="text-xs px-2 py-0.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-white/5"
                              >
                                Set primary
                              </button>
                            `}
                      </div>
                    </div>
                  `,
                )}
              </div>
            `}
      ${loading
        ? null
        : remainingModelOptions.length > 0
          ? html`
              <div class="space-y-2">
                <${SearchableModelPicker}
                  options=${remainingModelOptions}
                  popularModels=${popularModels}
                  placeholder=${authorizedModelOptions.length > 0
                    ? "Add model..."
                    : "No authorized models available"}
                  onSelect=${handleSelectModel}
                  disabled=${saving ||
                  updatingModel ||
                  !canEditModel ||
                  remainingModelOptions.length === 0}
                />
                ${authorizedModelOptions.length === 0
                  ? html`
                      <p class="text-xs text-gray-500">
                        Add and authorize models from the Models tab before
                        assigning one here.
                      </p>
                    `
                  : html`
                      <p class="text-xs text-gray-500">
                        Only models that already have working auth are
                        available here.
                      </p>
                    `}
              </div>
            `
          : null}
    </div>
  `;
};
