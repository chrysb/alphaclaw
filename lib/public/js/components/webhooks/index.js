import { h } from "https://esm.sh/preact";
import { useCallback, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { createWebhook } from "../../lib/api.js";
import { ActionButton } from "../action-button.js";
import { PageHeader } from "../page-header.js";
import { showToast } from "../toast.js";
import { CreateWebhookModal } from "./create-webhook-modal/index.js";
import { kNamePattern } from "./helpers.js";
import { WebhookDetail } from "./webhook-detail/index.js";
import { WebhookList } from "./webhook-list/index.js";

const html = htm.bind(h);

export const Webhooks = ({
  selectedHookName = "",
  onSelectHook = () => {},
  onBackToList = () => {},
  onRestartRequired = () => {},
  onOpenFile = () => {},
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createMode, setCreateMode] = useState("webhook");
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => {
    const name = String(newName || "")
      .trim()
      .toLowerCase();
    return kNamePattern.test(name);
  }, [newName]);

  const handleCreate = useCallback(
    async (destination = null, mode = "webhook") => {
      const candidateName = String(newName || "")
        .trim()
        .toLowerCase();
      if (!kNamePattern.test(candidateName)) {
        showToast(
          "Name must be lowercase letters, numbers, and hyphens",
          "error",
        );
        return;
      }
      if (creating) return;
      setCreating(true);
      try {
        const data = await createWebhook(candidateName, {
          destination,
          oauthCallback: mode === "oauth",
        });
        setIsCreating(false);
        setNewName("");
        setCreateMode("webhook");
        onSelectHook(candidateName);
        if (data.restartRequired) onRestartRequired(true);
        if (mode === "oauth" && data?.webhook?.oauthCallbackUrl) {
          showToast("Webhook + OAuth callback created", "success");
        } else {
          showToast("Webhook created", "success");
        }
        if (data.syncWarning) {
          showToast(`Created, but git-sync failed: ${data.syncWarning}`, "warning");
        }
      } catch (err) {
        showToast(err.message || "Could not create webhook", "error");
      } finally {
        setCreating(false);
      }
    },
    [creating, newName, onRestartRequired, onSelectHook],
  );

  return html`
    <div class="space-y-4">
      <${PageHeader}
        title="Webhooks"
        leading=${selectedHookName
          ? html`
              <button
                class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                onclick=${onBackToList}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M10.354 3.354a.5.5 0 00-.708-.708l-5 5a.5.5 0 000 .708l5 5a.5.5 0 00.708-.708L5.707 8l4.647-4.646z"
                  />
                </svg>
                Back
              </button>
            `
          : null}
        actions=${selectedHookName
          ? null
          : html`
              <${ActionButton}
                onClick=${() => {
                  setCreateMode("webhook");
                  setIsCreating((open) => !open);
                }}
                tone="secondary"
                size="sm"
                idleLabel="Create new"
                className="px-3 py-1.5"
              />
            `}
      />

      ${selectedHookName
        ? html`
            <${WebhookDetail}
              selectedHookName=${selectedHookName}
              onBackToList=${onBackToList}
              onRestartRequired=${onRestartRequired}
              onOpenFile=${onOpenFile}
            />
          `
        : html`
            <${WebhookList}
              onSelectHook=${(name) => {
                onSelectHook(name);
              }}
            />
          `}

      <${CreateWebhookModal}
        visible=${isCreating && !selectedHookName}
        name=${newName}
        mode=${createMode}
        onModeChange=${setCreateMode}
        onNameChange=${setNewName}
        canCreate=${canCreate}
        creating=${creating}
        onCreate=${handleCreate}
        onClose=${() => {
          setIsCreating(false);
          setCreateMode("webhook");
        }}
      />
    </div>
  `;
};
