const {
  createLoginThrottle,
  createMemoryLoginThrottleStore,
} = require("../../lib/server/login-throttle");
const {
  kLoginWindowMs,
  kLoginMaxAttempts,
  kLoginBaseLockMs,
  kLoginMaxLockMs,
  kLoginGlobalMaxAttempts,
  kLoginStateTtlMs,
} = require("../../lib/server/constants");

describe("server/login-throttle", () => {
  it("locks after max failures and reports retry-after while blocked", () => {
    const throttle = createLoginThrottle();
    const now = 1_000;
    const state = throttle.getOrCreateLoginAttemptState("client-1", now);

    for (let i = 0; i < kLoginMaxAttempts - 1; i += 1) {
      expect(throttle.recordLoginFailure(state, now + i)).toEqual(
        expect.objectContaining({
          lockMs: 0,
          locked: false,
        }),
      );
    }

    const lockResult = throttle.recordLoginFailure(state, now + 100);
    expect(lockResult.locked).toBe(true);
    expect(lockResult.lockMs).toBeGreaterThanOrEqual(kLoginBaseLockMs);

    const blocked = throttle.evaluateLoginThrottle(state, now + 101);
    expect(blocked.blocked).toBe(true);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("applies exponential backoff and caps lock at max lock", () => {
    const throttle = createLoginThrottle();
    const state = throttle.getOrCreateLoginAttemptState("client-2", 5_000);
    let now = 5_000;

    const getLockMsForStreak = () => {
      for (let i = 0; i < kLoginMaxAttempts; i += 1) {
        const result = throttle.recordLoginFailure(state, now + i);
        if (result.locked) return result.lockMs;
      }
      return 0;
    };

    const firstLockMs = getLockMsForStreak();
    now += kLoginWindowMs + firstLockMs + 1;
    const secondLockMs = getLockMsForStreak();

    expect(secondLockMs).toBeGreaterThanOrEqual(firstLockMs);
    expect(secondLockMs).toBeLessThanOrEqual(kLoginMaxLockMs);
  });

  it("removes state on login success", () => {
    const throttle = createLoginThrottle();
    const now = 10_000;
    throttle.getOrCreateLoginAttemptState("client-3", now);
    throttle.recordLoginSuccess("client-3");

    const state = throttle.getOrCreateLoginAttemptState("client-3", now + 1);
    expect(state.client.attempts).toBe(0);
    expect(state.client.failStreak).toBe(0);
    expect(state.global.attempts).toBe(0);
    expect(state.global.failStreak).toBe(0);
  });

  it("isolates scoped throttle state in the same store", () => {
    const store = createMemoryLoginThrottleStore();
    const loginThrottle = createLoginThrottle({
      store,
      maxAttempts: 2,
      globalMaxAttempts: 100,
    });
    const apiThrottle = createLoginThrottle({
      store,
      scope: "openai-compat-api",
      maxAttempts: 2,
      globalMaxAttempts: 100,
    });
    const now = 12_000;
    const apiState = apiThrottle.getOrCreateLoginAttemptState("client-1", now);

    apiThrottle.recordLoginFailure(apiState, now);

    const loginState = loginThrottle.getOrCreateLoginAttemptState(
      "client-1",
      now + 1,
    );
    expect(loginState.client.attempts).toBe(0);
    expect(loginState.global.attempts).toBe(0);
    expect(store.entries().map(([key]) => key)).toEqual(
      expect.arrayContaining([
        "client:openai-compat-api:client-1",
        "global:openai-compat-api",
        "client:client-1",
        "global:login",
      ]),
    );
  });

  it("locks globally even when failures rotate across client keys", () => {
    const throttle = createLoginThrottle();
    const now = 15_000;

    for (let i = 0; i < kLoginGlobalMaxAttempts - 1; i += 1) {
      const state = throttle.getOrCreateLoginAttemptState(
        `client-${i}`,
        now + i,
      );
      const result = throttle.recordLoginFailure(state, now + i);
      expect(result.locked).toBe(false);
    }

    const finalState = throttle.getOrCreateLoginAttemptState(
      "fresh-client",
      now + kLoginGlobalMaxAttempts,
    );
    const lockResult = throttle.recordLoginFailure(
      finalState,
      now + kLoginGlobalMaxAttempts,
    );
    expect(lockResult.locked).toBe(true);

    const blockedState = throttle.getOrCreateLoginAttemptState(
      "another-fresh-client",
      now + kLoginGlobalMaxAttempts + 1,
    );
    const blocked = throttle.evaluateLoginThrottle(
      blockedState,
      now + kLoginGlobalMaxAttempts + 1,
    );
    expect(blocked.blocked).toBe(true);
  });

  it("cleans up stale states past TTL", () => {
    const throttle = createLoginThrottle();
    const oldNow = 20_000;
    throttle.getOrCreateLoginAttemptState("client-4", oldNow);

    vi.spyOn(Date, "now").mockReturnValue(oldNow + kLoginStateTtlMs + 1);
    throttle.cleanupLoginAttemptStates();

    const fresh = throttle.getOrCreateLoginAttemptState(
      "client-4",
      oldNow + kLoginStateTtlMs + 2,
    );
    expect(fresh.client.windowStart).toBe(oldNow + kLoginStateTtlMs + 2);
  });
});
