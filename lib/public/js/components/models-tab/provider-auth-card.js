import { h } from "https://esm.sh/preact";
import { useState, useRef, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { Badge } from "../badge.js";
import { SecretInput } from "../secret-input.js";
import { ActionButton } from "../action-button.js";
import { exchangeCodexOAuth, disconnectCodex } from "../../lib/api.js";
import { showToast } from "../toast.js";

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

const getProviderMeta = (provider) =>
  kProviderMeta[provider] || {
    label: provider,
    modes: [kDefaultMode],
  };

const resolveProfileId = (mode, provider) => {
  const p = mode.provider || provider;
  return `${p}:${mode.profileSuffix || "default"}`;
};

const CodexOAuthSection = ({ codexStatus, onRefreshCodex }) => {
  const [authStarted, setAuthStarted] = useState(false);
  const [authWaiting, setAuthWaiting] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [exchanging, setExchanging] = useState(false);
  const popupPollRef = useRef(null);

  useEffect(
    () => () => {
      if (popupPollRef.current) clearInterval(popupPollRef.current);
    },
    [],
  );

  useEffect(() => {
    const onMessage = async (e) => {
      if (e.data?.codex === "success") {
        showToast("Codex connected", "success");
        setAuthStarted(false);
        setAuthWaiting(false);
        await onRefreshCodex();
      } else if (e.data?.codex === "error") {
        showToast(
          `Codex auth failed: ${e.data.message || "unknown error"}`,
          "error",
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onRefreshCodex]);

  const startAuth = () => {
    setAuthStarted(true);
    setAuthWaiting(true);
    const popup = window.open(
      "/auth/codex/start",
      "codex-auth",
      "popup=yes,width=640,height=780",
    );
    if (!popup || popup.closed) {
      setAuthWaiting(false);
      window.location.href = "/auth/codex/start";
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
    if (!manualInput.trim() || exchanging) return;
    setExchanging(true);
    try {
      const result = await exchangeCodexOAuth(manualInput.trim());
      if (!result.ok)
        throw new Error(result.error || "Codex OAuth exchange failed");
      setManualInput("");
      showToast("Codex connected", "success");
      setAuthStarted(false);
      setAuthWaiting(false);
      await onRefreshCodex();
    } catch (err) {
      showToast(err.message || "Codex OAuth exchange failed", "error");
    } finally {
      setExchanging(false);
    }
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
        <span class="text-xs text-gray-400">Codex OAuth</span>
        ${codexStatus.connected
          ? html`<${Badge} tone="success">Connected</${Badge}>`
          : html`<${Badge} tone="warning">Not connected</${Badge}>`}
      </div>
      ${codexStatus.connected
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
        : !authStarted
          ? html`
              <button
                onclick=${startAuth}
                class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-cyan"
              >
                Connect Codex OAuth
              </button>
            `
          : html`
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs text-gray-500">
                  ${authWaiting
                    ? "Complete login in the popup, then paste the redirect URL."
                    : "Paste the redirect URL from your browser to finish connecting."}
                </p>
                <button
                  onclick=${startAuth}
                  class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary shrink-0"
                >
                  Restart
                </button>
              </div>
            `}
      ${!codexStatus.connected && authStarted
        ? html`
            <p class="text-xs text-gray-500">
              After login, copy the full redirect URL (starts with
              <code class="text-xs bg-black/30 px-1 rounded"
                >http://localhost:1455/auth/callback</code
              >) and paste it here.
            </p>
            <input
              type="text"
              value=${manualInput}
              onInput=${(e) => setManualInput(e.target.value)}
              placeholder="http://localhost:1455/auth/callback?code=...&state=..."
              class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-gray-500"
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
        <h3 class="font-semibold text-sm">${meta.label}</h3>
        ${showsInlineOauthStatus && credentialModes.length === 0
          ? null
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
              <label class="text-xs font-medium text-gray-400"
                >${mode.label}</label
              >
              ${hasMultipleModes && isActive
                ? html`<${Badge} tone="cyan">Primary</${Badge}>`
                : null}
              ${hasMultipleModes && !isActive && fieldValue
                ? html`<button
                    onclick=${() => handleSetActive(mode)}
                    class="text-xs px-1.5 py-0.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-white/5"
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
                if (hasMultipleModes && newVal && !isActive) {
                  handleSetActive(mode);
                }
              }}
              placeholder=${mode.placeholder || ""}
              isSecret=${true}
              inputClass="flex-1 w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
            />
            ${mode.hint
              ? html`<p class="text-xs text-gray-600">${mode.hint}</p>`
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
