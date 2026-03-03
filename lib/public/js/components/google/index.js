import { h } from "https://esm.sh/preact";
import { useCallback, useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  checkGoogleApis,
  disconnectGoogle,
  saveGoogleAccount,
} from "../../lib/api.js";
import { getDefaultScopes, toggleScopeLogic } from "../scope-picker.js";
import { CredentialsModal } from "../credentials-modal.js";
import { ConfirmDialog } from "../confirm-dialog.js";
import { showToast } from "../toast.js";
import { PageHeader } from "../page-header.js";
import { GoogleAccountRow } from "./account-row.js";
import { AddGoogleAccountModal } from "./add-account-modal.js";
import { useGoogleAccounts } from "./use-google-accounts.js";

const html = htm.bind(h);

const hasScopesChanged = (nextScopes = [], savedScopes = []) =>
  nextScopes.length !== savedScopes.length ||
  nextScopes.some((scope) => !savedScopes.includes(scope));

const isLikelyPersonalEmail = (email = "") => {
  const normalized = String(email || "").trim().toLowerCase();
  return normalized.endsWith("@gmail.com") || normalized.endsWith("@googlemail.com");
};

const isPersonalAccount = (account = {}) =>
  Boolean(account.personal) || isLikelyPersonalEmail(account.email);

export const Google = ({ gatewayStatus }) => {
  const {
    accounts,
    loading,
    hasCompanyCredentials,
    refreshAccounts,
  } = useGoogleAccounts({ gatewayStatus });
  const [expandedAccountId, setExpandedAccountId] = useState("");
  const [scopesByAccountId, setScopesByAccountId] = useState({});
  const [savedScopesByAccountId, setSavedScopesByAccountId] = useState({});
  const [apiStatusByAccountId, setApiStatusByAccountId] = useState({});
  const [checkingByAccountId, setCheckingByAccountId] = useState({});
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [credentialsModalState, setCredentialsModalState] = useState({
    visible: false,
    accountId: "",
    client: "default",
    personal: false,
    title: "Connect Google Workspace",
    submitLabel: "Connect Google",
    defaultInstrType: "workspace",
    initialValues: {},
  });
  const [addCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
  const [savingAddCompany, setSavingAddCompany] = useState(false);
  const [disconnectAccountId, setDisconnectAccountId] = useState("");

  const hasPersonalAccount = useMemo(
    () => accounts.some((account) => isPersonalAccount(account)),
    [accounts],
  );
  const hasCompanyAccount = useMemo(
    () => accounts.some((account) => !isPersonalAccount(account)),
    [accounts],
  );

  const getAccountById = useCallback(
    (accountId) => accounts.find((account) => account.id === accountId) || null,
    [accounts],
  );

  const ensureScopesForAccount = useCallback((account) => {
    const nextScopes = Array.isArray(account.activeScopes) && account.activeScopes.length
      ? account.activeScopes
      : Array.isArray(account.services) && account.services.length
        ? account.services
        : getDefaultScopes();
    setSavedScopesByAccountId((prev) => ({ ...prev, [account.id]: [...nextScopes] }));
    setScopesByAccountId((prev) => {
      const current = prev[account.id];
      if (!current || !hasScopesChanged(current, nextScopes)) {
        return { ...prev, [account.id]: [...nextScopes] };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!accounts.length) {
      setExpandedAccountId("");
      return;
    }
    const firstId = accounts[0]?.id || "";
    setExpandedAccountId((prev) => (prev && accounts.some((item) => item.id === prev) ? prev : firstId));
    accounts.forEach((account) => ensureScopesForAccount(account));
  }, [accounts, ensureScopesForAccount]);

  const startAuth = useCallback(
    (accountId) => {
      const account = getAccountById(accountId);
      if (!account) return;
      const scopes = scopesByAccountId[accountId] || account.activeScopes || getDefaultScopes();
      if (!scopes.length) {
        window.alert("Select at least one service");
        return;
      }
      const authUrl =
        `/auth/google/start?accountId=${encodeURIComponent(accountId)}` +
        `&services=${encodeURIComponent(scopes.join(","))}&_ts=${Date.now()}`;
      const popup = window.open(
        authUrl,
        `google-auth-${accountId}`,
        "popup=yes,width=500,height=700",
      );
      if (!popup || popup.closed) window.location.href = authUrl;
    },
    [getAccountById, scopesByAccountId],
  );

  const handleToggleScope = (accountId, scope) => {
    setScopesByAccountId((prev) => ({
      ...prev,
      [accountId]: toggleScopeLogic(prev[accountId] || [], scope),
    }));
  };

  const handleCheckApis = useCallback(async (accountId) => {
    setCheckingByAccountId((prev) => ({ ...prev, [accountId]: true }));
    try {
      const data = await checkGoogleApis(accountId);
      if (data.results) {
        setApiStatusByAccountId((prev) => ({ ...prev, [accountId]: data.results }));
      }
    } finally {
      setCheckingByAccountId((prev) => ({ ...prev, [accountId]: false }));
    }
  }, []);

  useEffect(() => {
    const handler = async (event) => {
      if (event.data?.google === "success") {
        showToast("✓ Google account connected", "success");
        const accountId = String(event.data?.accountId || "").trim();
        setApiStatusByAccountId({});
        await refreshAccounts();
        if (accountId) {
          await handleCheckApis(accountId);
        }
      } else if (event.data?.google === "error") {
        showToast(`✗ Google auth failed: ${event.data.message || "unknown"}`, "error");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handleCheckApis, refreshAccounts]);

  useEffect(() => {
    if (!expandedAccountId) return;
    const account = getAccountById(expandedAccountId);
    if (!account?.authenticated) return;
    if (checkingByAccountId[expandedAccountId]) return;
    if (apiStatusByAccountId[expandedAccountId]) return;
    handleCheckApis(expandedAccountId);
  }, [
    accounts,
    apiStatusByAccountId,
    checkingByAccountId,
    expandedAccountId,
    getAccountById,
    handleCheckApis,
  ]);

  const handleDisconnect = async (accountId) => {
    const data = await disconnectGoogle(accountId);
    if (!data.ok) {
      showToast(`Failed to disconnect: ${data.error || "unknown"}`, "error");
      return;
    }
    showToast("Google account disconnected", "success");
    setApiStatusByAccountId((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
    await refreshAccounts();
  };

  const openCredentialsModal = ({
    accountId = "",
    client = "default",
    personal = false,
    title = "Connect Google Workspace",
    submitLabel = "Connect Google",
    defaultInstrType = personal ? "personal" : "workspace",
    initialValues = {},
  }) => {
    setCredentialsModalState({
      visible: true,
      accountId,
      client,
      personal,
      title,
      submitLabel,
      defaultInstrType,
      initialValues,
    });
  };

  const closeCredentialsModal = () => {
    setCredentialsModalState((prev) => ({ ...prev, visible: false }));
  };

  const handleCredentialsSaved = async (account) => {
    await refreshAccounts();
    if (account?.id) startAuth(account.id);
  };

  const handleAddCompanyAccount = async ({ email, setError }) => {
    setSavingAddCompany(true);
    try {
      const data = await saveGoogleAccount({
        email,
        client: "default",
        personal: false,
        services: getDefaultScopes(),
      });
      if (!data.ok) {
        setError?.(data.error || "Could not add account");
        return;
      }
      setAddCompanyModalOpen(false);
      await refreshAccounts();
      if (data.accountId) startAuth(data.accountId);
    } finally {
      setSavingAddCompany(false);
    }
  };

  const handleAddCompanyClick = () => {
    setAddMenuOpen(false);
    if (hasCompanyAccount && hasCompanyCredentials) {
      setAddCompanyModalOpen(true);
      return;
    }
    openCredentialsModal({
      client: "default",
      personal: false,
      title: "Add Company Account",
      submitLabel: "Save Credentials",
      defaultInstrType: "workspace",
    });
  };

  const handleAddPersonalClick = () => {
    setAddMenuOpen(false);
    openCredentialsModal({
      client: "personal",
      personal: true,
      title: "Add Personal Account",
      submitLabel: "Save Credentials",
      defaultInstrType: "personal",
    });
  };

  const handleEditCredentials = (accountId) => {
    const account = getAccountById(accountId);
    if (!account) return;
    const personal = isPersonalAccount(account);
    openCredentialsModal({
      accountId: account.id,
      client: personal ? "personal" : (account.client || "default"),
      personal,
      title: `Edit Credentials (${account.email})`,
      submitLabel: "Save Credentials",
      defaultInstrType: personal ? "personal" : "workspace",
      initialValues: {
        email: account.email,
      },
    });
  };

  const renderEmptyState = () => html`
    <div class="text-center space-y-2 py-1">
      <p class="text-xs text-gray-500">
        Connect Gmail, Calendar, Contacts, Drive, Sheets, Tasks, Docs, and Meet.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onclick=${handleAddCompanyClick}
          class="text-sm font-medium px-4 py-2 rounded-lg ac-btn-cyan"
        >
          Add Company Account
        </button>
        <button
          type="button"
          onclick=${handleAddPersonalClick}
          class="text-sm font-medium px-4 py-2 rounded-lg ac-btn-secondary"
        >
          Add Personal Account
        </button>
      </div>
    </div>
  `;

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <${PageHeader}
        title="Google Workspace"
        actions=${html`
          ${accounts.length
            ? html`
                <div class="relative">
                  <button
                    type="button"
                    onclick=${() => setAddMenuOpen((prev) => !prev)}
                    class="text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary"
                  >
                    + Add Account
                  </button>
                  ${addMenuOpen
                    ? html`
                        <div
                          class="absolute right-0 top-full mt-2 min-w-[210px] rounded-lg border border-border bg-modal p-1 z-20"
                        >
                          <button
                            type="button"
                            onclick=${handleAddCompanyClick}
                            class="w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-black/30"
                          >
                            Company account
                          </button>
                          ${!hasPersonalAccount
                            ? html`<button
                                type="button"
                                onclick=${handleAddPersonalClick}
                                class="w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-black/30"
                              >
                                Personal account
                              </button>`
                            : null}
                        </div>
                      `
                    : null}
                </div>
              `
            : null}
        `}
      />
      ${loading
        ? html`<div class="text-gray-500 text-sm text-center py-2">Loading...</div>`
        : accounts.length
          ? html`
              <div class="space-y-2 mt-3">
                ${accounts.map((account) =>
                  html`<${GoogleAccountRow}
                    key=${account.id}
                    account=${account}
                    personal=${isPersonalAccount(account)}
                    expanded=${expandedAccountId === account.id}
                    onToggleExpanded=${(accountId) =>
                      setExpandedAccountId((prev) => (prev === accountId ? "" : accountId))}
                    scopes=${scopesByAccountId[account.id] || account.activeScopes || getDefaultScopes()}
                    savedScopes=${savedScopesByAccountId[account.id] || account.activeScopes || getDefaultScopes()}
                    apiStatus=${apiStatusByAccountId[account.id] || {}}
                    checkingApis=${Boolean(checkingByAccountId[account.id])}
                    onToggleScope=${handleToggleScope}
                    onCheckApis=${handleCheckApis}
                    onUpdatePermissions=${(accountId) => startAuth(accountId)}
                    onEditCredentials=${handleEditCredentials}
                    onDisconnect=${(accountId) => setDisconnectAccountId(accountId)}
                  />`,
                )}
              </div>
            `
          : renderEmptyState()}
    </div>

    <${CredentialsModal}
      visible=${credentialsModalState.visible}
      onClose=${closeCredentialsModal}
      onSaved=${handleCredentialsSaved}
      title=${credentialsModalState.title}
      submitLabel=${credentialsModalState.submitLabel}
      defaultInstrType=${credentialsModalState.defaultInstrType}
      client=${credentialsModalState.client}
      personal=${credentialsModalState.personal}
      accountId=${credentialsModalState.accountId}
      initialValues=${credentialsModalState.initialValues}
    />

    <${AddGoogleAccountModal}
      visible=${addCompanyModalOpen}
      onClose=${() => setAddCompanyModalOpen(false)}
      onSubmit=${handleAddCompanyAccount}
      loading=${savingAddCompany}
      title="Add Company Account"
    />

    <${ConfirmDialog}
      visible=${Boolean(disconnectAccountId)}
      title="Disconnect Google account?"
      message="Your agent will lose access to Gmail, Calendar, and other Google Workspace services until you reconnect."
      confirmLabel="Disconnect"
      cancelLabel="Cancel"
      onCancel=${() => setDisconnectAccountId("")}
      onConfirm=${async () => {
        const accountId = disconnectAccountId;
        setDisconnectAccountId("");
        await handleDisconnect(accountId);
      }}
    />
  `;
};
