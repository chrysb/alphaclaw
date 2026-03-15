import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Webhooks } from "../webhooks/index.js";

const html = htm.bind(h);

export const WebhooksRoute = ({
  hookName = "",
  routeHistoryRef = null,
  getCurrentPath = () => "",
  onSetLocation = () => {},
  onRestartRequired = () => {},
  onNavigateToBrowseFile = () => {},
}) => {
  const handleBackToList = () => {
    const historyStack = routeHistoryRef?.current || [];
    const hasPreviousRoute = historyStack.length > 1;
    if (!hasPreviousRoute) {
      onSetLocation("/webhooks");
      return;
    }
    const currentPath = getCurrentPath();
    window.history.back();
    window.setTimeout(() => {
      if (getCurrentPath() === currentPath) {
        onSetLocation("/webhooks");
      }
    }, 180);
  };

  return html`
    <div class="pt-4">
      <${Webhooks}
        selectedHookName=${hookName}
        onSelectHook=${(name) => onSetLocation(`/webhooks/${encodeURIComponent(name)}`)}
        onBackToList=${handleBackToList}
        onRestartRequired=${onRestartRequired}
        onOpenFile=${(relativePath) =>
          onNavigateToBrowseFile(String(relativePath || "").trim(), { view: "edit" })}
      />
    </div>
  `;
};
