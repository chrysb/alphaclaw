import { h } from "preact";
import htm from "htm";
import { UpdateActionButton } from "./update-action-button.js";
import { CloseIcon } from "./icons.js";

const html = htm.bind(h);

export const GlobalRestartBanner = ({
  visible = false,
  restarting = false,
  onRestart,
  onDismiss = () => {},
}) => {
  if (!visible) return null;
  return html`
    <div class="global-restart-banner">
      <div class="global-restart-banner__content">
        <p class="global-restart-banner__text">
          Gateway restart required to apply pending configuration changes.
        </p>
        <div class="global-restart-banner__actions">
          <${UpdateActionButton}
            onClick=${onRestart}
            disabled=${restarting}
            loading=${restarting}
            warning=${true}
            idleLabel="Restart Gateway"
            loadingLabel="Restarting..."
            className="global-restart-banner__button"
          />
          <button
            type="button"
            onclick=${onDismiss}
            class="global-restart-banner__dismiss ac-btn-ghost"
            aria-label="Dismiss restart banner"
            title="Dismiss"
          >
            <${CloseIcon} className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  `;
};
