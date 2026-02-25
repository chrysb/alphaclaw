import { h } from "https://esm.sh/preact";
import { useState, useEffect, useCallback } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  fetchGoogleStatus,
  checkGoogleApis as checkApis,
  disconnectGoogle as apiDisconnect,
} from "../lib/api.js";
import {
  ScopePicker,
  toggleScopeLogic,
  getDefaultScopes,
} from "./scope-picker.js";
import { CredentialsModal } from "./credentials-modal.js";
import { showToast } from "./toast.js";
const html = htm.bind(h);

export function Google({ gatewayStatus }) {
  const [google, setGoogle] = useState(null);
  const [scopes, setScopes] = useState(getDefaultScopes());
  const [savedScopes, setSavedScopes] = useState(null);
  const [apiStatus, setApiStatus] = useState({});
  const [checkingApis, setCheckingApis] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const runApiCheck = useCallback(async () => {
    setApiStatus({});
    setCheckingApis(true);
    try {
      const check = await checkApis();
      if (check.results) setApiStatus(check.results);
    } finally {
      setCheckingApis(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchGoogleStatus();
      setGoogle(data);
      if (data.activeScopes && data.activeScopes.length > 0) {
        setScopes(data.activeScopes);
        setSavedScopes(data.activeScopes);
      }
      if (data.authenticated) {
        await runApiCheck();
      }
    } catch {}
  }, [runApiCheck]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // First load can race gateway startup; refresh when gateway becomes healthy.
  useEffect(() => {
    if (gatewayStatus === "running") {
      refresh();
    }
  }, [gatewayStatus, refresh]);

  // Listen for OAuth popup postMessage
  useEffect(() => {
    const handler = async (e) => {
      if (e.data?.google === "success") {
        showToast("✓ Google account connected", "green");
        setApiStatus({});
        await refresh();
      } else if (e.data?.google === "error") {
        showToast(
          "✗ Google auth failed: " + (e.data.message || "unknown"),
          "red",
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [refresh]);

  const handleToggle = (scope) => {
    setScopes((prev) => toggleScopeLogic(prev, scope));
  };

  const startAuth = (email) => {
    if (scopes.length === 0) {
      alert("Select at least one service");
      return;
    }
    const authUrl = `/auth/google/start?email=${encodeURIComponent(email)}&services=${scopes.join(",")}&_ts=${Date.now()}`;
    const popup = window.open(
      authUrl,
      "google-auth",
      "popup=yes,width=500,height=700",
    );
    if (!popup || popup.closed) window.location.href = authUrl;
  };

  const handleCheckApis = () => runApiCheck();

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Disconnect Google account? Your agent will lose access to Gmail, Calendar, etc.",
      )
    )
      return;
    const data = await apiDisconnect();
    if (data.ok) {
      setGoogle({
        hasCredentials: false,
        authenticated: false,
        email: "",
        services: "",
        activeScopes: [],
      });
      setApiStatus({});
      setScopes(getDefaultScopes());
      showToast("Google account disconnected", "green");
    } else {
      alert("Failed to disconnect: " + (data.error || "unknown"));
    }
  };

  if (!google) {
    return html` <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="font-semibold mb-3">Google Workspace</h2>
      <div class="text-gray-500 text-sm text-center py-2">Loading...</div>
    </div>`;
  }

  const hasCredentials = google.authenticated || google.hasCredentials;
  const isAuthed = google.authenticated;
  const email = google.email || "";
  const scopesChanged =
    !savedScopes ||
    scopes.length !== savedScopes.length ||
    scopes.some((s) => !savedScopes.includes(s));

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="font-semibold mb-3">Google Workspace</h2>
      ${hasCredentials
        ? html`
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <div class="text-sm font-medium">${email}</div>
                ${isAuthed
                  ? html`<span
                      class="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-500"
                      >Connected</span
                    >`
                  : html`<span
                      class="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-500/10 text-yellow-500"
                      >Awaiting sign-in</span
                    >`}
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-400">Select permissions</span>
                ${isAuthed &&
                html`<button
                  onclick=${handleCheckApis}
                  class="text-xs text-gray-500 hover:text-gray-300"
                >
                  ↻ Check APIs
                </button>`}
              </div>
              <${ScopePicker}
                scopes=${scopes}
                onToggle=${handleToggle}
                apiStatus=${isAuthed ? apiStatus : {}}
                loading=${isAuthed && checkingApis}
              />
              <div class="flex justify-between items-center pt-1">
                <div class="flex items-center gap-2">
                  <button
                    onclick=${() => startAuth(email)}
                    disabled=${isAuthed && !scopesChanged}
                    class="text-sm font-medium px-4 py-2 rounded-lg ${isAuthed &&
                    !scopesChanged
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-white text-black hover:opacity-85"}"
                  >
                    ${isAuthed ? "Update Permissions" : "Sign in with Google"}
                  </button>
                  <button
                    type="button"
                    onclick=${() => setModalOpen(true)}
                    class="text-xs font-medium px-3 py-2 rounded-lg border border-border text-gray-300 hover:border-gray-500"
                  >
                    Edit credentials
                  </button>
                </div>
                <button
                  onclick=${handleDisconnect}
                  class="text-xs text-red-400/60 hover:text-red-400"
                >
                  Disconnect
                </button>
              </div>
            </div>
          `
        : html`
            <div class="text-center space-y-2 py-1">
              <p class="text-xs text-gray-500">
                Connect Gmail, Calendar, Contacts, Drive, Sheets, Tasks, Docs,
                and Meet.
              </p>
              <button
                onclick=${() => setModalOpen(true)}
                class="bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:opacity-85"
              >
                Set up Google
              </button>
            </div>
          `}
    </div>
    <${CredentialsModal}
      visible=${modalOpen}
      onClose=${() => setModalOpen(false)}
      onSaved=${refresh}
    />
  `;
}
