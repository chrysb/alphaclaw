import { h } from "preact";
import htm from "htm";
import { copyTextToClipboard } from "../lib/clipboard.js";
import { showToast } from "./toast.js";
import { FileCopyLineIcon } from "./icons.js";
import { InfoTooltip } from "./info-tooltip.js";
import { ToggleSwitch } from "./toggle-switch.js";

const html = htm.bind(h);

const getApiUrl = () => {
  if (typeof window === "undefined" || !window.location?.origin) return "/v1";
  return `${window.location.origin}/v1`;
};

export const ApiFeaturePanel = ({
  openAiCompatApi = { enabled: false },
  savingOpenAiCompatApi = false,
  onToggleOpenAiCompatApi = () => {},
}) => {
  const apiHydrated = openAiCompatApi?.hydrated === true;
  const apiEnabled = openAiCompatApi?.enabled === true;
  const apiUrl = getApiUrl();
  const handleCopy = async () => {
    const copied = await copyTextToClipboard(apiUrl);
    showToast(
      copied ? "API URL copied" : "Could not copy API URL",
      copied ? "success" : "error",
    );
  };

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 min-w-0">
          <h2 class="card-label">API</h2>
          <${InfoTooltip}
            text="Allows trusted server-side clients to call OpenClaw via an OpenAI compatible API."
            widthClass="w-72"
          />
        </div>
        <${ToggleSwitch}
          checked=${apiEnabled}
          disabled=${savingOpenAiCompatApi || !apiHydrated}
          label=${savingOpenAiCompatApi
            ? "Saving..."
            : !apiHydrated
              ? "Loading..."
              : apiEnabled
                ? "Enabled"
                : "Disabled"}
          onChange=${onToggleOpenAiCompatApi}
        />
      </div>
      ${apiHydrated && apiEnabled
        ? html`
            <div class="mt-4 text-xs text-fg-muted mb-2">OpenAI compatible URL</div>
            <div class="flex items-center gap-2">
              <code class="flex-1 min-w-0 bg-field border border-border rounded-lg px-3 py-2 text-xs text-body font-mono break-all">
                ${apiUrl}
              </code>
              <button
                type="button"
                class="ac-btn-secondary text-xs p-2 rounded-lg shrink-0"
                title="Copy URL"
                aria-label="Copy API URL"
                onclick=${handleCopy}
              >
                <${FileCopyLineIcon} className="w-4 h-4" />
              </button>
            </div>
          `
        : null}
    </div>
  `;
};
