import { h } from "https://esm.sh/preact";
import { useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { buildApprovedImportSecrets } from "./welcome-secret-review-utils.js";

const html = htm.bind(h);

const kCategories = [
  {
    key: "gatewayConfig",
    label: "Gateway Config",
    icon: "⚙️",
    description: "openclaw.json configuration",
    showFiles: true,
  },
  {
    key: "envFiles",
    label: "Environment Files",
    icon: "🔐",
    description: ".env files with variables",
    showFiles: true,
  },
  {
    key: "workspaceFiles",
    label: "Workspace Files",
    icon: "📄",
    description: "Prompt files (AGENTS.md, SOUL.md, etc.)",
    showFiles: true,
  },
  {
    key: "skills",
    label: "Skills",
    icon: "🛠",
    description: "Custom skill definitions",
    showFiles: true,
  },
  {
    key: "cronJobs",
    label: "Cron Jobs",
    icon: "⏰",
    description: "Scheduled tasks",
    showFiles: true,
  },
  {
    key: "webhooks",
    label: "Hooks",
    icon: "🔗",
    description: "Webhook mappings and internal hooks",
    showDirs: true,
  },
  {
    key: "memory",
    label: "Memory",
    icon: "🧠",
    description: "Agent memory and embeddings",
    showDirs: true,
  },
];

const CategoryCard = ({ category, data }) => {
  const [expanded, setExpanded] = useState(false);
  if (!data?.found) return null;
  const isHooksCategory = category.key === "webhooks";
  const warningItems = Array.isArray(data.transformWarnings)
    ? data.transformWarnings
    : [];
  const warningPathPrefixes = new Set(
    warningItems
      .map((warning) => String(warning.actualPath || "").trim())
      .filter(Boolean)
      .map((pathValue) => pathValue.split("/").slice(0, -2).join("/")),
  );

  const items = [
    ...(data.jobNames || []),
    ...(data.hookNames || []),
    ...(data.files || []),
    ...(data.dirs || []).filter((dir) => !warningPathPrefixes.has(dir)),
    ...(data.extraMarkdown || []),
  ];
  const count =
    typeof data.jobCount === "number" && data.jobCount > 0
      ? data.jobCount
      : typeof data.hookCount === "number" && data.hookCount > 0
        ? data.hookCount
        : items.length;
  const warningCount =
    typeof data.warningCount === "number"
      ? data.warningCount
      : warningItems.length;

  return html`
    <div class="border border-border rounded-lg p-3">
      <button
        type="button"
        onclick=${() => setExpanded((p) => !p)}
        class="w-full flex items-center justify-between text-left"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm">${category.icon}</span>
          <span class="text-xs font-medium text-gray-200"
            >${category.label}</span
          >
          <span
            class="text-xs px-1.5 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300"
            >${count}</span
          >
        </div>
        <div class="flex items-center gap-2">
          ${warningCount > 0
            ? html`
                <span
                  class="text-xs px-1.5 py-0.5 rounded-full bg-yellow-900/30 text-yellow-300"
                >
                  ⚠ ${warningCount}
                </span>
              `
            : null}
          <span class="text-xs text-gray-500">${expanded ? "▲" : "▼"}</span>
        </div>
      </button>
      ${expanded &&
      items.length > 0 &&
      html`
        <div class="mt-2 space-y-1">
          ${items.map(
            (item) => html`
              <div
                class="text-xs font-mono bg-black/20 rounded px-2 py-1 text-gray-500"
              >
                ${item}
              </div>
            `,
          )}
          ${isHooksCategory
            ? warningItems.map(
                (warning) => html`
                  <div
                    class="text-xs font-mono bg-black/20 rounded px-2 py-1 text-yellow-300"
                  >
                    ${warning.actualPath}
                  </div>
                `,
              )
            : null}
        </div>
      `}
    </div>
  `;
};

export const WelcomeImportStep = ({
  scanResult,
  scanning,
  error,
  onApprove,
  onShowSecretReview,
  onBack,
}) => {
  if (scanning) {
    return html`
      <div class="flex flex-col items-center justify-center py-8 gap-3">
        <${LoadingSpinner} />
        <p class="text-sm text-gray-400">Scanning repository...</p>
      </div>
    `;
  }

  if (error) {
    return html`
      <div class="space-y-3">
        <div
          class="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-300 text-sm"
        >
          ${error}
        </div>
        <button
          onclick=${onBack}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-secondary"
        >
          Back
        </button>
      </div>
    `;
  }

  if (!scanResult) return null;

  const secretCount = (scanResult.secrets || []).length;
  const hasConflicts = scanResult.managedConflicts?.found;

  return html`
    <div class="space-y-3">
      <div>
        <h2 class="text-sm font-medium text-gray-200">Import Summary</h2>
        <p class="text-xs text-gray-500">
          ${scanResult.hasOpenclawSetup
            ? "Found an existing OpenClaw setup"
            : "No OpenClaw config detected — we'll set up fresh after import"}
        </p>
      </div>

      <div class="space-y-2">
        ${kCategories.map(
          (cat) => html`
            <${CategoryCard}
              key=${cat.key}
              category=${cat}
              data=${scanResult[cat.key]}
            />
          `,
        )}
      </div>

      ${scanResult.credentials?.found &&
      html`
        <div
          class="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 text-xs text-yellow-300"
        >
          Deployment-specific files found (credentials, device identity) — these
          will not be imported.
        </div>
      `}
      ${hasConflicts &&
      html`
        <div
          class="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 text-xs text-yellow-300"
        >
          AlphaClaw-managed files detected
          (${(scanResult.managedConflicts.files || []).join(", ")}). These will
          be overwritten with AlphaClaw defaults.
        </div>
      `}
      ${scanResult.managedEnvConflicts?.found
        ? html`
            <div
              class="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 text-xs text-yellow-300"
            >
              AlphaClaw controls deployment tokens and env vars
              (${(scanResult.managedEnvConflicts.vars || []).join(", ")}).
              Imported values for these will be overwritten with
              AlphaClaw-managed env var references during import.
            </div>
          `
        : null}
      ${scanResult.webhooks?.warningCount > 0
        ? html`
            <div
              class="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3 text-xs text-yellow-300"
            >
              AlphaClaw expects hook transforms at
              <code class="text-xs bg-black/30 px-1 rounded"
                >hooks/transforms/name/name-transform.mjs</code
              >. We found some that do not match and will try to patch them
              during import. The originals will be backed up under
              <code class="text-xs bg-black/30 px-1 rounded"
                >hooks/transforms/_backup</code
              >.
            </div>
          `
        : null}
      ${secretCount > 0 &&
      html`
        <div
          class="bg-cyan-900/20 border border-cyan-800/50 rounded-lg p-3 flex items-center justify-between"
        >
          <div>
            <span class="text-xs text-cyan-300 font-medium">
              ${`${secretCount} possible secret${secretCount === 1 ? "" : "s"} detected`}
            </span>
            <p class="text-xs text-gray-500 mt-0.5">
              Review and extract to environment variables
            </p>
          </div>
          <${ActionButton}
            onClick=${onShowSecretReview}
            tone="primary"
            size="sm"
            idleLabel="Review"
            className="font-medium"
          />
        </div>
      `}

      <div class="grid grid-cols-2 gap-2 pt-1">
        <${ActionButton}
          onClick=${onBack}
          tone="secondary"
          size="md"
          idleLabel="Back"
          className="w-full"
        />
        <${ActionButton}
          onClick=${() =>
            onApprove(buildApprovedImportSecrets(scanResult.secrets))}
          loading=${scanning}
          tone="primary"
          size="md"
          idleLabel="Import"
          loadingLabel="Importing..."
          className="w-full"
        />
      </div>
    </div>
  `;
};
