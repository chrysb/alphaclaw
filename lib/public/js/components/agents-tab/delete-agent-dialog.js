import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ConfirmDialog } from "../confirm-dialog.js";
import { ToggleSwitch } from "../toggle-switch.js";

const html = htm.bind(h);

export const DeleteAgentDialog = ({
  visible = false,
  loading = false,
  agent = null,
  onCancel = () => {},
  onConfirm = () => {},
}) => {
  const [keepWorkspace, setKeepWorkspace] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setKeepWorkspace(true);
  }, [visible]);

  return html`
    <${ConfirmDialog}
      visible=${visible}
      title="Delete agent"
      message=${`Delete "${String(agent?.name || agent?.id || "agent")}"?`}
      details=${html`
        <div class="mt-2 pt-2 border-t border-border">
          <${ToggleSwitch}
            checked=${keepWorkspace}
            disabled=${loading}
            onChange=${setKeepWorkspace}
            label="Keep workspace files"
          />
        </div>
      `}
      confirmLabel="Delete agent"
      confirmLoadingLabel="Deleting..."
      confirmTone="warning"
      confirmLoading=${loading}
      onCancel=${onCancel}
      onConfirm=${() =>
        onConfirm({
          id: String(agent?.id || "").trim(),
          keepWorkspace,
        })}
    />
  `;
};
