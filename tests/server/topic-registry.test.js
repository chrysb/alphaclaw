const fs = require("fs");

const topicRegistry = require("../../lib/server/topic-registry");

describe("server/topic-registry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters groups by account id with default fallback", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation((targetPath) => {
      if (targetPath === topicRegistry.kRegistryPath) {
        return JSON.stringify({
          groups: {
            "-100a": { name: "Default Group", topics: {} },
            "-100b": { name: "Mac Group", accountId: "mac", topics: {} },
          },
        });
      }
      throw new Error(`Unexpected path read: ${targetPath}`);
    });

    expect(Object.keys(topicRegistry.getGroupsForAccount("default"))).toEqual([
      "-100a",
    ]);
    expect(Object.keys(topicRegistry.getGroupsForAccount("mac"))).toEqual([
      "-100b",
    ]);
  });

  it("renders agent-scoped markdown by group ownership and topic routing", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation((targetPath) => {
      if (targetPath === topicRegistry.kRegistryPath) {
        return JSON.stringify({
          groups: {
            "-100owner": {
              name: "Owner Group",
              agentId: "scout",
              topics: {
                "1": { name: "General" },
                "2": { name: "Routed", agentId: "researcher" },
              },
            },
            "-100other": {
              name: "Other Group",
              agentId: "default",
              topics: {
                "3": { name: "Not Visible" },
                "4": { name: "Visible Topic", agentId: "scout" },
              },
            },
          },
        });
      }
      throw new Error(`Unexpected path read: ${targetPath}`);
    });

    const markdown = topicRegistry.renderTopicRegistryMarkdown({
      agentId: "scout",
    });
    expect(markdown).toContain("Owner Group (-100owner) | General | 1");
    expect(markdown).toContain("Owner Group (-100owner) | Routed | 2");
    expect(markdown).toContain("Other Group (-100other) | Visible Topic | 4");
    expect(markdown).not.toContain("Other Group (-100other) | Not Visible | 3");
  });

  it("returns empty markdown when no topics exist", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation((targetPath) => {
      if (targetPath === topicRegistry.kRegistryPath) {
        return JSON.stringify({
          groups: {
            "-100empty": {
              name: "Empty Workspace",
              accountId: "default",
              agentId: "default",
              topics: {},
            },
          },
        });
      }
      throw new Error(`Unexpected path read: ${targetPath}`);
    });

    const markdown = topicRegistry.renderTopicRegistryMarkdown({
      includeSyncGuidance: true,
    });
    expect(markdown).toBe("");
  });
});
