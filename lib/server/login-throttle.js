const {
  kLoginWindowMs,
  kLoginMaxAttempts,
  kLoginBaseLockMs,
  kLoginMaxLockMs,
  kLoginGlobalWindowMs,
  kLoginGlobalMaxAttempts,
  kLoginGlobalBaseLockMs,
  kLoginGlobalMaxLockMs,
  kLoginStateTtlMs,
} = require("./constants");

const kGlobalStateKey = "global:login";
const kLoginThrottleScope = "login";

const createLoginAttemptState = (now) => ({
  attempts: 0,
  windowStart: now,
  lockUntil: 0,
  failStreak: 0,
  lastSeenAt: now,
});

const normalizeState = (state, now) => ({
  attempts: Number.parseInt(String(state?.attempts ?? 0), 10) || 0,
  windowStart: Number.parseInt(String(state?.windowStart ?? now), 10) || now,
  lockUntil: Number.parseInt(String(state?.lockUntil ?? 0), 10) || 0,
  failStreak: Number.parseInt(String(state?.failStreak ?? 0), 10) || 0,
  lastSeenAt: Number.parseInt(String(state?.lastSeenAt ?? now), 10) || now,
});

const createMemoryLoginThrottleStore = () => {
  const states = new Map();

  return {
    get: (stateKey) => states.get(stateKey) || null,
    set: (stateKey, state) => {
      states.set(stateKey, { ...state });
    },
    delete: (stateKey) => {
      states.delete(stateKey);
    },
    entries: () =>
      Array.from(states.entries()).map(([stateKey, state]) => [
        stateKey,
        { ...state },
      ]),
    runExclusive: (callback) => callback(),
  };
};

const getClientStateKey = (clientKey, scope = kLoginThrottleScope) => {
  const normalizedClientKey = String(clientKey || "unknown");
  return scope === kLoginThrottleScope
    ? `client:${normalizedClientKey}`
    : `client:${scope}:${normalizedClientKey}`;
};

const getGlobalStateKey = (scope = kLoginThrottleScope) =>
  scope === kLoginThrottleScope ? kGlobalStateKey : `global:${scope}`;

const getOrCreateState = (store, stateKey, now) => {
  const existing = store.get(stateKey);
  if (existing) {
    const state = normalizeState(existing, now);
    state.lastSeenAt = now;
    store.set(stateKey, state);
    return state;
  }
  const next = createLoginAttemptState(now);
  store.set(stateKey, next);
  return next;
};

const evaluateState = ({ store, stateKey, now, windowMs }) => {
  const state = getOrCreateState(store, stateKey, now);
  if (state.lockUntil > now) {
    return {
      state,
      blocked: true,
      retryAfterSec: Math.max(1, Math.ceil((state.lockUntil - now) / 1000)),
    };
  }
  if (now - state.windowStart >= windowMs) {
    state.attempts = 0;
    state.windowStart = now;
    store.set(stateKey, state);
  }
  return { state, blocked: false, retryAfterSec: 0 };
};

const recordStateFailure = ({
  store,
  stateKey,
  now,
  windowMs,
  maxAttempts,
  baseLockMs,
  maxLockMs,
}) => {
  const state = getOrCreateState(store, stateKey, now);
  if (state.lockUntil > now) {
    return {
      state,
      lockMs: state.lockUntil - now,
      locked: true,
      retryAfterSec: Math.max(1, Math.ceil((state.lockUntil - now) / 1000)),
    };
  }
  if (now - state.windowStart >= windowMs) {
    state.attempts = 0;
    state.windowStart = now;
  }
  state.attempts += 1;
  state.lastSeenAt = now;
  if (state.attempts < maxAttempts) {
    store.set(stateKey, state);
    return { state, lockMs: 0, locked: false, retryAfterSec: 0 };
  }
  state.failStreak += 1;
  state.attempts = 0;
  state.windowStart = now;
  const lockMultiplier = Math.max(1, 2 ** (state.failStreak - 1));
  const lockMs = Math.min(baseLockMs * lockMultiplier, maxLockMs);
  state.lockUntil = now + lockMs;
  store.set(stateKey, state);
  return {
    state,
    lockMs,
    locked: true,
    retryAfterSec: Math.max(1, Math.ceil(lockMs / 1000)),
  };
};

const chooseThrottleResult = (...results) => {
  const blockedResults = results.filter((result) => result.blocked);
  if (blockedResults.length === 0) {
    return { blocked: false, retryAfterSec: 0 };
  }
  return {
    blocked: true,
    retryAfterSec: Math.max(
      ...blockedResults.map((result) => result.retryAfterSec || 0),
    ),
  };
};

const chooseFailureResult = (...results) => {
  const lockedResults = results.filter((result) => result.locked);
  if (lockedResults.length === 0) {
    return { lockMs: 0, locked: false, retryAfterSec: 0 };
  }
  return {
    lockMs: Math.max(...lockedResults.map((result) => result.lockMs || 0)),
    locked: true,
    retryAfterSec: Math.max(
      ...lockedResults.map((result) => result.retryAfterSec || 0),
    ),
  };
};

const createLoginThrottle = ({
  store = createMemoryLoginThrottleStore(),
  scope = kLoginThrottleScope,
  windowMs = kLoginWindowMs,
  maxAttempts = kLoginMaxAttempts,
  baseLockMs = kLoginBaseLockMs,
  maxLockMs = kLoginMaxLockMs,
  globalWindowMs = kLoginGlobalWindowMs,
  globalMaxAttempts = kLoginGlobalMaxAttempts,
  globalBaseLockMs = kLoginGlobalBaseLockMs,
  globalMaxLockMs = kLoginGlobalMaxLockMs,
  stateTtlMs = kLoginStateTtlMs,
} = {}) => {
  const runExclusive =
    typeof store.runExclusive === "function"
      ? (callback) => store.runExclusive(callback)
      : (callback) => callback();

  const getOrCreateLoginAttemptState = (clientKey, now) =>
    runExclusive(() => {
      const clientStateKey = getClientStateKey(clientKey, scope);
      const globalStateKey = getGlobalStateKey(scope);
      return {
        clientKey,
        clientStateKey,
        globalStateKey,
        client: getOrCreateState(store, clientStateKey, now),
        global: getOrCreateState(store, globalStateKey, now),
      };
    });

  const evaluateLoginThrottle = (stateBundle, now) =>
    runExclusive(() => {
      const clientStateKey =
        stateBundle?.clientStateKey ||
        getClientStateKey(stateBundle?.clientKey, scope);
      const globalStateKey = stateBundle?.globalStateKey || getGlobalStateKey(scope);
      const clientResult = evaluateState({
        store,
        stateKey: clientStateKey,
        now,
        windowMs,
      });
      const globalResult = evaluateState({
        store,
        stateKey: globalStateKey,
        now,
        windowMs: globalWindowMs,
      });
      if (stateBundle) {
        stateBundle.client = clientResult.state;
        stateBundle.global = globalResult.state;
      }
      return chooseThrottleResult(clientResult, globalResult);
    });

  const recordLoginFailure = (stateBundle, now) =>
    runExclusive(() => {
      const clientStateKey =
        stateBundle?.clientStateKey ||
        getClientStateKey(stateBundle?.clientKey, scope);
      const globalStateKey = stateBundle?.globalStateKey || getGlobalStateKey(scope);
      const clientResult = recordStateFailure({
        store,
        stateKey: clientStateKey,
        now,
        windowMs,
        maxAttempts,
        baseLockMs,
        maxLockMs,
      });
      const globalResult = recordStateFailure({
        store,
        stateKey: globalStateKey,
        now,
        windowMs: globalWindowMs,
        maxAttempts: globalMaxAttempts,
        baseLockMs: globalBaseLockMs,
        maxLockMs: globalMaxLockMs,
      });
      if (stateBundle) {
        stateBundle.client = clientResult.state;
        stateBundle.global = globalResult.state;
      }
      return chooseFailureResult(clientResult, globalResult);
    });

  const recordLoginSuccess = (clientKey) => {
    if (!clientKey) return;
    runExclusive(() => {
      store.delete(getClientStateKey(clientKey, scope));
      store.delete(getGlobalStateKey(scope));
    });
  };

  const cleanupLoginAttemptStates = () => {
    const now = Date.now();
    runExclusive(() => {
      for (const [stateKey, rawState] of store.entries()) {
        if (!rawState) {
          store.delete(stateKey);
          continue;
        }
        const state = normalizeState(rawState, now);
        if (state.lockUntil > now) continue;
        if (now - state.lastSeenAt > stateTtlMs) {
          store.delete(stateKey);
        }
      }
    });
  };

  return {
    getOrCreateLoginAttemptState,
    evaluateLoginThrottle,
    recordLoginFailure,
    recordLoginSuccess,
    cleanupLoginAttemptStates,
  };
};

module.exports = {
  createLoginThrottle,
  createMemoryLoginThrottleStore,
  kGlobalStateKey,
};
