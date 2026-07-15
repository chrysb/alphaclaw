import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import htm from "htm";
import { LoadingSpinner } from "../loading-spinner.js";
import { fetchOnboardProgress } from "../../lib/api.js";

const html = htm.bind(h);
const kSetupTips = [
  {
    label: "🛡️ Safety tip",
    text: "Be careful what you give access to. Read access is always safer than write access.",
  },
  {
    label: "🧠 Best practice",
    text: "Trust but verify. Your agent may not always know what it's doing, so check the results.",
  },
  {
    label: "💡 Idea",
    text: "Ask your agent to create a morning briefing for you.",
  },
  {
    label: "🧠 Best practice",
    text: "Ask your agent to review its own code and make sure it's doing what you want it to do.",
  },
  {
    label: "💡 Idea",
    text: "Tell your agent to review the latest news and provide a summary.",
  },
  {
    label: "🛡️ Safety tip",
    text: "Be incredibly careful installing skills from the internet - they may contain malicious code.",
  },
];
const kDefaultProgress = {
  stage: "creating_repo",
  message: "Creating repo...",
};
const kProgressStepNumbers = {
  creating_repo: 1,
  running_openclaw_onboard: 2,
  initial_git_push: 3,
  starting_gateway: 4,
};
const kProgressPollIntervalMs = 500;
const kProgressDotsIntervalMs = 450;
const kProgressDotSlots = [1, 2, 3];

export const WelcomeSetupStep = ({ error, loading, onRetry, onBack }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(kDefaultProgress);
  const [progressDotCount, setProgressDotCount] = useState(1);

  useEffect(() => {
    if (error || !loading) return;
    const timer = setInterval(() => {
      setTipIndex((idx) => (idx + 1) % kSetupTips.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [error, loading]);

  useEffect(() => {
    if (error || !loading) return;
    let cancelled = false;
    const refreshProgress = async () => {
      try {
        const progress = await fetchOnboardProgress();
        if (!cancelled && progress?.message) {
          setProgress(progress);
        }
      } catch {}
    };
    setProgress(kDefaultProgress);
    refreshProgress();
    const timer = setInterval(refreshProgress, kProgressPollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [error, loading]);

  useEffect(() => {
    if (error || !loading) return;
    setProgressDotCount(1);
    const timer = setInterval(() => {
      setProgressDotCount((count) => (count % 3) + 1);
    }, kProgressDotsIntervalMs);
    return () => clearInterval(timer);
  }, [error, loading]);

  if (error) {
    return html`
      <div class="py-4 flex flex-col items-center text-center gap-3">
        <h3 class="text-lg font-semibold text-body">Setup failed</h3>
        <p class="text-sm text-fg-muted">Fix the values and try again.</p>
      </div>
      <div
        class="bg-status-error-bg border border-status-error-border rounded-xl p-3 text-status-error text-sm"
      >
        ${error}
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          onclick=${onBack}
          disabled=${loading}
          class="w-full text-sm font-medium px-4 py-3 rounded-xl transition-all ac-btn-secondary ${loading
            ? "opacity-50 cursor-not-allowed"
            : ""}"
        >
          Back
        </button>
        <button
          onclick=${onRetry}
          disabled=${loading}
          class="w-full text-sm font-medium px-4 py-3 rounded-xl transition-all ac-btn-cyan ${loading
            ? "opacity-50 cursor-not-allowed"
            : ""}"
        >
          ${loading ? "Retrying..." : "Retry"}
        </button>
      </div>
    `;
  }

  const currentTip = kSetupTips[tipIndex];
  const progressStep = kProgressStepNumbers[progress.stage] || 1;
  const progressLabel = (progress.message || kDefaultProgress.message).replace(/\.{1,3}$/, "");

  return html`
    <div class="relative min-h-[320px] pt-4 pb-20 flex">
      <div
        class="flex-1 flex flex-col items-center justify-center text-center gap-4"
      >
        <${LoadingSpinner} className="h-8 w-8 text-body" />
        <h3 class="text-lg font-semibold text-body">Initializing AlphaClaw...</h3>
        <p class="text-sm text-fg-muted">
          ${progressStep} / 4: ${progressLabel}<span class="inline-flex" aria-hidden="true"
            >${kProgressDotSlots.map(
              (slot) => html`<span style=${{ visibility: slot <= progressDotCount ? "visible" : "hidden" }}
                >.</span
              >`,
            )}</span
          >
        </p>
        <p class="text-xs text-fg-muted">This could take up to 30 seconds</p>
      </div>
      <div
        class="absolute bottom-3 left-3 right-3 bg-field border border-border rounded-lg px-3 py-2 text-xs text-fg-muted"
      >
        <span class="text-fg-muted">${currentTip.label}: </span>
        ${currentTip.text}
      </div>
    </div>
  `;
};
