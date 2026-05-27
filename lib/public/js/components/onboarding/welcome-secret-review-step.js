import { h } from "preact";
import { useState, useCallback } from "preact/hooks";
import htm from "htm";
import { ActionButton } from "../action-button.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { buildApprovedImportSecrets } from "./welcome-secret-review-utils.js";

const html = htm.bind(h);

const SecretRow = ({ secret, selected, onToggle, envVarName, onEnvVarChange }) =>
  html`
    <div
      class="border border-border rounded-lg p-3 space-y-2 ${selected
        ? "bg-status-info-bg border-status-info-border"
        : ""}"
    >
      <div class="flex items-start gap-2">
        <input
          type="checkbox"
          checked=${selected}
          onChange=${onToggle}
          class="mt-0.5 rounded"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-mono text-body truncate"
              >${secret.maskedValue}</span
            >
            ${secret.confidence === "high"
              ? html`<span
                  class="text-xs px-1.5 py-0.5 rounded-full bg-status-error-bg text-status-error"
                  >high confidence</span
                >`
              : html`<span
                  class="text-xs px-1.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning"
                  >possible</span
                >`}
          </div>
          <div class="text-xs text-fg-muted mt-1">
            Found in${" "}
            <span class="font-mono">${secret.file || "config"}</span>
            ${secret.configPath
              ? html` at <span class="font-mono">${secret.configPath}</span>`
              : null}
          </div>
          ${secret.duplicateIn &&
          html`
            <div class="text-xs text-status-warning-muted mt-1">
              Also found in${" "}<span class="font-mono"
                >${secret.duplicateIn}</span
              >
            </div>
          `}
        </div>
      </div>
      ${selected &&
      html`
        <div class="pl-6">
          <label class="text-xs text-fg-muted">Extract as env var:</label>
          <input
            type="text"
            value=${envVarName}
            onInput=${(e) => onEnvVarChange(e.target.value)}
            class="w-full mt-1 bg-field border border-border rounded-lg px-3 py-1.5 text-xs text-body outline-none focus:border-fg-muted font-mono"
          />
        </div>
      `}
    </div>
  `;

export const WelcomeSecretReviewStep = ({
  secrets = [],
  onApprove,
  onBack,
  loading,
  error,
}) => {
  const [selections, setSelections] = useState(() => {
    const initial = {};
    for (const secret of secrets) {
      initial[secret.configPath] = {
        selected: secret.confidence === "high",
        envVarName: secret.suggestedEnvVar || "",
      };
    }
    return initial;
  });

  const toggleSecret = useCallback(
    (configPath) => {
      setSelections((prev) => ({
        ...prev,
        [configPath]: {
          ...prev[configPath],
          selected: !prev[configPath]?.selected,
        },
      }));
    },
    [],
  );

  const updateEnvVarName = useCallback(
    (configPath, name) => {
      setSelections((prev) => ({
        ...prev,
        [configPath]: {
          ...prev[configPath],
          envVarName: name,
        },
      }));
    },
    [],
  );

  const selectedCount = Object.values(selections).filter(
    (s) => s.selected,
  ).length;

  const handleExtract = () => {
    const approved = buildApprovedImportSecrets(
      secrets.map((secret) => ({
        ...secret,
        confidence: selections[secret.configPath]?.selected
          ? "high"
          : "medium",
        suggestedEnvVar:
          selections[secret.configPath]?.envVarName || secret.suggestedEnvVar,
      })),
    );
    onApprove(approved);
  };

  if (loading) {
    return html`
      <div class="flex flex-col items-center justify-center py-8 gap-3">
        <${LoadingSpinner} />
        <p class="text-sm text-fg-muted">Applying import...</p>
      </div>
    `;
  }

  return html`
    <div class="space-y-3">
      <div>
        <h2 class="text-sm font-medium text-body">Review Secrets</h2>
        <p class="text-xs text-fg-muted">
          Select secrets to extract into environment variables. Inline values in
          config will be replaced with ${"`"}${"${"}ENV_VAR_NAME${"}"}${"`"} references.
        </p>
      </div>

      ${error &&
      html`
        <div
          class="bg-status-error-bg border border-status-error-border rounded-xl p-3 text-status-error text-sm"
        >
          ${error}
        </div>
      `}

      <div class="space-y-2 max-h-80 overflow-y-auto">
        ${secrets.map(
          (secret) => html`
            <${SecretRow}
              key=${secret.configPath}
              secret=${secret}
              selected=${selections[secret.configPath]?.selected || false}
              envVarName=${selections[secret.configPath]?.envVarName || ""}
              onToggle=${() => toggleSecret(secret.configPath)}
              onEnvVarChange=${(name) =>
                updateEnvVarName(secret.configPath, name)}
            />
          `,
        )}
      </div>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <${ActionButton}
          onClick=${onBack}
          tone="secondary"
          size="md"
          idleLabel="Back"
          className="w-full"
        />
        <${ActionButton}
          onClick=${handleExtract}
          tone="primary"
          size="md"
          idleLabel=${selectedCount > 0
            ? `Extract ${selectedCount} Secret${selectedCount === 1 ? "" : "s"}`
            : "Skip All"}
          className="w-full"
        />
      </div>
    </div>
  `;
};
