const { kLoginWindowMs, kLoginMaxAttempts, kLoginBaseLockMs, kLoginMaxLockMs, kLoginStateTtlMs } = require("./constants");

const createLoginThrottle = () => {
  const kLoginAttemptStates = new Map();

  const getOrCreateLoginAttemptState = (clientKey, now) => {
    const existing = kLoginAttemptStates.get(clientKey);
    if (existing) {
      existing.lastSeenAt = now;
      return existing;
    }
    const next = {
      attempts: 0,
      windowStart: now,
      lockUntil: 0,
      failStreak: 0,
      lastSeenAt: now,
    };
    kLoginAttemptStates.set(clientKey, next);
    return next;
  };

  const evaluateLoginThrottle = (state, now) => {
    if (!state) return { blocked: false, retryAfterSec: 0 };
    if (state.lockUntil > now) {
      return {
        blocked: true,
        retryAfterSec: Math.max(1, Math.ceil((state.lockUntil - now) / 1000)),
      };
    }
    if (now - state.windowStart >= kLoginWindowMs) {
      state.attempts = 0;
      state.windowStart = now;
    }
    return { blocked: false, retryAfterSec: 0 };
  };

  const recordLoginFailure = (state, now) => {
    if (!state) return { lockMs: 0, locked: false };
    if (now - state.windowStart >= kLoginWindowMs) {
      state.attempts = 0;
      state.windowStart = now;
    }
    state.attempts += 1;
    state.lastSeenAt = now;
    if (state.attempts < kLoginMaxAttempts) {
      return { lockMs: 0, locked: false };
    }
    state.failStreak += 1;
    state.attempts = 0;
    state.windowStart = now;
    const lockMultiplier = Math.max(1, 2 ** (state.failStreak - 1));
    const lockMs = Math.min(kLoginBaseLockMs * lockMultiplier, kLoginMaxLockMs);
    state.lockUntil = now + lockMs;
    return { lockMs, locked: true };
  };

  const recordLoginSuccess = (clientKey) => {
    if (!clientKey) return;
    kLoginAttemptStates.delete(clientKey);
  };

  const cleanupLoginAttemptStates = () => {
    const now = Date.now();
    for (const [key, state] of kLoginAttemptStates.entries()) {
      if (!state) {
        kLoginAttemptStates.delete(key);
        continue;
      }
      if (state.lockUntil > now) continue;
      if (now - state.lastSeenAt > kLoginStateTtlMs) {
        kLoginAttemptStates.delete(key);
      }
    }
  };

  return {
    getOrCreateLoginAttemptState,
    evaluateLoginThrottle,
    recordLoginFailure,
    recordLoginSuccess,
    cleanupLoginAttemptStates,
  };
};

module.exports = { createLoginThrottle };
