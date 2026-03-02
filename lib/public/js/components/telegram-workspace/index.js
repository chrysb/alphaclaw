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

const kTelegramWorkspaceStorageKey = "telegram-workspace-state-v1";
const kTelegramWorkspaceCacheKey = "telegram-workspace-cache-v1";
const loadTelegramWorkspaceState = () => {
  try {
    const raw = window.localStorage.getItem(kTelegramWorkspaceStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};
const loadTelegramWorkspaceCache = () => {
  try {
    const raw = window.localStorage.getItem(kTelegramWorkspaceCacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const data = parsed?.data;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
};
const saveTelegramWorkspaceCache = (data) => {
  try {
    window.localStorage.setItem(
      kTelegramWorkspaceCacheKey,
      JSON.stringify({ cachedAt: Date.now(), data }),
    );
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

export const TelegramWorkspace = ({ onBack }) => {
  const initialState = loadTelegramWorkspaceState();
  const cachedWorkspace = loadTelegramWorkspaceCache();
  const [step, setStep] = useState(() => {
    const value = Number.parseInt(String(initialState.step ?? 0), 10);
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), kSteps.length - 1);
  });
  const [botInfo, setBotInfo] = useState(initialState.botInfo || null);
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
      const data = await api.resetWorkspace();
      if (!data.ok) throw new Error(data.error || "Failed to reset onboarding");
      try {
        window.localStorage.removeItem(kTelegramWorkspaceStorageKey);
        window.localStorage.removeItem(kTelegramWorkspaceCacheKey);
      } catch {}
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
    try {
      window.localStorage.removeItem(kTelegramWorkspaceStorageKey);
      window.localStorage.setItem(
        kTelegramWorkspaceCacheKey,
        JSON.stringify({
          cachedAt: Date.now(),
          data: {
            ready: true,
            configured: true,
            groupId,
            groupName: groupInfo?.chat?.title || groupId,
            topics: topics || {},
            debugEnabled: !!workspaceConfig?.debugEnabled,
            concurrency: workspaceConfig?.concurrency || {
              agentMaxConcurrent: null,
              subagentMaxConcurrent: null,
            },
          },
        }),
      );
    } catch {}
    window.location.reload();
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(
        kTelegramWorkspaceStorageKey,
        JSON.stringify({
          step,
          botInfo,
          groupId,
          groupInfo,
          verifyGroupError,
          allowUserId,
          topics,
        }),
      );
    } catch {}
  }, [
    step,
    botInfo,
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
        const data = await api.workspace();
        if (!active || !data?.ok) return;
        if (!data.configured || !data.groupId) {
          const nextConfig = {
            ready: true,
            configured: false,
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
          saveTelegramWorkspaceCache(nextConfig);
          return;
        }
        const nextConfig = {
          ready: true,
          configured: true,
          groupId: data.groupId,
          groupName: data.groupName || data.groupId,
          topics: data.topics || {},
          debugEnabled: !!data.debugEnabled,
          concurrency: data.concurrency || {
            agentMaxConcurrent: null,
            subagentMaxConcurrent: null,
          },
        };
        setWorkspaceConfig(nextConfig);
        saveTelegramWorkspaceCache(nextConfig);
        setGroupId(data.groupId);
        setTopics(data.topics || {});
        setGroupInfo({
          chat: {
            id: data.groupId,
            title: data.groupName || data.groupId,
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
  }, []);

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
                <${ManageTelegramWorkspace}
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
