/**
 * Static tool catalog mirroring OpenClaw's tool-catalog.ts.
 * Grouped and labeled for the AlphaClaw Setup UI.
 */

export const kToolProfiles = ["minimal", "messaging", "coding", "full"];

export const kProfileLabels = {
  minimal: "Minimal",
  messaging: "Messaging",
  coding: "Coding",
  full: "Full",
};

const kTools = [
  {
    id: "read",
    label: "Read files",
    profiles: ["coding"],
    section: "filesystem",
  },
  {
    id: "edit",
    label: "Edit files",
    profiles: ["coding"],
    section: "filesystem",
  },
  {
    id: "write",
    label: "Write files",
    profiles: ["coding"],
    section: "filesystem",
  },
  {
    id: "apply_patch",
    label: "Apply patches",
    help: "Make targeted patch edits, mainly for OpenAI-compatible patch workflows.",
    profiles: ["coding"],
    section: "filesystem",
  },
  {
    id: "exec",
    label: "Run commands",
    help: "Execute shell commands inside the agent environment.",
    profiles: ["coding"],
    section: "execution",
  },
  {
    id: "process",
    label: "Manage processes",
    help: "Inspect and control long-running background processes.",
    profiles: ["coding"],
    section: "execution",
  },
  {
    id: "message",
    label: "Send messages",
    help: "Send outbound messages through configured messaging channels.",
    profiles: ["messaging"],
    section: "communication",
  },
  {
    id: "tts",
    label: "Text-to-speech",
    help: "Convert text responses into generated speech audio.",
    profiles: [],
    section: "communication",
  },
  {
    id: "browser",
    label: "Control browser",
    help: "Drive a browser for page navigation and interactive web tasks.",
    profiles: [],
    section: "web",
  },
  {
    id: "web_search",
    label: "Search the web",
    help: "Run web searches to discover external information.",
    profiles: [],
    section: "web",
  },
  {
    id: "web_fetch",
    label: "Fetch URLs",
    help: "Fetch and read webpage content from a specific URL.",
    profiles: [],
    section: "web",
  },
  {
    id: "memory_search",
    label: "Semantic search",
    help: "Search memory semantically to find related notes and prior context.",
    profiles: ["coding"],
    section: "memory",
  },
  {
    id: "memory_get",
    label: "Read memories",
    help: "Read stored memory files and saved context entries.",
    profiles: ["coding"],
    section: "memory",
  },
  {
    id: "agents_list",
    label: "List agents",
    help: "List known agent IDs that can be targeted in multi-agent flows.",
    profiles: [],
    section: "multiagent",
  },
  {
    id: "sessions_spawn",
    label: "Spawn sessions",
    help: "Start a new background session/run; this is the base primitive used by sub-agent workflows.",
    profiles: ["coding"],
    section: "multiagent",
  },
  {
    id: "sessions_send",
    label: "Send to session",
    help: "Send messages or tasks into an existing running session.",
    profiles: ["coding", "messaging"],
    section: "multiagent",
  },
  {
    id: "sessions_list",
    label: "List sessions",
    help: "List active or recent sessions available to the agent.",
    profiles: ["coding", "messaging"],
    section: "multiagent",
  },
  {
    id: "sessions_history",
    label: "Session history",
    help: "Read the transcript and prior exchanges from a session.",
    profiles: ["coding", "messaging"],
    section: "multiagent",
  },
  {
    id: "session_status",
    label: "Session status",
    help: "Check whether a session is running and inspect runtime health/state.",
    profiles: ["minimal", "coding", "messaging"],
    section: "multiagent",
  },
  {
    id: "subagents",
    label: "Sub-agents",
    help: "Launch specialized delegated agents (higher-level orchestration built on session spawning).",
    profiles: ["coding"],
    section: "multiagent",
  },
  {
    id: "cron",
    label: "Scheduled jobs",
    help: "Create and manage scheduled automation jobs.",
    profiles: ["coding"],
    section: "scheduling",
  },
  {
    id: "gateway",
    label: "Gateway control",
    help: "Inspect and control the running Gateway service (status, health, and control actions like restart).",
    profiles: [],
    section: "scheduling",
  },
  {
    id: "image",
    label: "Generate images",
    help: "Generate or analyze images with image-capable model tools.",
    profiles: ["coding"],
    section: "creative",
  },
  {
    id: "canvas",
    label: "Visual canvas",
    help: "Control the Canvas panel (present, navigate, eval, snapshot). Primarily a macOS app capability when a canvas-capable node is connected.",
    profiles: [],
    section: "creative",
  },
  {
    id: "nodes",
    label: "Node workflows",
    help: "Use paired device/node capabilities (for example canvas, camera, notifications, and system actions).",
    profiles: [],
    section: "creative",
  },
];

export const kSections = [
  {
    id: "filesystem",
    label: "Filesystem",
    description: "Read, edit, and write files",
  },
  {
    id: "execution",
    label: "Execution",
    description: "Run shell commands and scripts",
  },
  {
    id: "communication",
    label: "Communication",
    description: "Send messages across Telegram, Slack, Discord",
  },
  {
    id: "web",
    label: "Web & Browser",
    description: "Browse pages, search the web, fetch URLs",
  },
  {
    id: "memory",
    label: "Memory",
    description:
      "Semantic search and retrieval across the agent's stored knowledge",
  },
  {
    id: "multiagent",
    label: "Multi-Agent",
    description:
      "List agents, spawn sessions, send messages between agents. Orchestrate sub-agents.",
  },
  {
    id: "scheduling",
    label: "Scheduling",
    description: "Create and manage scheduled jobs",
  },
  {
    id: "creative",
    label: "Creative",
    description: "Generate images, visual canvas, node-based workflows",
  },
];

export const getToolsForSection = (sectionId) =>
  kTools.filter((t) => t.section === sectionId);

export const getAllToolIds = () => kTools.map((t) => t.id);

export const getProfileToolIds = (profileId) => {
  if (profileId === "full") return kTools.map((t) => t.id);
  return kTools.filter((t) => t.profiles.includes(profileId)).map((t) => t.id);
};

/**
 * Given a profile + alsoAllow + deny, resolve whether each tool is enabled.
 */
export const resolveToolStates = ({
  profile = "full",
  alsoAllow = [],
  deny = [],
}) => {
  const profileTools = new Set(getProfileToolIds(profile));
  const alsoAllowSet = new Set(alsoAllow);
  const denySet = new Set(deny);

  return kTools.map((tool) => {
    const inProfile = profileTools.has(tool.id);
    const isDenied = denySet.has(tool.id);
    const isAlsoAllowed = alsoAllowSet.has(tool.id);
    const enabled = isDenied ? false : inProfile || isAlsoAllowed;

    return { ...tool, enabled, inProfile, isDenied, isAlsoAllowed };
  });
};

/**
 * Derive the minimal tools config from the resolved tool states
 * relative to the selected profile.
 */
export const deriveToolsConfig = ({ profile, toolStates }) => {
  const profileTools = new Set(getProfileToolIds(profile));
  const alsoAllow = [];
  const deny = [];

  for (const tool of toolStates) {
    const inProfile = profileTools.has(tool.id);
    if (tool.enabled && !inProfile) {
      alsoAllow.push(tool.id);
    } else if (!tool.enabled && inProfile) {
      deny.push(tool.id);
    }
  }

  const config = { profile };
  if (alsoAllow.length) config.alsoAllow = alsoAllow;
  if (deny.length) config.deny = deny;
  return config;
};
