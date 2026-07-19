import { describe, expect, it } from "vitest";
import {
  getAgentIdFromSessionKey,
  getDestinationFromSession,
  getSessionChannelForIcon,
  getSessionDisplayLabel,
  getSessionKind,
  getSessionPriority,
  isDestinationSessionKey,
  kDestinationSessionFilter,
  parseChannelFromSessionKey,
  sortSessionsByPriority,
} from "../../lib/public/js/lib/session-keys.js";

describe("session-keys destination and sorting helpers", () => {
  it("extracts the agent id from a session key", () => {
    expect(getAgentIdFromSessionKey("agent:bob:telegram:direct:1")).toBe("bob");
    expect(getAgentIdFromSessionKey("main")).toBe("");
    expect(getAgentIdFromSessionKey("")).toBe("");
  });

  it("detects destination session keys", () => {
    expect(isDestinationSessionKey("agent:a:telegram:DIRECT:123")).toBe(true);
    expect(isDestinationSessionKey("agent:a:telegram:group:9")).toBe(true);
    expect(isDestinationSessionKey("agent:a:main")).toBe(false);
  });

  it("filters destination sessions by reply metadata or key shape", () => {
    expect(
      kDestinationSessionFilter({
        key: "agent:a:main",
        replyChannel: "telegram",
        replyTo: "42",
      }),
    ).toBe(true);
    expect(
      kDestinationSessionFilter({ key: "agent:a:telegram:direct:42" }),
    ).toBe(true);
    expect(kDestinationSessionFilter({ key: "agent:a:main" })).toBe(false);
    expect(kDestinationSessionFilter(null)).toBe(false);
  });

  it("prioritizes destination sessions ahead of others", () => {
    expect(getSessionPriority({ key: "agent:a:telegram:direct:1" })).toBe(0);
    expect(getSessionPriority({ key: "agent:a:main" })).toBe(1);
    expect(getSessionPriority(null)).toBe(1);
  });

  it("sorts by priority, recency, then key", () => {
    const sessions = [
      { key: "agent:a:main", updatedAt: 500 },
      { key: "agent:b:telegram:direct:2", updatedAt: 100 },
      { key: "agent:a:telegram:direct:1", updatedAt: 100 },
      { key: "agent:c:telegram:direct:3", updatedAt: 900 },
    ];
    expect(sortSessionsByPriority(sessions).map((row) => row.key)).toEqual([
      "agent:c:telegram:direct:3",
      "agent:a:telegram:direct:1",
      "agent:b:telegram:direct:2",
      "agent:a:main",
    ]);
    expect(sortSessionsByPriority()).toEqual([]);
    expect(sortSessionsByPriority("nope")).toEqual([]);
  });

  it("builds destinations from reply metadata", () => {
    expect(getDestinationFromSession({ replyChannel: "telegram" })).toBe(null);
    expect(getDestinationFromSession(null)).toBe(null);
    expect(
      getDestinationFromSession({
        key: "agent:bob:telegram:direct:7",
        replyChannel: "telegram",
        replyTo: "7",
      }),
    ).toEqual({ channel: "telegram", to: "7", agentId: "bob" });
    expect(
      getDestinationFromSession({
        key: "standalone",
        replyChannel: "slack",
        replyTo: "C123",
      }),
    ).toEqual({ channel: "slack", to: "C123" });
  });

  it("parses channels from session keys", () => {
    expect(parseChannelFromSessionKey("agent:a:telegram:direct:1")).toBe(
      "telegram",
    );
    expect(parseChannelFromSessionKey("agent:a:discord:direct:1")).toBe(
      "discord",
    );
    expect(parseChannelFromSessionKey("agent:a:slack:direct:C1")).toBe("slack");
    expect(parseChannelFromSessionKey("agent:a:main")).toBe("");
    expect(parseChannelFromSessionKey()).toBe("");
  });

  it("classifies session kinds", () => {
    expect(getSessionKind("")).toBe("other");
    expect(getSessionKind("main")).toBe("main");
    expect(getSessionKind("agent:a:telegram:group:9:topic:4")).toBe("topic");
    expect(getSessionKind("agent:a:slash:cmd")).toBe("slash");
    expect(getSessionKind("agent:a:subagent:x")).toBe("subagent");
    expect(getSessionKind("agent:a:discord:direct:1")).toBe("direct");
    expect(getSessionKind("agent:a:something")).toBe("other");
  });

  it("labels doctor and fallback sessions", () => {
    expect(getSessionDisplayLabel({ key: "agent:a:doctor:12" })).toBe(
      "Doctor Run #12",
    );
    expect(getSessionDisplayLabel({ key: "agent:a:doctor" })).toBe(
      "Doctor Run",
    );
    expect(getSessionDisplayLabel({ key: "agent:a:custom-session" })).toBe(
      "agent:a:custom-session",
    );
    expect(getSessionDisplayLabel(null)).toBe("Session");
    expect(getSessionDisplayLabel({ key: "agent:a:discord:direct:99" })).toBe(
      "Direct 99",
    );
    expect(getSessionDisplayLabel({ key: "agent:a:telegram:direct:99" })).toBe(
      "Direct message",
    );
  });

  it("resolves the channel icon source in preference order", () => {
    expect(
      getSessionChannelForIcon({ channel: "discord", replyChannel: "slack" }),
    ).toBe("discord");
    expect(getSessionChannelForIcon({ replyChannel: "slack" })).toBe("slack");
    expect(
      getSessionChannelForIcon({ key: "agent:a:telegram:direct:1" }),
    ).toBe("telegram");
    expect(getSessionChannelForIcon(null)).toBe("");
  });
});
