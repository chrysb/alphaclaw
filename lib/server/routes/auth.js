const crypto = require("crypto");
const { kLoginCleanupIntervalMs } = require("../constants");

const registerAuthRoutes = ({ app, loginThrottle }) => {
  const SETUP_PASSWORD = String(process.env.SETUP_PASSWORD || "").trim();
  const kAuthMisconfigured = !SETUP_PASSWORD;
  const kSessionTtlMs = 7 * 24 * 60 * 60 * 1000;

  const signSessionPayload = (payload) =>
    crypto
      .createHmac("sha256", SETUP_PASSWORD)
      .update(payload)
      .digest("base64url");

  const createSessionToken = () => {
    const now = Date.now();
    const payload = Buffer.from(
      JSON.stringify({
        iat: now,
        exp: now + kSessionTtlMs,
        nonce: crypto.randomBytes(16).toString("hex"),
      }),
    ).toString("base64url");
    const signature = signSessionPayload(payload);
    return `${payload}.${signature}`;
  };

  const verifySessionToken = (token) => {
    if (!SETUP_PASSWORD || !token || typeof token !== "string") return false;
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payload, signature] = parts;
    if (!payload || !signature) return false;
    const expectedSignature = signSessionPayload(payload);
    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== signatureBuffer.length) return false;
    if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return false;
    try {
      const parsed = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      );
      return Number.isFinite(parsed?.exp) && parsed.exp > Date.now();
    } catch {
      return false;
    }
  };

  const cookieParser = (req) => {
    const cookies = {};
    const cookieHeader =
      req && req.headers && typeof req.headers.cookie === "string"
        ? req.headers.cookie
        : "";
    cookieHeader.split(";").forEach((c) => {
      const [k, ...v] = c.trim().split("=");
      if (k) cookies[k] = v.join("=");
    });
    return cookies;
  };

  app.post("/api/auth/login", (req, res) => {
    if (kAuthMisconfigured) {
      return res.status(503).json({
        ok: false,
        error:
          "Server misconfigured: SETUP_PASSWORD is missing. Set it in your deployment environment variables and restart.",
      });
    }
    const now = Date.now();
    const clientKey = loginThrottle.getClientKey(req);
    const state = loginThrottle.getOrCreateLoginAttemptState(clientKey, now);
    const throttle = loginThrottle.evaluateLoginThrottle(state, now);
    if (throttle.blocked) {
      res.set("Retry-After", String(throttle.retryAfterSec));
      return res.status(429).json({
        ok: false,
        error: "Too many attempts. Try again shortly.",
        retryAfterSec: throttle.retryAfterSec,
      });
    }
    if (req.body.password !== SETUP_PASSWORD) {
      const failure = loginThrottle.recordLoginFailure(state, now);
      if (failure.locked) {
        const retryAfterSec = Math.max(1, Math.ceil(failure.lockMs / 1000));
        res.set("Retry-After", String(retryAfterSec));
        return res.status(429).json({
          ok: false,
          error: "Too many attempts. Try again shortly.",
          retryAfterSec,
        });
      }
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }
    loginThrottle.recordLoginSuccess(clientKey);
    const token = createSessionToken();
    res.cookie("setup_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: kSessionTtlMs,
    });
    res.json({ ok: true });
  });

  setInterval(() => {
    loginThrottle.cleanupLoginAttemptStates();
  }, kLoginCleanupIntervalMs).unref();

  const isAuthorizedRequest = (req) => {
    if (kAuthMisconfigured) return false;
    const requestPath = req.path || "";
    if (requestPath.startsWith("/auth/google/callback")) return true;
    if (requestPath.startsWith("/auth/codex/callback")) return true;
    const cookies = cookieParser(req);
    const token = cookies.setup_token;
    return verifySessionToken(token);
  };

  const requireAuth = (req, res, next) => {
    if (kAuthMisconfigured) {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(503).json({
          error:
            "Server misconfigured: SETUP_PASSWORD is missing. Set it in your deployment environment variables and restart.",
        });
      }
      return res
        .status(503)
        .send(
          "Setup auth is not configured. Set SETUP_PASSWORD in your deployment environment and restart.",
        );
    }
    if (req.path.startsWith("/auth/google/callback")) return next();
    if (req.path.startsWith("/auth/codex/callback")) return next();
    if (isAuthorizedRequest(req)) return next();
    if (req.originalUrl.startsWith("/api/")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.redirect("/login.html");
  };

  app.get("/api/auth/status", (req, res) => {
    res.json({ authEnabled: !!SETUP_PASSWORD });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("setup_token", { path: "/" });
    res.json({ ok: true });
  });

  app.use("/setup", requireAuth);
  app.use("/api", requireAuth);
  app.use("/auth", requireAuth);

  return { requireAuth, isAuthorizedRequest };
};

module.exports = { registerAuthRoutes };
