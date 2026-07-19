const fs = require("fs");

const topicRegistry = require("../../lib/server/topic-registry");

const mockRegistryFile = (registry) => {
  vi.spyOn(fs, "readFileSync").mockImplementation((targetPath) => {
    if (targetPath === topicRegistry.kRegistryPath) {
      return JSON.stringify(registry);
    }
    throw new Error(`Unexpected path read: ${targetPath}`);
  });
};

const mockRegistryWrites = () => {
  const writes = [];
  vi.spyOn(fs, "mkdirSync").mockImplementation(() => {});
  vi.spyOn(fs, "writeFileSync").mockImplementation((targetPath, data) => {
    writes.push({ targetPath, data: JSON.parse(data) });
  });
  return writes;
};

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

  it("falls back to an empty registry when the file is unreadable", () => {
    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("ENOENT");
    });
    expect(topicRegistry.readRegistry()).toEqual({ groups: {} });
  });

  it("writes the registry to the workspace dir", () => {
    const writes = mockRegistryWrites();
    topicRegistry.writeRegistry({ groups: { "-1": { name: "G", topics: {} } } });
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(writes).toEqual([
      {
        targetPath: topicRegistry.kRegistryPath,
        data: { groups: { "-1": { name: "G", topics: {} } } },
      },
    ]);
  });

  it("returns a group or null from getGroup", () => {
    mockRegistryFile({ groups: { "-1": { name: "G", topics: { 3: {} } } } });
    expect(topicRegistry.getGroup("-1")).toEqual({
      name: "G",
      topics: { 3: {} },
    });
    expect(topicRegistry.getGroup("-2")).toBeNull();
  });

  it("creates a new group with defaults in setGroup", () => {
    mockRegistryFile({ groups: {} });
    const writes = mockRegistryWrites();
    const registry = topicRegistry.setGroup("-1", { accountId: "work" });
    expect(registry.groups["-1"]).toEqual({
      name: "-1",
      accountId: "work",
      topics: {},
    });
    expect(writes[0].data.groups["-1"].accountId).toBe("work");
  });

  it("merges group data while preserving existing topics in setGroup", () => {
    mockRegistryFile({
      groups: { "-1": { name: "Old", topics: { 5: { name: "T" } } } },
    });
    mockRegistryWrites();
    const registry = topicRegistry.setGroup("-1", { name: "New" });
    expect(registry.groups["-1"]).toEqual({
      name: "New",
      topics: { 5: { name: "T" } },
    });
  });

  it("defaults missing topics container in setGroup", () => {
    mockRegistryFile({ groups: { "-1": { name: "Old" } } });
    mockRegistryWrites();
    const registry = topicRegistry.setGroup("-1", { name: "New" });
    expect(registry.groups["-1"].topics).toEqual({});
  });

  it("treats a non-object groups value as empty in getGroupsForAccount", () => {
    mockRegistryFile({ groups: null });
    expect(topicRegistry.getGroupsForAccount("default")).toEqual({});
  });

  it("adds topics, creating group and topics containers as needed", () => {
    mockRegistryFile({ groups: {} });
    mockRegistryWrites();
    const registry = topicRegistry.addTopic("-1", 9, { name: "Fresh" });
    expect(registry.groups["-1"]).toEqual({
      name: "-1",
      topics: { 9: { name: "Fresh" } },
    });
  });

  it("repairs a corrupt topics container in addTopic", () => {
    mockRegistryFile({ groups: { "-1": { name: "G", topics: "corrupt" } } });
    mockRegistryWrites();
    const registry = topicRegistry.addTopic("-1", 9, { name: "Fresh" });
    expect(registry.groups["-1"].topics).toEqual({ 9: { name: "Fresh" } });
  });

  it("merges topic data over existing entries in updateTopic", () => {
    mockRegistryFile({
      groups: {
        "-1": { name: "G", topics: { 9: { name: "Old", agentId: "scout" } } },
      },
    });
    mockRegistryWrites();
    const registry = topicRegistry.updateTopic("-1", 9, { name: "New" });
    expect(registry.groups["-1"].topics["9"]).toEqual({
      name: "New",
      agentId: "scout",
    });
  });

  it("creates group and topics containers in updateTopic when missing", () => {
    mockRegistryFile({ groups: {} });
    mockRegistryWrites();
    const registry = topicRegistry.updateTopic("-1", 9, { name: "New" });
    expect(registry.groups["-1"]).toEqual({
      name: "-1",
      topics: { 9: { name: "New" } },
    });
  });

  it("repairs a corrupt topics container in updateTopic", () => {
    mockRegistryFile({ groups: { "-1": { name: "G", topics: 42 } } });
    mockRegistryWrites();
    const registry = topicRegistry.updateTopic("-1", 9, { name: "New" });
    expect(registry.groups["-1"].topics).toEqual({ 9: { name: "New" } });
  });

  it("removes topics and tolerates missing groups in removeTopic", () => {
    mockRegistryFile({
      groups: { "-1": { name: "G", topics: { 9: { name: "T" } } } },
    });
    mockRegistryWrites();
    const registry = topicRegistry.removeTopic("-1", 9);
    expect(registry.groups["-1"].topics).toEqual({});

    const unchanged = topicRegistry.removeTopic("-404", 9);
    expect(unchanged.groups["-1"].topics).toEqual({ 9: { name: "T" } });
  });

  it("counts topics across groups, tolerating missing topic maps", () => {
    mockRegistryFile({
      groups: {
        "-1": { name: "A", topics: { 1: {}, 2: {} } },
        "-2": { name: "B" },
        "-3": { name: "C", topics: { 3: {} } },
      },
    });
    expect(topicRegistry.getTotalTopicCount()).toBe(3);
  });

  it("returns no agent topics when groups container is invalid", () => {
    mockRegistryFile({ groups: "corrupt" });
    expect(topicRegistry.getTopicsForAgent("scout")).toEqual([]);
  });

  it("falls back to group id and default agent in getTopicsForAgent", () => {
    mockRegistryFile({
      groups: {
        "-1": {
          name: "   ",
          topics: { 1: { name: "General" } },
        },
        "-2": { name: "Bad Topics", agentId: "default", topics: "corrupt" },
      },
    });
    expect(topicRegistry.getTopicsForAgent("")).toEqual([
      {
        groupName: "-1",
        groupId: "-1",
        topicName: "General",
        threadId: "1",
        groupAgentId: "default",
        topicAgentId: "",
      },
    ]);
  });

  it("renders unscoped markdown with sync guidance", () => {
    mockRegistryFile({
      groups: {
        "-1": { topics: { 7: { name: "Ops" } } },
        "-2": { name: "No Topics" },
      },
    });
    const markdown = topicRegistry.renderTopicRegistryMarkdown({
      includeSyncGuidance: true,
    });
    expect(markdown).toContain("| -1 (-1) | Ops | 7 |");
    expect(markdown).toContain("### Sync Rules");
    expect(markdown).toContain("alphaclaw telegram topic add");
  });

  it("renders unscoped markdown without sync guidance", () => {
    mockRegistryFile({
      groups: { "-1": { name: "Named", topics: { 7: { name: "Ops" } } } },
    });
    const markdown = topicRegistry.renderTopicRegistryMarkdown();
    expect(markdown).toContain("| Named (-1) | Ops | 7 |");
    expect(markdown).not.toContain("### Sync Rules");
    expect(markdown.endsWith("\n")).toBe(true);
  });

  it("returns empty markdown for an agent with no visible topics", () => {
    mockRegistryFile({
      groups: {
        "-1": {
          name: "G",
          agentId: "other",
          topics: { 7: { name: "Hidden" } },
        },
      },
    });
    expect(
      topicRegistry.renderTopicRegistryMarkdown({ agentId: "scout" }),
    ).toBe("");
  });
});
