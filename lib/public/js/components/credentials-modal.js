import { h } from "https://esm.sh/preact";
import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { saveGoogleCredentials } from "../lib/api.js";
import { SecretInput } from "./secret-input.js";
import { ModalShell } from "./modal-shell.js";
import { PageHeader } from "./page-header.js";
import { ActionButton } from "./action-button.js";
import { CloseIcon } from "./icons.js";
const html = htm.bind(h);

export const CredentialsModal = ({
  visible,
  onClose,
  onSaved,
  title = "Connect Google Workspace",
  submitLabel = "Connect Google",
  defaultInstrType = "workspace",
  client = "default",
  personal = false,
  accountId = "",
  initialValues = {},
}) => {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [instrType, setInstrType] = useState(defaultInstrType);
  const [redirectUriCopied, setRedirectUriCopied] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setClientId(String(initialValues.clientId || ""));
    setClientSecret(String(initialValues.clientSecret || ""));
    setEmail(String(initialValues.email || ""));
    setInstrType(defaultInstrType);
    setError("");
    setRedirectUriCopied(false);
  }, [visible, initialValues, defaultInstrType]);

  if (!visible) return null;

  const redirectUri = `${window.location.origin}/auth/google/callback`;

  const copyRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      setRedirectUriCopied(true);
      window.setTimeout(() => setRedirectUriCopied(false), 1500);
    } catch {
      setError("Unable to copy redirect URI");
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const creds = json.installed || json.web || json;
      if (creds.client_id) setClientId(creds.client_id);
      if (creds.client_secret) setClientSecret(creds.client_secret);
    } catch {
      setError("Invalid JSON file");
    }
  };

  const submit = async () => {
    setError("");
    if (!clientId || !clientSecret || !email) {
      setError("Client ID, Client Secret, and Email are required");
      return;
    }
    setSaving(true);
    try {
      const data = await saveGoogleCredentials({
        clientId,
        clientSecret,
        email,
        client,
        personal,
        accountId,
      });
      if (data.ok) {
        onClose();
        onSaved?.(data.account);
      } else setError(data.error || "Failed to save credentials");
    } catch {
      setError("Request failed");
    } finally {
      setSaving(false);
    }
  };

  const btnCls = (type) =>
    `flex-1 text-center border-0 cursor-pointer transition-colors` +
    ` ${instrType === type ? "" : "hover:text-white"}`;

  const btnStyle = (type) =>
    `font-family: inherit; font-size: 11px; letter-spacing: 0.03em; padding: 5px 10px;` +
    (instrType === type
      ? ` color: var(--accent); background: var(--bg-active);`
      : ` color: var(--text-muted); background: transparent;`);

  const renderRedirectUriInstruction = () => html`
    <div class="mt-1 flex items-center gap-2">
      <input
        type="text"
        readonly
        value=${redirectUri}
        onFocus=${(e) => e.target.select()}
        onclick=${(e) => e.target.select()}
        class="flex-1 min-w-0 bg-black/40 border border-border rounded px-2 py-1 text-gray-300 text-xs focus:outline-none focus:border-gray-500"
      />
      <button
        type="button"
        onclick=${copyRedirectUri}
        class="shrink-0 px-2 py-1 rounded border border-border text-xs text-gray-300 hover:border-gray-500"
      >
        ${redirectUriCopied ? "Copied" : "Copy"}
      </button>
    </div>
  `;

  return html` <${ModalShell}
    visible=${visible}
    onClose=${onClose}
    closeOnOverlayClick=${false}
    panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full space-y-4"
  >
      <${PageHeader}
        title=${title}
        actions=${html`
          <button
            type="button"
            onclick=${onClose}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${CloseIcon} className="w-3.5 h-3.5 text-gray-300" />
          </button>
        `}
      />
      <div class="space-y-3">
        <div>
          <p class="text-gray-400 text-sm mb-3">
            You'll need a Google Cloud OAuth app.${" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              class="hover:text-white"
              style="color: rgba(99, 235, 255, 0.6)"
              >Create one →</a
            >
          </p>
          <details
            class="text-sm text-gray-400 mb-3 bg-black/20 border border-border rounded-lg px-3 py-2"
          >
            <summary class="cursor-pointer font-medium hover:text-gray-200">
              Step-by-step instructions
            </summary>
            <div
              class="mt-2 mb-2 flex overflow-hidden"
              style="border: 1px solid var(--border); border-radius: 6px; background: rgba(255,255,255,0.02)"
            >
              <button
                onclick=${() => setInstrType("workspace")}
                class=${btnCls("workspace")}
                style=${btnStyle("workspace")}
              >
                Google Workspace
              </button>
              <button
                onclick=${() => setInstrType("personal")}
                class=${btnCls("personal")}
                style=${btnStyle("personal")}
              >
                Personal Gmail
              </button>
            </div>
            ${instrType === "personal"
              ? html`
                  <div style="line-height: 1.7">
                    <ol class="list-decimal list-inside space-y-2.5 ml-1">
                      <li>
                        ${" "}<a
                          href="https://console.cloud.google.com/projectcreate"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Create a Google Cloud project</a
                        >${" "}(or use existing)
                      </li>
                      <li>
                        Go to${" "}<a
                          href="https://console.cloud.google.com/auth/audience"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >OAuth consent screen</a
                        >${" "}→ set to <strong>External</strong>
                      </li>
                      <li>
                        Under${" "}<a
                          href="https://console.cloud.google.com/auth/audience"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Test users</a
                        >, <strong>add your own email</strong>
                      </li>
                      <li>
                        ${" "}<a
                          href="https://console.cloud.google.com/apis/library"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Enable APIs</a
                        >${" "}for the services you selected below
                      </li>
                      <li>
                        Go to${" "}<a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Credentials</a
                        >${" "}→ Create OAuth 2.0 Client ID (Web application)
                      </li>
                      <li>
                        Add redirect URI:${renderRedirectUriInstruction()}
                      </li>
                      <li>
                        Copy Client ID + Secret (or download credentials JSON)
                      </li>
                    </ol>
                    <p class="mt-3 text-yellow-500/80">
                      ⚠️ App will be in "Testing" mode. Only emails added as
                      Test Users can sign in (up to 100).
                    </p>
                  </div>
                `
              : html`
                  <div style="line-height: 1.7">
                    <ol class="list-decimal list-inside space-y-2.5 ml-1">
                      <li>
                        ${" "}<a
                          href="https://console.cloud.google.com/projectcreate"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Create a Google Cloud project</a
                        >${" "}(or use existing)
                      </li>
                      <li>
                        Go to${" "}<a
                          href="https://console.cloud.google.com/auth/audience"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >OAuth consent screen</a
                        >${" "}→ set to <strong>Internal</strong> (Workspace
                        only)
                      </li>
                      <li>
                        ${" "}<a
                          href="https://console.cloud.google.com/apis/library"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Enable APIs</a
                        >${" "}for the services you selected below
                      </li>
                      <li>
                        Go to${" "}<a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          class="hover:text-white"
                          style="color: rgba(99, 235, 255, 0.6)"
                          >Credentials</a
                        >${" "}→ Create OAuth 2.0 Client ID (Web application)
                      </li>
                      <li>
                        Add redirect URI:${renderRedirectUriInstruction()}
                      </li>
                      <li>
                        Copy Client ID + Secret (or download credentials JSON)
                      </li>
                    </ol>
                    <p class="mt-3 text-green-500/80">
                      ✓ Internal apps skip test users and verification. Only
                      users in your Workspace org can authorize this Google app.
                    </p>
                  </div>
                `}
          </details>
        </div>
        <div
          class="bg-black/20 border border-border rounded-lg p-3 space-y-3 mt-2"
        >
          <div class="flex flex-col items-center text-center gap-2 py-2">
            <label class="text-sm text-gray-300 font-medium"
              >Upload credentials.json</label
            >
            <input
              type="file"
              ref=${fileRef}
              accept=".json"
              onchange=${handleFile}
              class="hidden"
            />
            <button
              type="button"
              onclick=${() => fileRef.current?.click()}
              class="text-sm px-3 py-1.5 rounded-lg border border-border text-gray-300 hover:border-gray-500"
            >
              Choose file
            </button>
          </div>
          <div class="flex items-center gap-3 py-1">
            <div class="h-px flex-1 bg-border"></div>
            <span class="text-gray-500 text-xs">or enter manually</span>
            <div class="h-px flex-1 bg-border"></div>
          </div>
          <div>
            <label class="text-sm text-gray-400 block mb-1">Client ID</label>
            <${SecretInput}
              value=${clientId}
              onInput=${(e) => setClientId(e.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
              inputClass="flex-1 bg-black/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label class="text-sm text-gray-400 block mb-1"
              >Client Secret</label
            >
            <${SecretInput}
              value=${clientSecret}
              onInput=${(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-..."
              inputClass="flex-1 bg-black/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label class="text-sm text-gray-400 block mb-1"
              >Email (Google account to authorize)</label
            >
            <input
              type="email"
              value=${email}
              onInput=${(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              class="w-full bg-black/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <${ActionButton}
          onClick=${submit}
          disabled=${saving}
          loading=${saving}
          tone="primary"
          size="lg"
          idleLabel=${submitLabel}
          loadingLabel="Saving..."
          className="w-full px-4 py-2 rounded-lg text-sm"
        />
      </div>
      ${error ? html`<div class="text-red-400 text-xs">${error}</div>` : null}
  </${ModalShell}>`;
};
