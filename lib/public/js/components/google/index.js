import { h } from "https://esm.sh/preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  checkGoogleApis,
  disconnectGoogle,
  fetchGoogleCredentials,
  saveGoogleAccount,
} from "../../lib/api.js";
import { getDefaultScopes, toggleScopeLogic } from "../scope-picker.js";
import { CredentialsModal } from "../credentials-modal.js";
import { ConfirmDialog } from "../confirm-dialog.js";
import { showToast } from "../toast.js";
import { ActionButton } from "../action-button.js";
import { OverflowMenu, OverflowMenuItem } from "../overflow-menu.js";
import { GoogleAccountRow } from "./account-row.js";
import { AddGoogleAccountModal } from "./add-account-modal.js";
import { useGoogleAccounts } from "./use-google-accounts.js";
import { useGmailWatch } from "./use-gmail-watch.js";
import { GmailSetupWizard } from "./gmail-setup-wizard.js";

const html = htm.bind(h);

const hasScopesChanged = (nextScopes = [], savedScopes = []) =>
  nextScopes.length !== savedScopes.length ||
  nextScopes.some((scope) => !savedScopes.includes(scope));

const isPersonalAccount = (account = {}) => Boolean(account.personal);

const kGoogleIconPath = "/assets/icons/google_icon.svg";

export const Google = ({
  gatewayStatus,
  onRestartRequired = () => {},
  onOpenGmailWebhook = () => {},
}) => {
  const { accounts, loading, hasCompanyCredentials, refreshAccounts } =
    useGoogleAccounts({ gatewayStatus });
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
  const [gmailWizardState, setGmailWizardState] = useState({
    visible: false,
    accountId: "",
  });
  const {
    loading: gmailLoading,
    watchByAccountId,
    clientConfigByClient,
    busyByAccountId,
    savingClient,
    refresh: refreshGmailWatch,
    saveClientSetup,
    startWatchForAccount,
    stopWatchForAccount,
  } = useGmailWatch({ gatewayStatus, accounts });

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
    const nextScopes =
      Array.isArray(account.activeScopes) && account.activeScopes.length
        ? account.activeScopes
        : Array.isArray(account.services) && account.services.length
          ? account.services
          : getDefaultScopes();
    setSavedScopesByAccountId((prev) => ({
      ...prev,
      [account.id]: [...nextScopes],
    }));
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
    const firstAwaitingSignInId =
      accounts.find((account) => !account.authenticated)?.id || "";
    setExpandedAccountId((previousId) => {
      if (previousId && accounts.some((account) => account.id === previousId)) {
        return previousId;
      }
      return firstAwaitingSignInId;
    });
    accounts.forEach((account) => ensureScopesForAccount(account));
  }, [accounts, ensureScopesForAccount]);

  const startAuth = useCallback(
    (accountId) => {
      const account = getAccountById(accountId);
      if (!account) return;
      const scopes =
        scopesByAccountId[accountId] ||
        account.activeScopes ||
        getDefaultScopes();
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
    setApiStatusByAccountId((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
    setCheckingByAccountId({ [accountId]: true });
    try {
      const data = await checkGoogleApis(accountId);
      if (data.results) {
        setApiStatusByAccountId((prev) => ({
          ...prev,
          [accountId]: data.results,
        }));
      }
    } finally {
      setCheckingByAccountId((prev) => {
        if (!prev[accountId]) return prev;
        const next = { ...prev };
        delete next[accountId];
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const handler = async (event) => {
      if (event.data?.google === "success") {
        showToast("✓ Google account connected", "success");
        const accountId = String(event.data?.accountId || "").trim();
        setApiStatusByAccountId({});
        await refreshAccounts();
        await refreshGmailWatch();
        if (accountId) {
          await handleCheckApis(accountId);
        }
      } else if (event.data?.google === "error") {
        showToast(
          `✗ Google auth failed: ${event.data.message || "unknown"}`,
          "error",
        );
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handleCheckApis, refreshAccounts, refreshGmailWatch]);

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
    await refreshGmailWatch();
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
    if (account?.id) {
      setExpandedAccountId(account.id);
    }
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
      if (data.accountId) {
        setExpandedAccountId(data.accountId);
      }
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

  const handleEditCredentials = async (accountId) => {
    const account = getAccountById(accountId);
    if (!account) return;
    const personal = isPersonalAccount(account);
    const client = personal ? "personal" : account.client || "default";
    let credentialValues = {};
    try {
      const credentialResponse = await fetchGoogleCredentials({
        accountId: account.id,
        client,
      });
      if (credentialResponse?.ok) {
        credentialValues = {
          clientId: String(credentialResponse.clientId || ""),
          clientSecret: String(credentialResponse.clientSecret || ""),
        };
      }
    } catch {
      showToast("Could not load saved client credentials", "warning");
    }
    openCredentialsModal({
      accountId: account.id,
      client,
      personal,
      title: `Edit Credentials (${account.email})`,
      submitLabel: "Save Credentials",
      defaultInstrType: personal ? "personal" : "workspace",
      initialValues: {
        email: account.email,
        ...credentialValues,
      },
    });
  };

  const openGmailSetupWizard = (accountId) => {
    setGmailWizardState({
      visible: true,
      accountId: String(accountId || ""),
    });
  };

  const closeGmailSetupWizard = () => {
    setGmailWizardState({
      visible: false,
      accountId: "",
    });
  };

  const handleEnableGmailWatch = async (accountId) => {
    const account = getAccountById(accountId);
    if (!account) return;
    const client = String(account.client || "default").trim() || "default";
    const clientConfig = clientConfigByClient.get(client);
    if (!clientConfig?.configured || !clientConfig?.webhookExists) {
      openGmailSetupWizard(accountId);
      return;
    }
    try {
      const result = await startWatchForAccount(accountId);
      if (result?.restartRequired) {
        onRestartRequired(true);
      }
      showToast("Gmail watch enabled", "success");
    } catch (err) {
      showToast(err.message || "Could not enable Gmail watch", "error");
    }
  };

  const handleDisableGmailWatch = async (accountId) => {
    try {
      await stopWatchForAccount(accountId);
      showToast("Gmail watch disabled", "info");
    } catch (err) {
      showToast(err.message || "Could not disable Gmail watch", "error");
    }
  };

  const handleFinishGmailSetupWizard = async ({
    client,
    projectId,
    destination = null,
  }) => {
    const accountId = String(gmailWizardState.accountId || "").trim();
    if (!accountId) return;
    await saveClientSetup({
      client,
      projectId,
      regeneratePushToken: false,
    });
    await startWatchForAccount(accountId, { destination });
    showToast("Gmail setup complete and watch enabled", "success");
  };

  const renderEmptyState = () => html`
    <div class="text-center space-y-2 pt-3">
      <div class="rounded-lg border border-border bg-black/20 px-3 py-5">
        <div class="flex flex-col items-center justify-center gap-3">
          <img
            src=${kGoogleIconPath}
            alt="Google logo"
            class="h-5 w-5 shrink-0"
            loading="lazy"
            decoding="async"
          />
          <p class="text-xs text-gray-500">
            Connect Gmail, Calendar, Contacts, Drive, Sheets, Tasks, Docs, and
            Meet.
          </p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        <${ActionButton}
          onClick=${handleAddCompanyClick}
          tone="primary"
          size="sm"
          idleLabel="Add Company Account"
          className="w-full font-medium"
        />
        <${ActionButton}
          onClick=${handleAddPersonalClick}
          tone="secondary"
          size="sm"
          idleLabel="Add Personal Account"
          className="w-full font-medium"
        />
      </div>
    </div>
  `;

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="card-label">Google Accounts</h2>
        ${accounts.length
          ? html`
              <div class="relative">
                <${OverflowMenu}
                  open=${addMenuOpen}
                  ariaLabel="Add Google account"
                  title="Add Google account"
                  onClose=${() => setAddMenuOpen(false)}
                  onToggle=${() => setAddMenuOpen((prev) => !prev)}
                  renderTrigger=${({ onToggle, ariaLabel, title }) => html`
                    <${ActionButton}
                      onClick=${onToggle}
                      tone="subtle"
                      size="sm"
                      idleLabel="+ Add Account"
                      ariaLabel=${ariaLabel}
                      title=${title}
                    />
                  `}
                >
                  <${OverflowMenuItem} onClick=${handleAddCompanyClick}>
                    Company account
                  </${OverflowMenuItem}>
                  ${!hasPersonalAccount
                    ? html`
                        <${OverflowMenuItem} onClick=${handleAddPersonalClick}>
                          Personal account
                        </${OverflowMenuItem}>
                      `
                    : null}
                </${OverflowMenu}>
              </div>
            `
          : null}
      </div>
      ${loading
        ? html`<div class="text-gray-500 text-sm text-center py-2">
            Loading...
          </div>`
        : accounts.length
          ? html`
              <div class="space-y-2 mt-3">
                ${accounts.map(
                  (account) =>
                    html`<${GoogleAccountRow}
                      key=${account.id}
                      account=${account}
                      personal=${isPersonalAccount(account)}
                      expanded=${expandedAccountId === account.id}
                      onToggleExpanded=${(accountId) =>
                        setExpandedAccountId((prev) =>
                          prev === accountId ? "" : accountId,
                        )}
                      scopes=${scopesByAccountId[account.id] ||
                      account.activeScopes ||
                      getDefaultScopes()}
                      savedScopes=${savedScopesByAccountId[account.id] ||
                      account.activeScopes ||
                      getDefaultScopes()}
                      apiStatus=${apiStatusByAccountId[account.id] || {}}
                      checkingApis=${expandedAccountId === account.id &&
                      Boolean(checkingByAccountId[account.id])}
                      onToggleScope=${handleToggleScope}
                      onCheckApis=${handleCheckApis}
                      onUpdatePermissions=${(accountId) => startAuth(accountId)}
                      onEditCredentials=${handleEditCredentials}
                      onDisconnect=${(accountId) =>
                        setDisconnectAccountId(accountId)}
                      gmailWatchStatus=${watchByAccountId.get(account.id) ||
                      null}
                      gmailWatchBusy=${Boolean(busyByAccountId[account.id])}
                      onEnableGmailWatch=${handleEnableGmailWatch}
                      onDisableGmailWatch=${handleDisableGmailWatch}
                      onOpenGmailSetup=${openGmailSetupWizard}
                      onOpenGmailWebhook=${onOpenGmailWebhook}
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

    <${GmailSetupWizard}
      visible=${gmailWizardState.visible}
      account=${getAccountById(gmailWizardState.accountId)}
      clientConfig=${clientConfigByClient.get(
        String(
          getAccountById(gmailWizardState.accountId)?.client || "default",
        ).trim() || "default",
      ) || null}
      saving=${savingClient || gmailLoading}
      onClose=${closeGmailSetupWizard}
      onSaveSetup=${saveClientSetup}
      onFinish=${handleFinishGmailSetupWizard}
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
