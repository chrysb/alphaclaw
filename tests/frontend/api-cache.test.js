import { describe, expect, it, vi } from "vitest";
import {
  cachedFetch,
  getCached,
  invalidateCache,
  setCached,
} from "../../lib/public/js/lib/api-cache.js";

// The cache is module-level state, so every test uses its own key.

describe("frontend/api-cache", () => {
  it("gets, sets, and invalidates cache entries", () => {
    expect(getCached("")).toBe(null);
    expect(getCached("never-set")).toBe(null);

    expect(setCached("basic-key", { a: 1 })).toEqual({ a: 1 });
    expect(getCached("basic-key")).toEqual({ a: 1 });

    // Empty keys are no-ops that pass data through.
    expect(setCached("", "ignored")).toBe("ignored");
    expect(getCached("")).toBe(null);

    invalidateCache("basic-key");
    expect(getCached("basic-key")).toBe(null);
    expect(invalidateCache("")).toBeUndefined();
  });

  it("bypasses caching for empty keys or non-function fetchers", async () => {
    const fetcher = vi.fn(async () => "direct");
    await expect(cachedFetch("", fetcher)).resolves.toBe("direct");
    expect(fetcher).toHaveBeenCalledTimes(1);

    await expect(cachedFetch("bad-fetcher-key", null)).rejects.toThrow();
  });

  it("returns fresh entries without refetching", async () => {
    setCached("fresh-key", "cached-value");
    const fetcher = vi.fn(async () => "new-value");
    await expect(
      cachedFetch("fresh-key", fetcher, { maxAgeMs: 60000 }),
    ).resolves.toBe("cached-value");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("serves stale data while revalidating in the background once", async () => {
    setCached("swr-key", "stale-value");
    let resolveFetch;
    const fetcher = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const onRevalidate = vi.fn();

    await expect(
      cachedFetch("swr-key", fetcher, { maxAgeMs: 0, onRevalidate }),
    ).resolves.toBe("stale-value");

    // A second stale read while the revalidation is in flight does not
    // schedule another fetch.
    await expect(
      cachedFetch("swr-key", fetcher, { maxAgeMs: 0 }),
    ).resolves.toBe("stale-value");
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    resolveFetch("fresh-value");
    await vi.waitFor(() =>
      expect(onRevalidate).toHaveBeenCalledWith("fresh-value"),
    );
    expect(getCached("swr-key")).toBe("fresh-value");
  });

  it("revalidates stale data without an onRevalidate callback", async () => {
    setCached("swr-silent-key", "old");
    const fetcher = vi.fn(async () => "new");

    await expect(
      cachedFetch("swr-silent-key", fetcher, { maxAgeMs: 0 }),
    ).resolves.toBe("old");
    await vi.waitFor(() => expect(getCached("swr-silent-key")).toBe("new"));
  });

  it("refetches stale entries when staleWhileRevalidate is off", async () => {
    setCached("no-swr-key", "old");
    const fetcher = vi.fn(async () => "new");

    await expect(
      cachedFetch("no-swr-key", fetcher, {
        maxAgeMs: 0,
        staleWhileRevalidate: false,
      }),
    ).resolves.toBe("new");
    expect(getCached("no-swr-key")).toBe("new");
  });

  it("forces a refetch past a fresh cache entry", async () => {
    setCached("force-key", "old");
    const fetcher = vi.fn(async () => "forced");

    await expect(
      cachedFetch("force-key", fetcher, { maxAgeMs: 60000, force: true }),
    ).resolves.toBe("forced");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent uncached fetches", async () => {
    let resolveFetch;
    const fetcher = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const otherFetcher = vi.fn(async () => "should-not-run");

    const firstPromise = cachedFetch("inflight-key", fetcher);
    const secondPromise = cachedFetch("inflight-key", otherFetcher);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    resolveFetch("shared-result");

    await expect(firstPromise).resolves.toBe("shared-result");
    await expect(secondPromise).resolves.toBe("shared-result");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(otherFetcher).not.toHaveBeenCalled();
    expect(getCached("inflight-key")).toBe("shared-result");
  });
});
