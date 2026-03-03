const {
  kDefaultGoogleClient,
  kDefaultGoogleScopes,
  createGoogleAccountId,
  readGoogleState,
  writeGoogleState,
  listGoogleAccounts,
  getGoogleAccountById,
  getGoogleAccountByEmailAndClient,
  upsertGoogleAccount,
  removeGoogleAccount,
} = require("../google-state");
const { syncBootstrapPromptFiles } = require("../onboarding/workspace");

const quoteShellArg = (value) => `"${String(value || "").replace(/(["\\$`])/g, "\\$1")}"`;

const parseJsonSafe = (raw, fallbackValue) => {
  try {
    return JSON.parse(String(raw || ""));
  } catch {
    return fallbackValue;
  }
};

const uniqueServiceLabels = (scopes) =>
  Array.from(
    new Set(
      (scopes || [])
        .map((scope) => String(scope || "").split(":")[0])
        .filter(Boolean),
    ),
  );

const registerGoogleRoutes = ({
  app,
  fs,
  isGatewayRunning,
  gogCmd,
  getBaseUrl,
  readGoogleCredentials,
  getApiEnableUrl,
  constants,
}) => {
  const {
    GOG_CONFIG_DIR,
    GOG_STATE_PATH,
    API_TEST_COMMANDS,
    BASE_SCOPES,
    SCOPE_MAP,
    REVERSE_SCOPE_MAP,
    kMaxGoogleAccounts,
    gogClientCredentialsPath,
  } = constants;

  const readState = () => readGoogleState({ fs, statePath: GOG_STATE_PATH });
  const saveState = (state) => writeGoogleState({ fs, statePath: GOG_STATE_PATH, state });
  const syncBootstrapTools = (req) => {
    try {
      syncBootstrapPromptFiles({
        fs,
        workspaceDir: constants.WORKSPACE_DIR,
        baseUrl: getBaseUrl(req),
      });
    } catch {}
  };

  const listAuthenticatedAccounts = async (state) => {
    const configuredClients = new Set([kDefaultGoogleClient]);
    listGoogleAccounts(state).forEach((account) => {
      const client = String(account.client || kDefaultGoogleClient).trim() || kDefaultGoogleClient;
      configuredClients.add(client);
    });
    const combined = [];
    for (const client of configuredClients) {
      const command =
        client === kDefaultGoogleClient
          ? "auth list --json --check"
          : `--client ${quoteShellArg(client)} auth list --json --check`;
      const result = await gogCmd(command, { quiet: true });
      if (!result.ok) continue;
      const parsed = parseJsonSafe(result.stdout, { accounts: [] });
      const accounts = Array.isArray(parsed?.accounts) ? parsed.accounts : [];
      accounts.forEach((entry) => {
        combined.push({
          ...entry,
          client: String(entry.client || client || kDefaultGoogleClient).trim() || kDefaultGoogleClient,
        });
      });
    }
    return combined;
  };

  const accountIsAuthenticated = ({ account, authenticatedAccounts }) =>
    authenticatedAccounts.some(
      (entry) =>
        String(entry.email || "").trim().toLowerCase() === String(account.email || "").trim().toLowerCase() &&
        String(entry.client || kDefaultGoogleClient).trim() === String(account.client || kDefaultGoogleClient).trim() &&
        (entry.valid !== false),
    );

  const getSelectedAccount = ({ state, accountId, fallbackToFirst = true }) => {
    if (accountId) {
      return getGoogleAccountById(state, accountId);
    }
    return fallbackToFirst ? listGoogleAccounts(state)[0] || null : null;
  };

  const ensureClientCredentials = ({ client, clientId, clientSecret, req }) => {
    const credentialsPath = gogClientCredentialsPath(client);
    fs.mkdirSync(GOG_CONFIG_DIR, { recursive: true });
    const credentials = {
      web: {
        client_id: clientId,
        client_secret: clientSecret,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        redirect_uris: [`${getBaseUrl(req)}/auth/google/callback`],
      },
    };
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    return credentialsPath;
  };

  app.get("/api/google/accounts", async (req, res) => {
    const state = readState();
    const authenticatedAccounts = await listAuthenticatedAccounts(state);
    const accounts = listGoogleAccounts(state).map((account) => {
      const activeScopes = account.services || [];
      const services = uniqueServiceLabels(activeScopes).join(", ");
      const hasCredentials = fs.existsSync(gogClientCredentialsPath(account.client));
      return {
        ...account,
        services,
        activeScopes,
        hasCredentials,
        authenticated:
          hasCredentials &&
          (Boolean(account.authenticated) || accountIsAuthenticated({ account, authenticatedAccounts })),
      };
    });
    res.json({
      ok: true,
      hasCompanyCredentials: fs.existsSync(gogClientCredentialsPath(kDefaultGoogleClient)),
      hasPersonalCredentials: fs.existsSync(gogClientCredentialsPath("personal")),
      accounts,
    });
  });

  app.get("/api/google/status", async (req, res) => {
    if (!(await isGatewayRunning())) {
      return res.json({
        hasCredentials: false,
        authenticated: false,
        email: "",
        services: "",
        activeScopes: [],
      });
    }
    const state = readState();
    const selected = getSelectedAccount({
      state,
      accountId: String(req.query.accountId || ""),
      fallbackToFirst: true,
    });
    if (!selected) {
      return res.json({
        hasCredentials: false,
        authenticated: false,
        email: "",
        services: "",
        activeScopes: [],
      });
    }
    const authenticatedAccounts = await listAuthenticatedAccounts(state);
    const activeScopes = selected.services || [];
    const services = uniqueServiceLabels(activeScopes).join(", ");
    const hasCredentials = fs.existsSync(gogClientCredentialsPath(selected.client));
    res.json({
      accountId: selected.id,
      client: selected.client,
      personal: selected.personal,
      hasCredentials,
      authenticated:
        hasCredentials &&
        (Boolean(selected.authenticated) ||
          accountIsAuthenticated({ account: selected, authenticatedAccounts })),
      email: selected.email,
      services,
      activeScopes,
    });
  });

  app.post("/api/google/credentials", async (req, res) => {
    const body = req.body || {};
    const clientId = String(body.clientId || "").trim();
    const clientSecret = String(body.clientSecret || "").trim();
    const email = String(body.email || "").trim();
    const accountId = String(body.accountId || "").trim();
    const personal = Boolean(body.personal);
    const client = String(body.client || (personal ? "personal" : kDefaultGoogleClient)).trim()
      || kDefaultGoogleClient;
    if (!clientId || !clientSecret || !email) {
      return res.json({ ok: false, error: "Missing fields" });
    }

    try {
      const credentialsPath = ensureClientCredentials({
        client,
        clientId,
        clientSecret,
        req,
      });
      const command = client === kDefaultGoogleClient
        ? `auth credentials set ${quoteShellArg(credentialsPath)}`
        : `--client ${quoteShellArg(client)} auth credentials set ${quoteShellArg(credentialsPath)}`;
      const result = await gogCmd(command, { quiet: true });
      if (!result.ok) {
        throw new Error(result.stderr || "Failed to set Google client credentials");
      }

      const state = readState();
      const existing = accountId ? getGoogleAccountById(state, accountId) : null;
      const { state: nextState, account } = upsertGoogleAccount({
        state,
        maxAccounts: kMaxGoogleAccounts,
        account: {
          id: existing?.id || accountId || createGoogleAccountId(),
          email,
          personal,
          client,
          services: body.services || existing?.services || kDefaultGoogleScopes,
          authenticated: Boolean(existing?.authenticated),
        },
      });
      saveState(nextState);
      syncBootstrapTools(req);

      res.json({ ok: true, accountId: account.id, account });
    } catch (err) {
      console.error("[alphaclaw] Failed to save Google credentials:", err);
      res.json({ ok: false, error: err.message });
    }
  });

  app.post("/api/google/accounts", (req, res) => {
    const body = req.body || {};
    const email = String(body.email || "").trim();
    const accountId = String(body.accountId || "").trim();
    const personal = Boolean(body.personal);
    const client = String(body.client || (personal ? "personal" : kDefaultGoogleClient)).trim()
      || kDefaultGoogleClient;
    if (!email) {
      return res.json({ ok: false, error: "Missing fields" });
    }
    if (!fs.existsSync(gogClientCredentialsPath(client))) {
      return res.json({
        ok: false,
        error: "Credentials missing for selected client. Save credentials first.",
      });
    }
    try {
      const state = readState();
      const existing = accountId ? getGoogleAccountById(state, accountId) : null;
      const { state: nextState, account } = upsertGoogleAccount({
        state,
        maxAccounts: kMaxGoogleAccounts,
        account: {
          id: existing?.id || accountId || createGoogleAccountId(),
          email,
          personal,
          client,
          services: body.services || existing?.services || kDefaultGoogleScopes,
          authenticated: Boolean(existing?.authenticated),
        },
      });
      saveState(nextState);
      syncBootstrapTools(req);
      res.json({ ok: true, accountId: account.id, account });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });

  app.get("/api/google/check", async (req, res) => {
    const state = readState();
    const account = getSelectedAccount({
      state,
      accountId: String(req.query.accountId || ""),
      fallbackToFirst: true,
    });
    if (!account) return res.json({ error: "No Google account configured" });

    const enabledServices = uniqueServiceLabels(account.services || []);
    const results = {};
    for (const svc of enabledServices) {
      const cmd = API_TEST_COMMANDS[svc];
      if (!cmd) continue;
      const clientArg =
        account.client === kDefaultGoogleClient
          ? ""
          : `--client ${quoteShellArg(account.client)} `;
      const result = await gogCmd(
        `${clientArg}${cmd} --account ${quoteShellArg(account.email)}`,
        { quiet: true },
      );
      const stderr = result.stderr || "";
      if (stderr.includes("has not been used") || stderr.includes("is not enabled")) {
        const projectMatch = stderr.match(/project=(\d+)/);
        results[svc] = {
          status: "not_enabled",
          enableUrl: getApiEnableUrl(svc, projectMatch?.[1]),
        };
      } else if (result.ok || stderr.includes("not found") || stderr.includes("Not Found")) {
        results[svc] = { status: "ok", enableUrl: getApiEnableUrl(svc) };
      } else {
        results[svc] = {
          status: "error",
          message: result.stderr?.slice(0, 200),
          enableUrl: getApiEnableUrl(svc),
        };
      }
    }
    res.json({ accountId: account.id, email: account.email, results });
  });

  app.post("/api/google/disconnect", async (req, res) => {
    const accountId = String(req.body?.accountId || "").trim();
    const state = readState();
    const account = getSelectedAccount({ state, accountId, fallbackToFirst: true });
    if (!account) return res.json({ ok: true });
    try {
      const revokeFile = `/tmp/gog-revoke-${Date.now()}.json`;
      const clientArg =
        account.client === kDefaultGoogleClient
          ? ""
          : `--client ${quoteShellArg(account.client)} `;
      const exportResult = await gogCmd(
        `${clientArg}auth tokens export ${quoteShellArg(account.email)} --out ${quoteShellArg(revokeFile)} --overwrite`,
        { quiet: true },
      );
      if (exportResult.ok && fs.existsSync(revokeFile)) {
        try {
          const tokenData = parseJsonSafe(fs.readFileSync(revokeFile, "utf8"), {});
          if (tokenData.refresh_token) {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.refresh_token}`, {
              method: "POST",
            });
          }
        } catch {}
      }
      try {
        fs.unlinkSync(revokeFile);
      } catch {}
      await gogCmd(
        `${clientArg}auth remove ${quoteShellArg(account.email)} --force`,
        { quiet: true },
      );
      const { state: nextState } = removeGoogleAccount({
        state,
        accountId: account.id,
      });
      saveState(nextState);
      syncBootstrapTools(req);
      res.json({ ok: true });
    } catch (err) {
      console.error("[alphaclaw] Google disconnect error:", err);
      res.json({ ok: false, error: err.message });
    }
  });

  app.get("/auth/google/start", (req, res) => {
    const state = readState();
    const requestedAccountId = String(req.query.accountId || "").trim();
    const requestedClient = String(req.query.client || "").trim();
    let account = requestedAccountId
      ? getGoogleAccountById(state, requestedAccountId)
      : null;
    if (!account && req.query.email) {
      account = getGoogleAccountByEmailAndClient(
        state,
        String(req.query.email || "").trim(),
        requestedClient || kDefaultGoogleClient,
      );
    }
    const client = account?.client || requestedClient || kDefaultGoogleClient;
    const email = account?.email || String(req.query.email || "").trim();
    const services = (
      req.query.services ||
      (account?.services || kDefaultGoogleScopes).join(",")
    )
      .split(",")
      .map((scope) => String(scope || "").trim())
      .filter(Boolean);
    try {
      const { clientId } = readGoogleCredentials(client);
      if (!clientId) throw new Error("No client_id found");
      const scopes = [
        ...BASE_SCOPES,
        ...services.map((scope) => SCOPE_MAP[scope]).filter(Boolean),
      ].join(" ");
      const redirectUri = `${getBaseUrl(req)}/auth/google/callback`;
      const encodedState = Buffer.from(
        JSON.stringify({
          accountId: account?.id || requestedAccountId || "",
          client,
          email,
          services,
        }),
      ).toString("base64url");
      const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", encodedState);
      if (email) authUrl.searchParams.set("login_hint", email);
      res.redirect(authUrl.toString());
    } catch (err) {
      console.error("[alphaclaw] Failed to start Google auth:", err);
      res.redirect(`/setup?google=error&message=${encodeURIComponent(err.message)}`);
    }
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code, error, state } = req.query;
    if (error) return res.redirect(`/setup?google=error&message=${encodeURIComponent(error)}`);
    if (!code) return res.redirect("/setup?google=error&message=no_code");

    try {
      const decodedState = parseJsonSafe(
        Buffer.from(String(state || ""), "base64url").toString(),
        {},
      );
      const accountId = String(decodedState.accountId || "").trim();
      const requestedClient = String(decodedState.client || "").trim();
      const stateData = readState();
      const existingAccount = accountId
        ? getGoogleAccountById(stateData, accountId)
        : getGoogleAccountByEmailAndClient(
            stateData,
            String(decodedState.email || "").trim(),
            requestedClient || kDefaultGoogleClient,
          );
      const client = existingAccount?.client || requestedClient || kDefaultGoogleClient;
      const { clientId, clientSecret } = readGoogleCredentials(client);
      if (!clientId || !clientSecret) {
        throw new Error(`Google credentials missing for client "${client}"`);
      }
      const redirectUri = `${getBaseUrl(req)}/auth/google/callback`;
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok || tokens.error) {
        throw new Error(`Google token error: ${tokens.error_description || tokens.error || "exchange_failed"}`);
      }

      if (!tokens.refresh_token && !existingAccount?.authenticated) {
        throw new Error(
          "No refresh token received. Revoke app access at myaccount.google.com/permissions and retry.",
        );
      }

      let email = String(existingAccount?.email || decodedState.email || "").trim();
      if (!email && tokens.access_token) {
        try {
          const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const info = await infoRes.json();
          email = String(info.email || "").trim();
        } catch {}
      }

      if (tokens.refresh_token) {
        const tokenFile = `/tmp/gog-token-${Date.now()}.json`;
        const tokenData = {
          email,
          client,
          created_at: new Date().toISOString(),
          refresh_token: tokens.refresh_token,
        };
        fs.writeFileSync(tokenFile, JSON.stringify(tokenData, null, 2));
        const importCmd =
          client === kDefaultGoogleClient
            ? `auth tokens import ${quoteShellArg(tokenFile)}`
            : `--client ${quoteShellArg(client)} auth tokens import ${quoteShellArg(tokenFile)}`;
        const result = await gogCmd(importCmd, { quiet: true });
        try {
          fs.unlinkSync(tokenFile);
        } catch {}
        if (!result.ok) {
          throw new Error(result.stderr || "Failed to import Google token");
        }
      }

      const requestedServices = Array.isArray(decodedState.services)
        ? decodedState.services
        : [];
      const grantedServices = tokens.scope
        ? tokens.scope
            .split(" ")
            .map((scope) => REVERSE_SCOPE_MAP[scope])
            .filter(Boolean)
        : requestedServices;
      const { state: nextState, account } = upsertGoogleAccount({
        state: stateData,
        maxAccounts: kMaxGoogleAccounts,
        account: {
          id: existingAccount?.id || accountId || createGoogleAccountId(),
          email,
          personal: Boolean(existingAccount?.personal),
          client,
          services: grantedServices.length ? grantedServices : requestedServices,
          authenticated: true,
        },
      });
      saveState(nextState);
      syncBootstrapTools(req);

      const safeEmail = String(email || "").replace(/'/g, "\\'");
      const safeAccountId = String(account.id || "").replace(/'/g, "\\'");
      res.send(`<!DOCTYPE html><html><body><script>
      window.opener?.postMessage({ google: 'success', accountId: '${safeAccountId}', email: '${safeEmail}' }, '*');
      window.close();
    </script><p>Google connected! You can close this window.</p></body></html>`);
    } catch (err) {
      console.error("[alphaclaw] Google OAuth callback error:", err);
      const safeMessage = String(err.message || "unknown_error").replace(/'/g, "\\'");
      res.send(`<!DOCTYPE html><html><body><script>
      window.opener?.postMessage({ google: 'error', message: '${safeMessage}' }, '*');
      window.close();
    </script><p>Error: ${safeMessage}. You can close this window.</p></body></html>`);
    }
  });
};

module.exports = { registerGoogleRoutes };
