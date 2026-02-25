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
    GOG_CREDENTIALS_PATH,
    GOG_CONFIG_DIR,
    GOG_STATE_PATH,
    API_TEST_COMMANDS,
    BASE_SCOPES,
    SCOPE_MAP,
    REVERSE_SCOPE_MAP,
  } = constants;

  app.get("/api/google/status", async (req, res) => {
    if (!(await isGatewayRunning())) {
      return res.json({
        hasCredentials: false,
        authenticated: false,
        email: "",
        services: "",
      });
    }
    const hasCredentials = fs.existsSync(GOG_CREDENTIALS_PATH);
    let authenticated = false;
    let email = "";

    if (hasCredentials) {
      const result = await gogCmd("auth list --plain", { quiet: true });
      if (result.ok && result.stdout && !result.stdout.includes("no accounts")) {
        authenticated = true;
        email = result.stdout.split("\n")[0]?.split("\t")[0] || "";
      }
      if (!email) {
        try {
          const state = JSON.parse(fs.readFileSync(GOG_STATE_PATH, "utf8"));
          email = state.email || "";
        } catch {}
      }
    }

    let services = "";
    let activeScopes = [];
    try {
      const stateData = JSON.parse(fs.readFileSync(GOG_STATE_PATH, "utf8"));
      activeScopes = stateData.services || [];
      services = activeScopes
        .map((s) => s.split(":")[0])
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ");
    } catch {}

    const status = {
      hasCredentials,
      authenticated,
      email,
      services,
      activeScopes,
    };
    console.log(`[wrapper] Google status: ${JSON.stringify(status)}`);
    res.json(status);
  });

  app.post("/api/google/credentials", async (req, res) => {
    const { clientId, clientSecret, email } = req.body;
    if (!clientId || !clientSecret || !email) {
      return res.json({ ok: false, error: "Missing fields" });
    }

    try {
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

      fs.writeFileSync(GOG_CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
      const result = await gogCmd(`auth credentials set ${GOG_CREDENTIALS_PATH}`);
      console.log(`[wrapper] gog credentials set: ${JSON.stringify(result)}`);

      const services = req.body.services || [
        "gmail:read",
        "gmail:write",
        "calendar:read",
        "calendar:write",
        "drive:read",
        "sheets:read",
        "docs:read",
      ];
      fs.writeFileSync(GOG_STATE_PATH, JSON.stringify({ email, services }));

      res.json({ ok: true });
    } catch (err) {
      console.error("[wrapper] Failed to save Google credentials:", err);
      res.json({ ok: false, error: err.message });
    }
  });

  app.get("/api/google/check", async (req, res) => {
    let email = "";
    let activeScopes = [];
    try {
      const stateData = JSON.parse(fs.readFileSync(GOG_STATE_PATH, "utf8"));
      email = stateData.email || "";
      activeScopes = stateData.services || [];
    } catch {}
    if (!email) return res.json({ error: "No Google account configured" });

    const enabledServices = activeScopes
      .map((s) => s.split(":")[0])
      .filter((v, i, a) => a.indexOf(v) === i);
    const results = {};

    for (const svc of enabledServices) {
      const cmd = API_TEST_COMMANDS[svc];
      if (!cmd) continue;

      const result = await gogCmd(`${cmd} --account ${email}`, { quiet: true });
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
        console.log(`[wrapper] API check ${svc} error: ${result.stderr?.slice(0, 300)}`);
        results[svc] = {
          status: "error",
          message: result.stderr?.slice(0, 200),
          enableUrl: getApiEnableUrl(svc),
        };
      }
    }

    res.json({ email, results });
  });

  app.post("/api/google/disconnect", async (req, res) => {
    try {
      let email = "";
      try {
        const stateData = JSON.parse(fs.readFileSync(GOG_STATE_PATH, "utf8"));
        email = stateData.email || "";
      } catch {}

      if (email) {
        const exportResult = await gogCmd(
          `auth tokens export ${email} --out /tmp/gog-revoke.json --overwrite`,
          { quiet: true },
        );
        if (exportResult.ok) {
          try {
            const tokenData = JSON.parse(fs.readFileSync("/tmp/gog-revoke.json", "utf8"));
            if (tokenData.refresh_token) {
              await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.refresh_token}`, {
                method: "POST",
              });
              console.log(`[wrapper] Revoked Google token for ${email}`);
            }
            fs.unlinkSync("/tmp/gog-revoke.json");
          } catch {}
        }
        await gogCmd(`auth remove ${email} --force`);
      }

      for (const f of [GOG_STATE_PATH, GOG_CREDENTIALS_PATH]) {
        try {
          fs.unlinkSync(f);
          console.log(`[wrapper] Deleted ${f}`);
        } catch (e) {
          if (e.code !== "ENOENT") {
            console.error(`[wrapper] Failed to delete ${f}: ${e.message}`);
          }
        }
      }

      const stateStillExists = fs.existsSync(GOG_STATE_PATH);
      const credsStillExists = fs.existsSync(GOG_CREDENTIALS_PATH);
      if (stateStillExists || credsStillExists) {
        console.error(
          `[wrapper] Files survived deletion! state=${stateStillExists} creds=${credsStillExists}`,
        );
      }

      console.log(`[wrapper] Google disconnected: ${email}`);
      res.json({ ok: true });
    } catch (err) {
      console.error("[wrapper] Google disconnect error:", err);
      res.json({ ok: false, error: err.message });
    }
  });

  app.get("/auth/google/start", (req, res) => {
    const email = req.query.email || "";
    const services = (
      req.query.services ||
      "gmail:read,gmail:write,calendar:read,calendar:write,drive:read,sheets:read,docs:read"
    )
      .split(",")
      .filter(Boolean);

    try {
      const { clientId } = readGoogleCredentials();
      if (!clientId) throw new Error("No client_id found");

      const scopes = [
        ...BASE_SCOPES,
        ...services.map((s) => SCOPE_MAP[s]).filter(Boolean),
      ].join(" ");
      console.log(
        `[wrapper] Google OAuth scopes: services=${services.join(",")} resolved=${scopes}`,
      );

      const redirectUri = `${getBaseUrl(req)}/auth/google/callback`;
      const state = Buffer.from(JSON.stringify({ email, services })).toString(
        "base64url",
      );

      const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);
      if (email) authUrl.searchParams.set("login_hint", email);

      res.redirect(authUrl.toString());
    } catch (err) {
      console.error("[wrapper] Failed to start Google auth:", err);
      res.redirect("/setup?google=error&message=" + encodeURIComponent(err.message));
    }
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code, error, state } = req.query;
    if (error) return res.redirect("/setup?google=error&message=" + encodeURIComponent(error));
    if (!code) return res.redirect("/setup?google=error&message=no_code");

    try {
      let email = "";
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        email = decoded.email || "";
      } catch {}

      const { clientId, clientSecret } = readGoogleCredentials();
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
        console.log(
          `[wrapper] Google token exchange failed: status=${tokenRes.status} error=${tokens.error} desc=${tokens.error_description}`,
        );
      }
      if (tokens.error) {
        throw new Error(`Google token error: ${tokens.error_description || tokens.error}`);
      }

      if (!tokens.refresh_token) {
        let hasExisting = false;
        try {
          const stateData = JSON.parse(fs.readFileSync(GOG_STATE_PATH, "utf8"));
          hasExisting = stateData.authenticated;
        } catch {}

        if (hasExisting) {
          console.log(
            "[wrapper] No new refresh token (already authorized), keeping existing",
          );
        } else {
          throw new Error(
            "No refresh token received. Revoke app access at myaccount.google.com/permissions and retry.",
          );
        }
      }

      if (!email && tokens.access_token) {
        try {
          const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const info = await infoRes.json();
          email = info.email || email;
        } catch {}
      }

      if (tokens.refresh_token) {
        const tokenFile = `/tmp/gog-token-${Date.now()}.json`;
        const tokenData = {
          email,
          client: "default",
          created_at: new Date().toISOString(),
          refresh_token: tokens.refresh_token,
        };
        fs.writeFileSync(tokenFile, JSON.stringify(tokenData, null, 2));
        const result = await gogCmd(`auth tokens import ${tokenFile}`);
        if (result.ok) {
          console.log(`[wrapper] Google token imported for ${email}`);
        } else {
          console.error(`[wrapper] Token import failed: ${result.stderr}`);
        }

        if (!result.ok) {
          console.error("[wrapper] Token import failed, trying gog auth add --manual");
          const keyringDir = `${GOG_CONFIG_DIR}/keyring`;
          fs.mkdirSync(keyringDir, { recursive: true });
          fs.writeFileSync(
            `${keyringDir}/token-${email}.json`,
            JSON.stringify(tokenData, null, 2),
          );
          console.log(
            `[wrapper] Token written directly to keyring: ${keyringDir}/token-${email}.json`,
          );
        }

        try {
          fs.unlinkSync(tokenFile);
        } catch {}
      }

      let services = [];
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        services = decoded.services || [];
      } catch {}

      const grantedServices = tokens.scope
        ? tokens.scope
            .split(" ")
            .map((s) => REVERSE_SCOPE_MAP[s])
            .filter(Boolean)
        : services;
      console.log(
        `[wrapper] Requested: ${services.join(",")} → Granted: ${grantedServices.join(",")}`,
      );

      fs.writeFileSync(
        GOG_STATE_PATH,
        JSON.stringify({
          email,
          clientId,
          clientSecret,
          services: grantedServices,
          authenticated: true,
        }),
      );

      res.send(`<!DOCTYPE html><html><body><script>
      window.opener?.postMessage({ google: 'success', email: '${email}' }, '*');
      window.close();
    </script><p>Google connected! You can close this window.</p></body></html>`);
    } catch (err) {
      console.error("[wrapper] Google OAuth callback error:", err);
      res.send(`<!DOCTYPE html><html><body><script>
      window.opener?.postMessage({ google: 'error', message: '${err.message.replace(/'/g, "\\'")}' }, '*');
      window.close();
    </script><p>Error: ${err.message}. You can close this window.</p></body></html>`);
    }
  });
};

module.exports = { registerGoogleRoutes };
