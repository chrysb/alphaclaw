import { h } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import htm from "htm";
import { Badge } from "../badge.js";
import { SecretInput } from "../secret-input.js";
import { ActionButton } from "../action-button.js";
import { exchangeCodexOAuth, disconnectCodex } from "../../lib/api.js";
import {
  isCodexAuthCallbackMessage,
  openCodexAuthWindow,
} from "../../lib/codex-oauth-window.js";
import { showToast } from "../toast.js";
import {
  kProviderAuthFields,
  kProviderLabels,
} from "../../lib/model-config.js";

const html = htm.bind(h);

const kProviderMeta = {
  anthropic: {
    label: "Anthropic",
    modes: [
      {
        id: "api_key",
        label: "API Key",
        profileSuffix: "default",
        placeholder: "sk-ant-api03-...",
        url: "https://console.anthropic.com",
        field: "key",
      },
      {
        id: "token",
        label: "Setup Token",
        profileSuffix: "manual",
        placeholder: "sk-ant-oat01-...",
        hint: "From claude setup-token (uses your Claude subscription)",
        field: "token",
      },
    ],
  },
  openai: {
    label: "OpenAI",
    modes: [
      {
        id: "api_key",
        label: "API Key",
        profileSuffix: "default",
        placeholder: "sk-...",
        url: "https://platform.openai.com",
        field: "key",
      },
    ],
  },
  "openai-codex": {
    label: "OpenAI Codex",
    modes: [{ id: "oauth", label: "Codex OAuth", isCodexOauth: true }],
  },
  google: {
    label: "Gemini",
    modes: [
      {
        id: "api_key",
        label: "API Key",
        profileSuffix: "default",
        placeholder: "AI...",
        url: "https://aistudio.google.com",
        field: "key",
      },
    ],
  },
};

const kDefaultMode = {
  id: "api_key",
  label: "API Key",
  profileSuffix: "default",
  placeholder: "...",
  field: "key",
};

const buildDefaultProviderModes = (provider) => {
  const fields = kProviderAuthFields[provider] || [];
  if (fields.length === 0) return [kDefaultMode];
  return fields.map((fieldDef) => ({
    id: "api_key",
    label: fieldDef.label || "API Key",
    profileSuffix: "default",
    placeholder: fieldDef.placeholder || "...",
    hint: fieldDef.hint,
    url: fieldDef.url,
    field: "key",
  }));
};

const getProviderMeta = (provider) =>
  kProviderMeta[provider] || {
    label: kProviderLabels[provider] || provider,
    modes: buildDefaultProviderModes(provider),
  };

const resolveProfileId = (mode, provider) => {
  const p = mode.provider || provider;
  return `${p}:${mode.profileSuffix || "default"}`;
};

const getCredentialValue = (value) =>
  String(value?.key || value?.token || value?.access || "").trim();

const CodexOAuthSection = ({ codexStatus, onRefreshCodex }) => {
  const [authStarted, setAuthStarted] = useState(false);
  const [authWaiting, setAuthWaiting] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [exchanging, setExchanging] = useState(false);
  const exchangeInFlightRef = useRef(false);
  const popupPollRef = useRef(null);

  useEffect(
    () => () => {
      if (popupPollRef.current) clearInterval(popupPollRef.current);
    },
    [],
  );

  const submitAuthInput = async (input) => {
    const normalizedInput = String(input || "").trim();
    if (!normalizedInput || exchangeInFlightRef.current) return;
    exchangeInFlightRef.current = true;
    setManualInput(normalizedInput);
    setExchanging(true);
    try {
      const result = await exchangeCodexOAuth(normalizedInput);
      if (!result.ok)
        throw new Error(result.error || "Codex OAuth exchange failed");
      setManualInput("");
      showToast("Codex connected", "success");
      setAuthStarted(false);
      setAuthWaiting(false);
      await onRefreshCodex();
    } catch (err) {
      setAuthWaiting(false);
      showToast(err.message || "Codex OAuth exchange failed", "error");
    } finally {
      exchangeInFlightRef.current = false;
      setExchanging(false);
    }
  };

  useEffect(() => {
    const onMessage = async (e) => {
      if (e.data?.codex === "success") {
        showToast("Codex connected", "success");
        setAuthStarted(false);
        setAuthWaiting(false);
        await onRefreshCodex();
      } else if (isCodexAuthCallbackMessage(e.data)) {
        await submitAuthInput(e.data.input);
      } else if (e.data?.codex === "error") {
        showToast(
          `Codex auth failed: ${e.data.message || "unknown error"}`,
          "error",
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onRefreshCodex, submitAuthInput]);

  const startAuth = () => {
    setAuthStarted(true);
    setAuthWaiting(true);
    const popup = openCodexAuthWindow();
    if (!popup || popup.closed) {
      setAuthWaiting(false);
      return;
    }
    if (popupPollRef.current) clearInterval(popupPollRef.current);
    popupPollRef.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupPollRef.current);
        popupPollRef.current = null;
        setAuthWaiting(false);
      }
    }, 500);
  };

  const completeAuth = async () => {
    await submitAuthInput(manualInput);
  };

  const handleDisconnect = async () => {
    const result = await disconnectCodex();
    if (!result.ok) {
      showToast(result.error || "Failed to disconnect Codex", "error");
      return;
    }
    showToast("Codex disconnected", "success");
    setAuthStarted(false);
    setAuthWaiting(false);
    setManualInput("");
    await onRefreshCodex();
  };

  return html`
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs text-fg-muted">Codex OAuth</span>
        ${codexStatus.connected
          ? html`<${Badge} tone="success">Connected</${Badge}>`
          : html`<${Badge} tone="warning">Not connected</${Badge}>`}
      </div>
      ${authStarted
        ? html`
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-fg-muted">
                ${authWaiting
                  ? "Complete login in the popup. AlphaClaw should finish automatically, but you can paste the redirect URL below if it doesn't."
                  : "Paste the redirect URL from your browser to finish connecting."}
              </p>
              <button
                onclick=${startAuth}
                class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary shrink-0"
              >
                Restart
              </button>
            </div>
          `
        : codexStatus.connected
        ? html`
            <div class="flex gap-2">
              <button
                onclick=${startAuth}
                class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary"
              >
                Reconnect
              </button>
              <button
                onclick=${handleDisconnect}
                class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-ghost"
              >
                Disconnect
              </button>
            </div>
          `
        : html`
            <button
              onclick=${startAuth}
              class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-cyan"
            >
              Connect Codex OAuth
            </button>
          `}
      ${authStarted
          ? html`
            <p class="text-xs text-fg-muted">
              After login, copy the full redirect URL (starts with
              <code class="text-xs bg-field px-1 rounded"
                >http://localhost:1455/auth/callback</code
              >) and paste it here.
            </p>
            <input
              type="text"
              value=${manualInput}
              onInput=${(e) => setManualInput(e.target.value)}
              placeholder="http://localhost:1455/auth/callback?code=...&state=..."
              class="w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body outline-none focus:border-fg-muted"
            />
            <${ActionButton}
              onClick=${completeAuth}
              disabled=${!manualInput.trim() || exchanging}
              loading=${exchanging}
              tone="primary"
              size="sm"
              idleLabel="Complete Codex OAuth"
              loadingLabel="Completing..."
              className="text-xs font-medium px-3 py-1.5"
            />
          `
        : null}
    </div>
  `;
};

export const ProviderAuthCard = ({
  provider,
  authProfiles,
  authOrder,
  codexStatus,
  onEditProfile,
  onEditAuthOrder,
  getProfileValue,
  getEffectiveOrder,
  onRefreshCodex,
}) => {
  const meta = getProviderMeta(provider);
  const credentialModes = meta.modes.filter((m) => !m.isCodexOauth);
  const hasMultipleModes = credentialModes.length > 1;
  const showsInlineOauthStatus = meta.modes.some((m) => m.isCodexOauth);

  const effectiveOrder = getEffectiveOrder(provider);
  const activeProfileId = effectiveOrder?.[0] || null;
  const savedOrder = authOrder[provider] || null;

  const hasUnsavedProfileChanges = credentialModes.some((mode) => {
    const profileId = resolveProfileId(mode, provider);
    const savedValue = authProfiles.find((p) => p.id === profileId) || null;
    const draftValue = getProfileValue(profileId);
    return getCredentialValue(draftValue) !== getCredentialValue(savedValue);
  });

  const hasUnsavedOrderChanges =
    JSON.stringify(effectiveOrder || null) !== JSON.stringify(savedOrder);
  const hasUnsavedChanges = hasUnsavedProfileChanges || hasUnsavedOrderChanges;

  const isConnected =
    credentialModes.some((mode) => {
      const profileId = resolveProfileId(mode, provider);
      const val = getProfileValue(profileId);
      return !!(val?.key || val?.token || val?.access);
    }) || (provider === "openai-codex" && !!codexStatus?.connected);

  const handleSetActive = (mode) => {
    const profileId = resolveProfileId(mode, provider);
    const allIds = credentialModes.map((m) => resolveProfileId(m, provider));
    const ordered = [profileId, ...allIds.filter((id) => id !== profileId)];
    onEditAuthOrder(provider, ordered);
  };

  return html`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="card-label">${meta.label}</h3>
        ${showsInlineOauthStatus && credentialModes.length === 0
          ? null
          : hasUnsavedChanges
            ? html`<${Badge} tone="warning">Unsaved</${Badge}>`
            : isConnected
            ? html`<${Badge} tone="success">Connected</${Badge}>`
            : html`<${Badge} tone="warning">Not configured</${Badge}>`}
      </div>
      ${credentialModes.map((mode) => {
        const profileId = resolveProfileId(mode, provider);
        const profileProvider = mode.provider || provider;
        const currentValue = getProfileValue(profileId);
        const fieldValue = currentValue?.[mode.field] || "";
        const isActive =
          !hasMultipleModes ||
          activeProfileId === profileId ||
          (!activeProfileId && mode === credentialModes[0]);

        return html`
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-fg-muted"
                >${mode.label}</label
              >
              ${hasMultipleModes && isActive
                ? html`<${Badge} tone="cyan">Primary</${Badge}>`
                : null}
              ${hasMultipleModes && !isActive && fieldValue
                ? html`<button
                    onclick=${() => handleSetActive(mode)}
                    class="text-xs px-1.5 py-0.5 rounded-full text-fg-muted hover:text-body hover:bg-surface"
                  >
                    Set primary
                  </button>`
                : null}
              ${mode.url && !fieldValue
                ? html`<a
                    href=${mode.url}
                    target="_blank"
                    class="text-xs hover:underline"
                    style="color: var(--accent-link)"
                    >Get</a
                  >`
                : null}
            </div>
            <${SecretInput}
              value=${fieldValue}
              onInput=${(e) => {
                const newVal = e.target.value;
                const cred = {
                  type: mode.id,
                  provider: profileProvider,
                  [mode.field]: newVal,
                };
                if (currentValue?.expires) cred.expires = currentValue.expires;
                onEditProfile(profileId, cred);
                const savedProfile =
                  authProfiles.find((p) => p.id === profileId) || null;
                const isReverted =
                  getCredentialValue(cred) ===
                  getCredentialValue(savedProfile);
                if (isReverted && hasMultipleModes) {
                  onEditAuthOrder(provider, savedOrder);
                } else if (hasMultipleModes && newVal && !isActive) {
                  handleSetActive(mode);
                }
              }}
              placeholder=${mode.placeholder || ""}
              isSecret=${true}
              inputClass="flex-1 w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted font-mono"
            />
            ${mode.hint
              ? html`<p class="text-xs text-fg-dim">${mode.hint}</p>`
              : null}
          </div>
        `;
      })}
      ${meta.modes.some((m) => m.isCodexOauth)
        ? html`
            <div class="border border-border rounded-lg p-3">
              <${CodexOAuthSection}
                codexStatus=${codexStatus}
                onRefreshCodex=${onRefreshCodex}
              />
            </div>
          `
        : null}
    </div>
  `;
};
