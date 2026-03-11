import { h } from "https://esm.sh/preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ModalShell } from "../modal-shell.js";
import { PageHeader } from "../page-header.js";
import { CloseIcon } from "../icons.js";
import { ActionButton } from "../action-button.js";
import { SessionSelectField } from "../session-select-field.js";
import { sendAgentMessage } from "../../lib/api.js";
import { showToast } from "../toast.js";
import { useAgentSessions } from "../../hooks/useAgentSessions.js";
import {
  kDestinationSessionFilter,
  kNoDestinationSessionValue,
  useDestinationSessionSelection,
} from "../../hooks/use-destination-session-selection.js";

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

const kSetupStepTitles = [
  "Install + Authenticate gcloud",
  "Enable APIs",
  "Create Topic + IAM",
  "Create Push Subscription",
  "Build with your Agent",
];
const kTutorialStepTitles = kSetupStepTitles.slice(0, 3);
const kNoSessionSelectedValue = kNoDestinationSessionValue;

const renderCommandBlock = (command = "", onCopy = () => {}) => html`
  <div class="rounded-lg border border-border bg-black/30 p-3">
    <pre
      class="pt-1 pl-2 text-[11px] leading-5 whitespace-pre-wrap break-all font-mono text-gray-300"
    >
${command}</pre
    >
    <div class="pt-3">
      <button
        type="button"
        onclick=${onCopy}
        class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
      >
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
  const [editingProjectId, setEditingProjectId] = useState(false);
  const [localError, setLocalError] = useState("");
  const [projectIdResolved, setProjectIdResolved] = useState(false);
  const [watchEnabled, setWatchEnabled] = useState(false);
  const [sendingToAgent, setSendingToAgent] = useState(false);
  const [agentMessageSent, setAgentMessageSent] = useState(false);

  const {
    selectedSessionKey,
    setSelectedSessionKey,
    loading: loadingAgentSessions,
    error: agentSessionsError,
  } = useAgentSessions({
    enabled: visible,
    filter: kDestinationSessionFilter,
  });
  const {
    sessions: selectableAgentSessions,
    destinationSessionKey,
    setDestinationSessionKey,
    selectedDestination,
  } = useDestinationSessionSelection({
    enabled: visible,
    resetKey: String(account?.id || ""),
  });

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setLocalError("");
    setProjectIdInput("");
    setEditingProjectId(false);
    setProjectIdResolved(false);
    setWatchEnabled(false);
    setSendingToAgent(false);
    setAgentMessageSent(false);
  }, [visible, account?.id]);

  const commands = clientConfig?.commands || null;
  const hasProjectIdFromConfig = Boolean(
    String(clientConfig?.projectId || "").trim() || commands,
  );
  const needsProjectId =
    editingProjectId || (!hasProjectIdFromConfig && !projectIdResolved);
  const detectedProjectId =
    String(projectIdInput || "").trim() ||
    String(clientConfig?.projectId || "").trim() ||
    "<project-id>";
  const hasExistingWebhookSetup = Boolean(clientConfig?.webhookExists);
  const stepTitles = hasExistingWebhookSetup ? kTutorialStepTitles : kSetupStepTitles;
  const totalSteps = stepTitles.length;
  const client =
    String(account?.client || clientConfig?.client || "default").trim() ||
    "default";

  const canAdvance = useMemo(() => {
    if (needsProjectId) {
      return String(projectIdInput || "").trim().length > 0;
    }
    return true;
  }, [needsProjectId, projectIdInput]);

  const handleCopy = useCallback(async (value) => {
    const ok = await copyText(value);
    if (ok) {
      showToast("Copied to clipboard", "success");
      return;
    }
    showToast("Could not copy text", "error");
  }, []);

  const handleChangeProjectId = useCallback(() => {
    setLocalError("");
    setProjectIdInput(String(clientConfig?.projectId || "").trim());
    setProjectIdResolved(false);
    setEditingProjectId(true);
  }, [clientConfig?.projectId]);

  const handleFinish = async () => {
    try {
      setLocalError("");
      await onFinish({
        client,
        projectId: String(projectIdInput || "").trim(),
        destination: selectedDestination,
      });
      setWatchEnabled(true);
      setStep((prev) => Math.min(prev + 1, totalSteps - 1));
    } catch (err) {
      setLocalError(err.message || "Could not finish setup");
    }
  };

  const handleNext = async () => {
    if (saving) return;
    if (needsProjectId) {
      if (!canAdvance) return;
      setLocalError("");
      try {
        await onSaveSetup({
          client,
          projectId: String(projectIdInput || "").trim(),
        });
        setEditingProjectId(false);
        setProjectIdResolved(true);
      } catch (err) {
        setLocalError(err.message || "Could not save project id");
        return;
      }
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleSendToAgent = async () => {
    if (sendingToAgent || agentMessageSent) return;
    try {
      setSendingToAgent(true);
      const accountEmail =
        String(account?.email || "this account").trim() || "this account";
      const message =
        `I just enabled Gmail watch for "${accountEmail}", set up the webhook, ` +
        `and created the transform file. Help me set up what I want to do ` +
        `with incoming email.`;
      await sendAgentMessage({
        message,
        sessionKey: selectedSessionKey,
      });
      setAgentMessageSent(true);
      showToast("Message sent to your agent", "success");
    } catch (err) {
      showToast(err.message || "Could not send message to agent", "error");
    } finally {
      setSendingToAgent(false);
    }
  };

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      closeOnOverlayClick=${false}
      closeOnEscape=${false}
      panelClassName="relative bg-modal border border-border rounded-xl p-6 max-w-2xl w-full space-y-4"
    >
      <button
        type="button"
        onclick=${onClose}
        class="absolute top-6 right-6 h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
        aria-label="Close modal"
      >
        <${CloseIcon} className="w-3.5 h-3.5 text-gray-300" />
      </button>
      <div class="text-xs text-gray-500">Gmail Pub / Sub Setup</div>
      <div class="flex items-center gap-1">
        ${stepTitles.map(
          (title, idx) => html`
            <div
              class=${`h-1 flex-1 rounded-full transition-colors ${idx <= step ? "bg-accent" : "bg-border"}`}
              style=${idx <= step ? "background: var(--accent)" : ""}
              title=${title}
            ></div>
          `,
        )}
      </div>
      <${PageHeader}
        title=${`Step ${step + 1} of ${totalSteps}: ${stepTitles[step]}`}
        actions=${null}
      />
      ${localError ? html`<div class="text-xs text-red-400">${localError}</div>` : null}
      ${
        needsProjectId
          ? html`
              <div
                class="rounded-lg border border-border bg-black/20 p-3 space-y-2"
              >
                <div class="text-sm">
                  ${editingProjectId
                    ? "Change project ID"
                    : "Project ID required"}
                </div>
                <div class="text-xs text-gray-500">
                  Find it in the${" "}
                  <a
                    href="https://console.cloud.google.com/home/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    class="ac-tip-link"
                  >
                    Google Cloud Console Project Selector
                  </a>
                </div>
                <input
                  type="text"
                  value=${projectIdInput}
                  oninput=${(event) => setProjectIdInput(event.target.value)}
                  class="w-full bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none"
                  placeholder="my-gcp-project"
                />
              </div>
            `
          : null
      }
      ${
        !needsProjectId && step === 0
          ? html`
              <div class="space-y-1">
                <div class="text-xs text-gray-500">
                  Using project <code>${detectedProjectId}</code>.
                </div>
                <div class="text-xs text-gray-500">
                  If <code>gcloud</code> is not installed on your computer,
                  follow the official install guide:${" "}
                  <a
                    href="https://docs.cloud.google.com/sdk/docs/install-sdk"
                    target="_blank"
                    rel="noreferrer"
                    class="ac-tip-link"
                  >
                    Google Cloud SDK install docs
                  </a>
                </div>
              </div>
              ${renderCommandBlock(
                `gcloud auth login\n` +
                  `gcloud config set project ${detectedProjectId}`,
                () =>
                  handleCopy(
                    `gcloud auth login\n` +
                      `gcloud config set project ${detectedProjectId}`,
                  ),
              )}
            `
          : null
      }
      ${
        !needsProjectId && step === 1
          ? renderCommandBlock(commands?.enableApis || "", () =>
              handleCopy(commands?.enableApis || ""),
            )
          : null
      }
      ${
        !needsProjectId && step === 2
          ? html`
              ${renderCommandBlock(
                `${commands?.createTopic || ""}\n\n${commands?.grantPublisher || ""}`.trim(),
                () =>
                  handleCopy(
                    `${commands?.createTopic || ""}\n\n${commands?.grantPublisher || ""}`.trim(),
                  ),
              )}
            `
          : null
      }
      ${
        !hasExistingWebhookSetup && !needsProjectId && step === 3
          ? html`
              ${renderCommandBlock(commands?.createSubscription || "", () =>
                handleCopy(commands?.createSubscription || ""),
              )}
              <div
                class="rounded-lg border border-border bg-black/20 p-3 space-y-2"
              >
                <${SessionSelectField}
                  label="Deliver to"
                  sessions=${selectableAgentSessions}
                  selectedSessionKey=${destinationSessionKey}
                  onChangeSessionKey=${setDestinationSessionKey}
                  disabled=${hasExistingWebhookSetup ||
                  loadingAgentSessions ||
                  saving}
                  loading=${loadingAgentSessions}
                  error=${agentSessionsError}
                  allowNone=${true}
                  noneValue=${kNoSessionSelectedValue}
                  noneLabel="Default"
                  loadingLabel="Loading sessions..."
                  helperText=${hasExistingWebhookSetup
                    ? "This Gmail webhook has already been created. To edit delivery routing, ask your agent."
                    : null}
                  selectClassName="w-full bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  helperClassName="text-xs text-gray-500"
                  statusClassName="text-[11px] text-gray-500"
                  errorClassName="text-[11px] text-red-400"
                />
              </div>
            `
          : null
      }
      ${
        !hasExistingWebhookSetup && step === 4
          ? html`
              <div
                class="rounded-lg border border-border bg-black/20 p-3 space-y-3"
              >
                <div class="pt-1 space-y-1">
                  <div class="text-sm">Continue with your agent</div>
                  <div class="text-xs text-gray-500">
                    Tell your OpenClaw agent about what you want to build with
                    incoming email to continue the setup.
                  </div>
                  <div class="pt-2 space-y-2">
                    <div class="text-[11px] text-gray-500">
                      Send this to session
                    </div>
                    <div class="flex items-center gap-2">
                      <select
                        value=${selectedSessionKey || kNoSessionSelectedValue}
                        oninput=${(event) => {
                          const nextValue = String(event.target.value || "");
                          setSelectedSessionKey(
                            nextValue === kNoSessionSelectedValue
                              ? ""
                              : nextValue,
                          );
                        }}
                        disabled=${loadingAgentSessions ||
                        sendingToAgent ||
                        agentMessageSent}
                        class="flex-1 min-w-0 bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ${!selectedSessionKey
                          ? html`<option value=${kNoSessionSelectedValue}>
                              Select a session...
                            </option>`
                          : null}
                        ${selectableAgentSessions.map(
                          (sessionRow) => html`
                            <option value=${sessionRow.key}>
                              ${sessionRow.label || sessionRow.key}
                            </option>
                          `,
                        )}
                      </select>
                      <${ActionButton}
                        onClick=${handleSendToAgent}
                        disabled=${!selectedSessionKey || agentMessageSent}
                        loading=${sendingToAgent}
                        idleLabel=${agentMessageSent ? "Sent" : "Send to Agent"}
                        loadingLabel="Sending..."
                        tone="primary"
                        size="sm"
                        className="h-[34px] px-3"
                      />
                    </div>
                    ${loadingAgentSessions
                      ? html`<div class="text-[11px] text-gray-500">
                          Loading sessions...
                        </div>`
                      : null}
                    ${agentSessionsError
                      ? html`<div class="text-[11px] text-red-400">
                          ${agentSessionsError}
                        </div>`
                      : null}
                  </div>
                </div>
              </div>
            `
          : null
      }
      <div class="grid grid-cols-2 gap-2 pt-2">
        ${
          step === 0
            ? html`${!needsProjectId
                ? html`<button
                    type="button"
                    onclick=${handleChangeProjectId}
                    class="justify-self-start text-xs px-2 py-1 rounded-lg ac-btn-ghost"
                  >
                    Change project ID
                  </button>`
                : html`<div></div>`}`
            : html`<${ActionButton}
                onClick=${() => setStep((prev) => Math.max(prev - 1, 0))}
                disabled=${saving}
                idleLabel="Back"
                tone="secondary"
                size="md"
                className="w-full justify-center"
              />`
        }
        ${
          !hasExistingWebhookSetup && step === totalSteps - 2
            ? html`<${ActionButton}
                onClick=${handleFinish}
                disabled=${false}
                loading=${saving}
                idleLabel="Enable watch"
                loadingLabel="Enabling..."
                tone="primary"
                size="md"
                className="w-full justify-center"
              />`
            : step < totalSteps - 1
            ? html`<${ActionButton}
                onClick=${handleNext}
                disabled=${saving || (needsProjectId && !canAdvance)}
                idleLabel="Next"
                tone="primary"
                size="md"
                className="w-full justify-center"
              />`
            : html`<${ActionButton}
                onClick=${onClose}
                disabled=${saving || sendingToAgent}
                idleLabel="Done"
                tone="secondary"
                size="md"
                className="w-full justify-center"
              />`
        }
      </div>
    </${ModalShell}>
  `;
};
