import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../../action-button.js";

const html = htm.bind(h);

export const ManageCard = ({
  agent = {},
  saving = false,
  onSetDefault = () => {},
  onDelete = () => {},
}) => {
  const isMain = String(agent.id || "") === "main";

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h3 class="card-label mb-3">Manage</h3>
      <div class="flex flex-wrap items-center gap-2">
        ${!agent.default
          ? html`
              <${ActionButton}
                onClick=${() => onSetDefault(agent.id)}
                disabled=${saving}
                tone="secondary"
                size="sm"
                idleLabel="Set as default"
              />
            `
          : null}
        ${!isMain
          ? html`
              <${ActionButton}
                onClick=${() => onDelete(agent)}
                disabled=${saving}
                tone="danger"
                size="sm"
                idleLabel="Delete agent"
              />
            `
          : null}
      </div>
    </div>
  `;
};
