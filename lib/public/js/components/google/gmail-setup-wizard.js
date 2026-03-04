import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ModalShell } from "../modal-shell.js";
import { ActionButton } from "../action-button.js";
import { showToast } from "../toast.js";

const html = htm.bind(h);

const copyText = async (value) => {
  const text = String(value || "");
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const element = document.createElement("textarea");
    element.value = text;
    element.setAttribute("readonly", "");
    element.style.position = "fixed";
    element.style.opacity = "0";
    document.body.appendChild(element);
    element.select();
    document.execCommand("copy");
    document.body.removeChild(element);
    return true;
  } catch {
    return false;
  }
};

const kStepTitles = [
  "Install + Authenticate gcloud",
  "Enable APIs",
  "Create Topic + IAM",
  "Create Push Subscription",
  "Finish",
];

const renderCommandBlock = (command = "", onCopy = () => {}) =>
  html`
    <div class="rounded-lg border border-border bg-black/30 p-2">
      <pre class="text-[11px] leading-4 whitespace-pre-wrap break-all font-mono text-gray-300">${command}</pre>
      <div class="pt-2">
        <button type="button" onclick=${onCopy} class="text-xs px-2 py-1 rounded-lg ac-btn-ghost">
          Copy
        </button>
      </div>
    </div>
  `;

export const GmailSetupWizard = ({
  visible = false,
  account = null,
  clientConfig = null,
  saving = false,
  onClose = () => {},
  onSaveSetup = async () => {},
  onFinish = async () => {},
}) => {
  const [step, setStep] = useState(0);
  const [projectIdInput, setProjectIdInput] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setLocalError("");
    setProjectIdInput("");
  }, [visible, account?.id]);

  const commands = clientConfig?.commands || null;
  const needsProjectId = !String(clientConfig?.projectId || "").trim() && !commands;
  const detectedProjectId =
    String(clientConfig?.projectId || "").trim() ||
    String(projectIdInput || "").trim() ||
    "<project-id>";
  const client = String(account?.client || clientConfig?.client || "default").trim() || "default";

  const canAdvance = useMemo(() => {
    if (needsProjectId) {
      return String(projectIdInput || "").trim().length > 0;
    }
    return true;
  }, [needsProjectId, projectIdInput]);

  const handleCopy = async (value) => {
    const ok = await copyText(value);
    if (ok) {
      showToast("Copied to clipboard", "success");
      return;
    }
    showToast("Could not copy text", "error");
  };

  const handleSaveProjectId = async () => {
    setLocalError("");
    try {
      await onSaveSetup({
        client,
        projectId: String(projectIdInput || "").trim(),
      });
      showToast("Project ID saved", "success");
    } catch (err) {
      setLocalError(err.message || "Could not save project id");
    }
  };

  const handleFinish = async () => {
    try {
      await onFinish({
        client,
        projectId: String(projectIdInput || "").trim(),
      });
    } catch (err) {
      setLocalError(err.message || "Could not finish setup");
    }
  };

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      closeOnOverlayClick=${false}
      closeOnEscape=${false}
      panelClassName="bg-modal border border-border rounded-xl p-5 max-w-2xl w-full space-y-3"
    >
      <div class="space-y-1">
        <div class="text-base font-semibold">Gmail Setup Wizard</div>
        <div class="text-xs text-gray-500">
          ${account?.email
            ? `Set up Gmail Pub/Sub for ${account.email}.`
            : "Set up Gmail Pub/Sub for this Google client."}
        </div>
      </div>
      <div class="text-xs text-gray-500">Step ${step + 1} of 5: ${kStepTitles[step]}</div>
      ${localError ? html`<div class="text-xs text-red-400">${localError}</div>` : null}
      ${needsProjectId
        ? html`
            <div class="rounded-lg border border-border bg-black/20 p-3 space-y-2">
              <div class="text-sm">Project ID required</div>
              <div class="text-xs text-gray-500">
                Could not detect <code>project_id</code> from the OAuth credentials file for this client.
              </div>
              <input
                type="text"
                value=${projectIdInput}
                oninput=${(event) => setProjectIdInput(event.target.value)}
                class="w-full bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none"
                placeholder="my-gcp-project"
              />
              <${ActionButton}
                onClick=${handleSaveProjectId}
                disabled=${saving || !canAdvance}
                loading=${saving}
                tone="primary"
                size="sm"
                idleLabel="Save Project ID"
                loadingLabel="Saving..."
              />
            </div>
          `
        : null}
      ${!needsProjectId && step === 0
        ? html`
            <div class="rounded-lg border border-border bg-black/20 p-3 space-y-2">
              <div class="text-sm">Install and authenticate gcloud</div>
              <div class="text-xs text-gray-500">
                If <code>gcloud</code> is not installed, follow the official install guide:
                <a
                  href="https://docs.cloud.google.com/sdk/docs/install-sdk"
                  target="_blank"
                  rel="noreferrer"
                  class="underline text-cyan-200"
                >
                  Google Cloud SDK install docs
                </a>
              </div>
            </div>
            ${renderCommandBlock(
              `gcloud --version\n` +
                `gcloud auth login\n` +
                `gcloud config set project ${detectedProjectId}`,
              () =>
                handleCopy(
                  `gcloud --version\n` +
                    `gcloud auth login\n` +
                    `gcloud config set project ${detectedProjectId}`,
                ),
            )}
          `
        : null}
      ${!needsProjectId && step === 1
        ? renderCommandBlock(commands?.enableApis || "", () => handleCopy(commands?.enableApis || ""))
        : null}
      ${!needsProjectId && step === 2
        ? html`
            ${renderCommandBlock(
              `${commands?.createTopic || ""}\n\n${commands?.grantPublisher || ""}`.trim(),
              () =>
                handleCopy(
                  `${commands?.createTopic || ""}\n\n${commands?.grantPublisher || ""}`.trim(),
                ),
            )}
          `
        : null}
      ${!needsProjectId && step === 3
        ? renderCommandBlock(
            commands?.createSubscription || "",
            () => handleCopy(commands?.createSubscription || ""),
          )
        : null}
      ${step === 4
        ? html`
            <div class="rounded-lg border border-border bg-black/20 p-3 space-y-2">
              <div class="text-sm">Ready to enable watch</div>
              <div class="text-xs text-gray-500">
                Click finish to save setup for this client and enable Gmail watch for this account.
              </div>
            </div>
          `
        : null}
      <div class="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onclick=${() => setStep((prev) => Math.max(prev - 1, 0))}
          disabled=${step === 0 || saving}
          class="text-xs px-3 py-1.5 rounded-lg ac-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <div class="flex items-center gap-2">
          <button type="button" onclick=${onClose} class="text-xs px-3 py-1.5 rounded-lg ac-btn-ghost">
            Cancel
          </button>
          ${step < 4
            ? html`<button
                type="button"
                onclick=${() => setStep((prev) => Math.min(prev + 1, 4))}
                disabled=${saving || (needsProjectId && !canAdvance)}
                class="text-xs px-3 py-1.5 rounded-lg ac-btn-cyan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Done, Next
              </button>`
            : html`<${ActionButton}
                onClick=${handleFinish}
                disabled=${saving}
                loading=${saving}
                tone="primary"
                size="sm"
                idleLabel="Finish Setup"
                loadingLabel="Finishing..."
              />`}
        </div>
      </div>
    </${ModalShell}>
  `;
};
