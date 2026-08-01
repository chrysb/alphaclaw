import { h } from "preact";
import htm from "htm";
import { UpdateActionButton } from "../update-action-button.js";
import { buildSafeModeBannerModel } from "./helpers.js";

const html = htm.bind(h);

export const WatchdogSafeModeBanner = ({
  watchdogStatus = null,
  onResumeChannels = () => {},
  resuming = false,
}) => {
  const model = buildSafeModeBannerModel(watchdogStatus);
  if (!model) return null;

  return html`
    <div class="bg-surface border border-yellow-500/40 rounded-xl p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span class="text-sm font-medium">${model.title}</span>
          </div>
          <p class="mt-1 text-sm text-muted">${model.body}</p>
        </div>
        <${UpdateActionButton}
          onClick=${onResumeChannels}
          loading=${resuming}
          disabled=${resuming}
          warning=${true}
          idleLabel="Resume channels"
          loadingLabel="Resuming..."
        />
      </div>
    </div>
  `;
};
