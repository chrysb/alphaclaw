import { h } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { showToast } from "../toast.js";
import * as api from "../../lib/telegram-api.js";
import {
  StepIndicator,
  VerifyBotStep,
  CreateGroupStep,
  AddBotStep,
  TopicsStep,
  SummaryStep,
} from "./onboarding.js";
import { ManageTelegramWorkspace } from "./manage.js";

const html = htm.bind(h);

const kSteps = [
  { id: "verify-bot", label: "Verify Bot" },
  { id: "create-group", label: "Create Group" },
  { id: "add-bot", label: "Add Bot" },
  { id: "topics", label: "Topics" },
  { id: "summary", label: "Summary" },
];

import {
  kTelegramWorkspaceStorageKey,
  kTelegramWorkspaceCacheKey,
} from "../../lib/storage-keys.js";

const resolveStorageKey = (baseKey, accountId) => {
  const suffix = String(accountId || "").trim();
  if (!suffix || suffix === "default") return baseKey;
  return `${baseKey}.${suffix}`;
};

const loadTelegramWorkspaceState = (accountId) => {
  try {
    const raw = window.localStorage.getItem(resolveStorageKey(kTelegramWorkspaceStorageKey, accountId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};
const saveTelegramWorkspaceState = (accountId, state) => {
  try {
    window.localStorage.setItem(
      resolveStorageKey(kTelegramWorkspaceStorageKey, accountId),
      JSON.stringify(state),
    );
  } catch {}
};
const removeTelegramWorkspaceState = (accountId) => {
  try {
    window.localStorage.removeItem(resolveStorageKey(kTelegramWorkspaceStorageKey, accountId));
  } catch {}
};
const loadTelegramWorkspaceCache = (accountId) => {
  try {
    const raw = window.localStorage.getItem(resolveStorageKey(kTelegramWorkspaceCacheKey, accountId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const data = parsed?.data;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
};
const saveTelegramWorkspaceCache = (accountId, data) => {
  try {
    window.localStorage.setItem(
      resolveStorageKey(kTelegramWorkspaceCacheKey, accountId),
      JSON.stringify({ cachedAt: Date.now(), data }),
    );
  } catch {}
};
const removeTelegramWorkspaceCache = (accountId) => {
  try {
    window.localStorage.removeItem(resolveStorageKey(kTelegramWorkspaceCacheKey, accountId));
  } catch {}
};

const BackButton = ({ onBack }) => html`
  <button
    onclick=${onBack}
    class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path
        d="M10.354 3.354a.5.5 0 00-.708-.708l-5 5a.5.5 0 000 .708l5 5a.5.5 0 00.708-.708L5.707 8l4.647-4.646z"
      />
    </svg>
    Back
  </button>
`;

const MultiGroupView = ({
  accountId,
  groups,
  concurrency,
  debugEnabled,
  onResetOnboarding,
}) => {
  const [expandedGroupId, setExpandedGroupId] = useState(
    () => groups[0]?.groupId || "",
  );

  const toggle = (gId) =>
    setExpandedGroupId((current) => (current === gId ? "" : gId));

  return html`
    <div class="space-y-3">
      ${groups.map(
        (g) => html`
          <div
            key=${g.groupId}
            class="border border-border rounded-lg overflow-hidden"
          >
            <button
              onclick=${() => toggle(g.groupId)}
              class="w-full flex items-center justify-between px-3 py-2.5 bg-black/20 hover:bg-black/30 transition-colors text-left"
            >
              <div>
                <p class="text-sm text-gray-300 font-medium">
                  ${g.groupName || g.groupId}
                </p>
                <p class="text-[11px] text-gray-500 font-mono">${g.groupId}</p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                class="text-gray-500 transition-transform ${expandedGroupId ===
                g.groupId
                  ? "rotate-180"
                  : ""}"
              >
                <path
                  d="M4.354 5.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 00-.708-.708L8 9.293 4.354 5.646z"
                />
              </svg>
            </button>
            ${expandedGroupId === g.groupId &&
            html`
              <div class="p-3 border-t border-border">
                <${ManageTelegramWorkspace}
                  accountId=${accountId}
                  groupId=${g.groupId}
                  groupName=${g.groupName}
                  initialTopics=${g.topics}
                  configAgentMaxConcurrent=${concurrency?.agentMaxConcurrent}
                  configSubagentMaxConcurrent=${concurrency?.subagentMaxConcurrent}
                  debugEnabled=${debugEnabled}
                  onResetOnboarding=${onResetOnboarding}
                />
              </div>
            `}
          </div>
        `,
      )}
    </div>
  `;
};

export const TelegramWorkspace = ({ accountId = "default", onBack }) => {
  const initialState = loadTelegramWorkspaceState(accountId);
  const cachedWorkspace = loadTelegramWorkspaceCache(accountId);
  const [step, setStep] = useState(() => {
    const value = Number.parseInt(String(initialState.step ?? 0), 10);
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), kSteps.length - 1);
  });
  const [botInfo, setBotInfo] = useState(null);
  const [groupId, setGroupId] = useState(initialState.groupId || "");
  const [groupInfo, setGroupInfo] = useState(initialState.groupInfo || null);
  const [verifyGroupError, setVerifyGroupError] = useState(
    initialState.verifyGroupError || null,
  );
  const [allowUserId, setAllowUserId] = useState(
    initialState.allowUserId || "",
  );
  const [topics, setTopics] = useState(initialState.topics || {});
  const [workspaceConfig, setWorkspaceConfig] = useState(() => ({
    ready: !!cachedWorkspace,
    configured: !!cachedWorkspace?.configured,
    groups: cachedWorkspace?.groups || [],
    groupId: cachedWorkspace?.groupId || "",
    groupName: cachedWorkspace?.groupName || "",
    topics: cachedWorkspace?.topics || {},
    debugEnabled: !!cachedWorkspace?.debugEnabled,
    concurrency: cachedWorkspace?.concurrency || {
      agentMaxConcurrent: null,
      subagentMaxConcurrent: null,
    },
  }));

  const goNext = () => setStep((s) => Math.min(kSteps.length - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const resetOnboarding = async () => {
    try {
      const data = await api.resetWorkspace({ accountId });
      if (!data.ok) throw new Error(data.error || "Failed to reset onboarding");
      removeTelegramWorkspaceState(accountId);
      removeTelegramWorkspaceCache(accountId);
      setStep(0);
      setBotInfo(null);
      setGroupId("");
      setGroupInfo(null);
      setVerifyGroupError(null);
      setAllowUserId("");
      setTopics({});
      setWorkspaceConfig({
        ready: true,
        configured: false,
        groups: [],
        groupId: "",
        groupName: "",
        topics: {},
        debugEnabled: !!workspaceConfig?.debugEnabled,
        concurrency: { agentMaxConcurrent: null, subagentMaxConcurrent: null },
      });
      showToast("Telegram onboarding reset", "success");
    } catch (e) {
      showToast(e.message || "Failed to reset onboarding", "error");
    }
  };
  const handleDone = () => {
    removeTelegramWorkspaceState(accountId);
    const doneGroupName = groupInfo?.chat?.title || groupId;
    saveTelegramWorkspaceCache(accountId, {
      ready: true,
      configured: true,
      groups: [{ groupId, groupName: doneGroupName, topics: topics || {} }],
      groupId,
      groupName: doneGroupName,
      topics: topics || {},
      debugEnabled: !!workspaceConfig?.debugEnabled,
      concurrency: workspaceConfig?.concurrency || {
        agentMaxConcurrent: null,
        subagentMaxConcurrent: null,
      },
    });
    window.location.reload();
  };

  useEffect(() => {
    saveTelegramWorkspaceState(accountId, {
      step,
      groupId,
      groupInfo,
      verifyGroupError,
      allowUserId,
      topics,
    });
  }, [
    accountId,
    step,
    groupId,
    groupInfo,
    verifyGroupError,
    allowUserId,
    topics,
  ]);

  useEffect(() => {
    let active = true;
    const bootstrapWorkspace = async () => {
      try {
        const data = await api.workspace({ accountId });
        if (!active || !data?.ok) return;
        const groups = Array.isArray(data.groups) ? data.groups : [];
        if (!data.configured || groups.length === 0) {
          const nextConfig = {
            ready: true,
            configured: false,
            groups: [],
            groupId: "",
            groupName: "",
            topics: {},
            debugEnabled: !!data?.debugEnabled,
            concurrency: {
              agentMaxConcurrent: null,
              subagentMaxConcurrent: null,
            },
          };
          setWorkspaceConfig(nextConfig);
          saveTelegramWorkspaceCache(accountId, nextConfig);
          return;
        }
        const first = groups[0];
        const nextConfig = {
          ready: true,
          configured: true,
          groups,
          groupId: first.groupId,
          groupName: first.groupName || first.groupId,
          topics: first.topics || {},
          debugEnabled: !!data.debugEnabled,
          concurrency: data.concurrency || {
            agentMaxConcurrent: null,
            subagentMaxConcurrent: null,
          },
        };
        setWorkspaceConfig(nextConfig);
        saveTelegramWorkspaceCache(accountId, nextConfig);
        setGroupId(first.groupId);
        setTopics(first.topics || {});
        setGroupInfo({
          chat: {
            id: first.groupId,
            title: first.groupName || first.groupId,
            isForum: true,
          },
          bot: {
            status: "administrator",
            isAdmin: true,
            canManageTopics: true,
          },
        });
        setVerifyGroupError(null);
        setAllowUserId("");
        setStep((currentStep) => (currentStep < 3 ? 3 : currentStep));
      } catch {}
    };
    bootstrapWorkspace();
    return () => {
      active = false;
    };
  }, [accountId]);

  return html`
    <div class="space-y-4">
      <${BackButton} onBack=${onBack} />
      <div class="bg-surface border border-border rounded-xl p-4">
        ${!workspaceConfig.ready
          ? html`
              <div class="min-h-[220px] flex items-center justify-center">
                <p class="text-sm text-gray-500">Loading workspace...</p>
              </div>
            `
          : workspaceConfig.configured
            ? html`
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <img
                      src="/assets/icons/telegram.svg"
                      alt=""
                      class="w-5 h-5"
                    />
                    <h2 class="font-semibold text-sm">
                      Manage Telegram Workspace
                    </h2>
                  </div>
                </div>
                ${(workspaceConfig.groups || []).length <= 1
                  ? html`
                      <${ManageTelegramWorkspace}
                        accountId=${accountId}
                        groupId=${workspaceConfig.groupId}
                        groupName=${workspaceConfig.groupName}
                        initialTopics=${workspaceConfig.topics}
                        configAgentMaxConcurrent=${workspaceConfig.concurrency
                          ?.agentMaxConcurrent}
                        configSubagentMaxConcurrent=${workspaceConfig.concurrency
                          ?.subagentMaxConcurrent}
                        debugEnabled=${workspaceConfig.debugEnabled}
                        onResetOnboarding=${resetOnboarding}
                      />
                    `
                  : html`
                      <${MultiGroupView}
                        accountId=${accountId}
                        groups=${workspaceConfig.groups}
                        concurrency=${workspaceConfig.concurrency}
                        debugEnabled=${workspaceConfig.debugEnabled}
                        onResetOnboarding=${resetOnboarding}
                      />
                    `}
              `
            : html`
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <img
                      src="/assets/icons/telegram.svg"
                      alt=""
                      class="w-5 h-5"
                    />
                    <h2 class="font-semibold text-sm">
                      Set Up Telegram Workspace
                    </h2>
                  </div>
                  <span class="text-xs text-gray-500"
                    >Step ${step + 1} of ${kSteps.length}</span
                  >
                </div>

                <${StepIndicator} currentStep=${step} steps=${kSteps} />

                ${step === 0 &&
                html`
                  <${VerifyBotStep}
                    accountId=${accountId}
                    botInfo=${botInfo}
                    setBotInfo=${setBotInfo}
                    onNext=${goNext}
                  />
                `}
                ${step === 1 &&
                html`
                  <${CreateGroupStep} onNext=${goNext} onBack=${goBack} />
                `}
                ${step === 2 &&
                html`
                  <${AddBotStep}
                    accountId=${accountId}
                    groupId=${groupId}
                    setGroupId=${setGroupId}
                    groupInfo=${groupInfo}
                    setGroupInfo=${setGroupInfo}
                    userId=${allowUserId}
                    setUserId=${setAllowUserId}
                    verifyGroupError=${verifyGroupError}
                    setVerifyGroupError=${setVerifyGroupError}
                    onNext=${goNext}
                    onBack=${goBack}
                  />
                `}
                ${step === 3 &&
                html`
                  <${TopicsStep}
                    accountId=${accountId}
                    groupId=${groupId}
                    topics=${topics}
                    setTopics=${setTopics}
                    onNext=${goNext}
                    onBack=${goBack}
                  />
                `}
                ${step === 4 &&
                html`
                  <${SummaryStep}
                    groupId=${groupId}
                    groupInfo=${groupInfo}
                    topics=${topics}
                    onBack=${goBack}
                    onDone=${handleDone}
                  />
                `}
              `}
      </div>
    </div>
  `;
};
