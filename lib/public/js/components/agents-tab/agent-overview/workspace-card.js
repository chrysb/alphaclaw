import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { formatBytes } from "../../../lib/format.js";
import { useWorkspaceCard } from "./use-workspace-card.js";

const html = htm.bind(h);

export const WorkspaceCard = ({
  agent = {},
  onOpenWorkspace = () => {},
}) => {
  const {
    loadingWorkspaceSize,
    workspaceSizeBytes,
    workspaceSizeExists,
  } = useWorkspaceCard({ agent });

  return html`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-2">
      <h3 class="card-label">Workspace</h3>
      ${agent.workspace
        ? html`
            <div
              class="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-3"
            >
              <button
                type="button"
                class="text-sm font-mono break-all text-left ac-tip-link hover:underline md:min-w-0"
                onclick=${() => onOpenWorkspace(agent.workspace)}
              >
                ${agent.workspace}
              </button>
              <div class="text-xs text-gray-500 md:shrink-0 md:text-right">
                ${loadingWorkspaceSize
                  ? "Calculating size..."
                  : workspaceSizeBytes != null
                    ? formatBytes(workspaceSizeBytes)
                    : workspaceSizeExists
                      ? "Size unavailable"
                      : "Workspace directory not found"}
              </div>
            </div>
          `
        : html`<p class="text-sm text-gray-500">No workspace configured</p>`}
    </div>
  `;
};
