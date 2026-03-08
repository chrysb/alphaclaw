import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { SecretInput } from "../secret-input.js";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";
import { SegmentedControl } from "../segmented-control.js";
import {
  kGithubFlowFresh,
  kGithubFlowImport,
  kGithubTargetRepoModeCreate,
  kGithubTargetRepoModeExistingEmpty,
} from "./welcome-config.js";

const html = htm.bind(h);

export const WelcomeFormStep = ({
  activeGroup,
  vals,
  hasAi,
  setValue,
  modelOptions,
  modelsLoading,
  modelsError,
  canToggleFullCatalog,
  showAllModels,
  setShowAllModels,
  selectedProvider,
  codexLoading,
  codexStatus,
  startCodexAuth,
  handleCodexDisconnect,
  codexAuthStarted,
  codexAuthWaiting,
  codexManualInput,
  setCodexManualInput,
  completeCodexAuth,
  codexExchanging,
  visibleAiFieldKeys,
  error,
  step,
  totalGroups,
  currentGroupValid,
  goBack,
  goNext,
  loading,
  githubStepLoading,
  allValid,
  handleSubmit,
}) => {
  const [showOptionalOpenai, setShowOptionalOpenai] = useState(false);
  const [showOptionalGemini, setShowOptionalGemini] = useState(false);
  const githubFlow = vals._GITHUB_FLOW || kGithubFlowFresh;
  const freshRepoMode =
    githubFlow === kGithubFlowImport
      ? kGithubTargetRepoModeCreate
      : vals._GITHUB_TARGET_REPO_MODE || kGithubTargetRepoModeCreate;

  useEffect(() => {
    if (activeGroup.id !== "github") return;
  }, [activeGroup.id]);

  useEffect(() => {
    if (step === totalGroups - 1) {
      setShowOptionalOpenai(!vals.OPENAI_API_KEY);
      setShowOptionalGemini(!vals.GEMINI_API_KEY);
    }
  }, [step === totalGroups - 1]);

  return html`
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-medium text-gray-200">${activeGroup.title}</h2>
        <p class="text-xs text-gray-500">${activeGroup.description}</p>
      </div>
      ${activeGroup.validate(vals, { hasAi })
        ? html`<span
            class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-900/50 text-green-400"
            >✓</span
          >`
        : activeGroup.id !== "tools"
          ? html`<span
              class="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-400"
              >Required</span
            >`
          : null}
    </div>

    ${activeGroup.id === "ai" &&
    html`
      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-400">Model</label>
        <select
          value=${vals.MODEL_KEY || ""}
          onInput=${(e) => setValue("MODEL_KEY", e.target.value)}
          class="w-full bg-black/30 border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
        >
          <option value="">Select a model</option>
          ${modelOptions.map(
            (model) => html`
              <option value=${model.key}>${model.label || model.key}</option>
            `,
          )}
        </select>
        <p class="text-xs text-gray-600">
          ${modelsLoading
            ? "Loading model catalog..."
            : modelsError
              ? modelsError
              : ""}
        </p>
        ${canToggleFullCatalog &&
        html`
          <button
            type="button"
            onclick=${() => setShowAllModels((prev) => !prev)}
            class="text-xs text-gray-500 hover:text-gray-300"
          >
            ${showAllModels
              ? "Show recommended models"
              : "Show full model catalog"}
          </button>
        `}
      </div>
    `}
    ${activeGroup.id === "ai" &&
    selectedProvider === "openai-codex" &&
    html`
      <div class="bg-black/20 border border-border rounded-lg p-3 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">Codex OAuth</span>
          ${codexLoading
            ? html`<span class="text-xs text-gray-500">Checking...</span>`
            : codexStatus.connected
              ? html`<${Badge} tone="success">Connected</${Badge}>`
              : html`<${Badge} tone="warning">Not connected</${Badge}>`}
        </div>
        <div class="flex gap-2">
          <${ActionButton}
            onClick=${startCodexAuth}
            tone=${codexStatus.connected || codexAuthStarted
              ? "neutral"
              : "primary"}
            size="sm"
            idleLabel=${codexStatus.connected
              ? "Reconnect Codex"
              : "Connect Codex OAuth"}
            className="font-medium"
          />
          ${codexStatus.connected &&
          html`
            <${ActionButton}
              onClick=${handleCodexDisconnect}
              tone="ghost"
              size="sm"
              idleLabel="Disconnect"
              className="font-medium"
            />
          `}
        </div>
        ${!codexStatus.connected &&
        codexAuthStarted &&
        html`
          <div class="space-y-1 pt-1">
            <p class="text-xs text-gray-500">
              ${codexAuthWaiting
                ? "Complete login in the popup, then paste the full redirect URL from the address bar (starts with "
                : "Paste the full redirect URL from the address bar (starts with "}
              <code class="text-xs bg-black/30 px-1 rounded"
                >http://localhost:1455/auth/callback</code
              >) ${codexAuthWaiting ? " to finish setup." : " to finish setup."}
            </p>
            <input
              type="text"
              value=${codexManualInput}
              onInput=${(e) => setCodexManualInput(e.target.value)}
              placeholder="http://localhost:1455/auth/callback?code=...&state=..."
              class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-gray-500"
            />
            <${ActionButton}
              onClick=${completeCodexAuth}
              disabled=${!codexManualInput.trim() || codexExchanging}
              loading=${codexExchanging}
              tone="primary"
              size="sm"
              idleLabel="Complete Codex OAuth"
              loadingLabel="Completing..."
              className="font-medium"
            />
          </div>
        `}
      </div>
    `}
    ${activeGroup.id === "github" &&
    html`
      <div class="space-y-3">
        ${githubFlow === kGithubFlowFresh
          ? html`
              <div class="space-y-1">
                <${SegmentedControl}
                  options=${[
                    {
                      label: "Create new repo",
                      value: kGithubTargetRepoModeCreate,
                    },
                    {
                      label: "Use existing empty repo",
                      value: kGithubTargetRepoModeExistingEmpty,
                    },
                  ]}
                  value=${freshRepoMode}
                  onChange=${(value) =>
                    setValue("_GITHUB_TARGET_REPO_MODE", value)}
                  fullWidth=${true}
                />
              </div>
            `
          : null}
      </div>
    `}
    ${(activeGroup.id === "ai"
      ? activeGroup.fields.filter((field) => visibleAiFieldKeys.has(field.key))
      : activeGroup.id === "github"
        ? activeGroup.fields.filter((field) =>
            githubFlow === kGithubFlowImport
              ? true
              : field.key !== "_GITHUB_SOURCE_REPO",
          )
        : activeGroup.fields
    ).map(
      (field) => html`
        <div class="space-y-1" key=${field.key}>
          <label class="text-xs font-medium text-gray-400"
            >${field.label}</label
          >
          <${SecretInput}
            key=${field.key}
            value=${vals[field.key] || ""}
            onInput=${(e) => setValue(field.key, e.target.value)}
            placeholder=${field.placeholder || ""}
            isSecret=${!field.isText}
            inputClass="flex-1 bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
          />
          <p class="text-xs text-gray-600">
            ${activeGroup.id === "github" &&
            field.key === "GITHUB_WORKSPACE_REPO"
              ? githubFlow === kGithubFlowImport
                ? "Your new project will live here"
                : freshRepoMode === kGithubTargetRepoModeExistingEmpty
                  ? "Enter the owner/repo of an existing empty repository"
                  : "A new private repo will be created for you"
              : activeGroup.id === "github" &&
                  field.key === "_GITHUB_SOURCE_REPO"
                ? "The repo to import from"
                : activeGroup.id === "github" && field.key === "GITHUB_TOKEN"
                  ? githubFlow === kGithubFlowImport
                    ? freshRepoMode === kGithubTargetRepoModeCreate
                      ? html`Use a classic PAT with${" "}<code
                            class="text-xs bg-black/30 px-1 rounded"
                            >repo</code
                          >${" "}scope to create the target repo. Fine-grained
                          works if the target already exists and can access both
                          repos.`
                      : html`Use a classic PAT with${" "}<code
                            class="text-xs bg-black/30 px-1 rounded"
                            >repo</code
                          >${" "}scope, or a fine-grained token with Contents +
                          Metadata access to both the source repo and target
                          repo`
                    : freshRepoMode === kGithubTargetRepoModeExistingEmpty
                      ? html`Use a classic PAT with${" "}<code
                            class="text-xs bg-black/30 px-1 rounded"
                            >repo</code
                          >${" "}scope, or a fine-grained token with Contents +
                          Metadata access to this repo`
                      : html`Use a classic PAT with${" "}<code
                            class="text-xs bg-black/30 px-1 rounded"
                            >repo</code
                          >${" "}scope to create a new private repository`
                  : field.hint}
          </p>
        </div>
      `,
    )}
    ${error
      ? html`<div
          class="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-300 text-sm"
        >
          ${error}
        </div>`
      : null}
    ${step === totalGroups - 1 && (showOptionalOpenai || showOptionalGemini)
      ? html`
          ${showOptionalOpenai
            ? html`<div class="space-y-1">
                <label class="text-xs font-medium text-gray-400"
                  >OpenAI API Key</label
                >
                <${SecretInput}
                  value=${vals.OPENAI_API_KEY || ""}
                  onInput=${(e) => setValue("OPENAI_API_KEY", e.target.value)}
                  placeholder="sk-..."
                  isSecret=${true}
                  inputClass="flex-1 bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
                />
                <p class="text-xs text-gray-600">
                  Used for memory embeddings -${" "}
                  <a
                    href="https://platform.openai.com"
                    target="_blank"
                    class="hover:underline"
                    style="color: var(--accent-link)"
                    >get key</a
                  >
                </p>
              </div>`
            : null}
          ${showOptionalGemini
            ? html`<div class="space-y-1">
                <label class="text-xs font-medium text-gray-400"
                  >Gemini API Key</label
                >
                <${SecretInput}
                  value=${vals.GEMINI_API_KEY || ""}
                  onInput=${(e) => setValue("GEMINI_API_KEY", e.target.value)}
                  placeholder="AI..."
                  isSecret=${true}
                  inputClass="flex-1 bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
                />
                <p class="text-xs text-gray-600">
                  Used for memory embeddings and Nano Banana -${" "}
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    class="hover:underline"
                    style="color: var(--accent-link)"
                    >get key</a
                  >
                </p>
              </div>`
            : null}
        `
      : null}

    <div class="grid grid-cols-2 gap-2 pt-3">
      ${step < totalGroups - 1
        ? html`
            ${step >= 0
              ? html`<${ActionButton}
                  onClick=${goBack}
                  tone="secondary"
                  size="md"
                  idleLabel="Back"
                  className="w-full"
                />`
              : html`<div class="w-full"></div>`}
            <${ActionButton}
              onClick=${goNext}
              disabled=${!currentGroupValid}
              loading=${activeGroup.id === "github" && githubStepLoading}
              tone="primary"
              size="md"
              idleLabel=${activeGroup.id === "github" &&
              githubFlow === kGithubFlowImport
                ? "Check compatibility"
                : "Next"}
              loadingLabel="Checking..."
              className="w-full"
            />
          `
        : html`
            ${step >= 0
              ? html`<${ActionButton}
                  onClick=${goBack}
                  tone="secondary"
                  size="md"
                  idleLabel="Back"
                  className="w-full"
                />`
              : html`<div class="w-full"></div>`}
            <${ActionButton}
              onClick=${handleSubmit}
              disabled=${!allValid}
              loading=${loading}
              tone="primary"
              size="md"
              idleLabel="Next"
              loadingLabel="Starting..."
              className="w-full"
            />
          `}
    </div>
  `;
};
