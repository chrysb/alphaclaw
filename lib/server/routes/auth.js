const crypto = require("crypto");
const path = require("path");
const { kLoginCleanupIntervalMs } = require("../constants");

const registerAuthRoutes = ({ app, loginThrottle }) => {
  const SETUP_PASSWORD = process.env.SETUP_PASSWORD || "";
  const kAuthTokens = new Set();

  const cookieParser = (req) => {
    const cookies = {};
    (req.headers.cookie || "").split(";").forEach((c) => {
      const [k, ...v] = c.trim().split("=");
      if (k) cookies[k] = v.join("=");
    });
    return cookies;
  };

  app.post("/api/auth/login", (req, res) => {
    if (!SETUP_PASSWORD) return res.json({ ok: true });
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
    const token = crypto.randomBytes(32).toString("hex");
    kAuthTokens.add(token);
    res.cookie("setup_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    res.json({ ok: true });
  });

  setInterval(() => {
    loginThrottle.cleanupLoginAttemptStates();
  }, kLoginCleanupIntervalMs).unref();

  const requireAuth = (req, res, next) => {
    if (!SETUP_PASSWORD) return next();
    if (req.path.startsWith("/auth/google/callback")) return next();
    if (req.path.startsWith("/auth/codex/callback")) return next();
    const cookies = cookieParser(req);
    const token = cookies.setup_token || req.query.token;
    if (token && kAuthTokens.has(token)) return next();
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.sendFile(path.join(__dirname, "..", "..", "public", "login.html"));
  };

  app.use("/setup", requireAuth);
  app.use("/api", requireAuth);
  app.use("/auth", requireAuth);

  return { requireAuth };
};

module.exports = { registerAuthRoutes };
