import { h } from "https://esm.sh/preact";
import { useState, useEffect, useCallback } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { LoadingSpinner } from "../loading-spinner.js";
import { showToast } from "../toast.js";
import { AgentDetailPanel } from "./agent-detail-panel.js";
import { CreateAgentModal } from "./create-agent-modal.js";
import { DeleteAgentDialog } from "./delete-agent-dialog.js";
import { EditAgentModal } from "./edit-agent-modal.js";

const html = htm.bind(h);

const resolveWorkspaceBrowsePath = (workspacePath) => {
  const rawPath = String(workspacePath || "").trim();
  if (!rawPath) return "";
  const openclawMatch = rawPath.match(/[\\/]\.openclaw[\\/](.+)$/);
  if (openclawMatch?.[1]) {
    return String(openclawMatch[1]).replace(/\\/g, "/");
  }
  const segments = rawPath.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] || "";
};

export const AgentsTab = ({
  agents = [],
  loading = false,
  saving = false,
  agentsActions = {},
  selectedAgentId = "",
  activeTab = "overview",
  onSelectAgent = () => {},
  onSelectTab = () => {},
  onNavigateToBrowseFile = () => {},
  onSetLocation = () => {},
}) => {
  const { create, remove, setDefault, update } = agentsActions;

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [deletingAgent, setDeletingAgent] = useState(null);

  useEffect(() => {
    const handleCreateEvent = () => setCreateModalVisible(true);
    window.addEventListener("alphaclaw:create-agent", handleCreateEvent);
    return () => window.removeEventListener("alphaclaw:create-agent", handleCreateEvent);
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

  const handleCreate = async ({ id, name, workspaceFolder }) => {
    try {
      const newAgent = await create({ id, name, workspaceFolder });
      setCreateModalVisible(false);
      onSelectAgent(newAgent.id);
      showToast("Agent created", "success");
    } catch (error) {
      showToast(error.message || "Could not create agent", "error");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefault(id);
      showToast("Default agent updated", "success");
    } catch (error) {
      showToast(error.message || "Could not set default agent", "error");
    }
  };

  const handleUpdateAgent = async (id, patch, successMessage = "Agent updated") => {
    try {
      const nextAgent = await update(id, patch);
      showToast(successMessage, "success");
      return nextAgent;
    } catch (error) {
      showToast(error.message || "Could not update agent", "error");
      throw error;
    }
  };

  const handleEdit = async ({ id, patch }) => {
    try {
      await handleUpdateAgent(id, patch);
      setEditingAgent(null);
    } catch (error) {
      return;
    }
  };

  const handleDelete = async ({ id, keepWorkspace }) => {
    try {
      await remove(id, { keepWorkspace });
      setDeletingAgent(null);
      showToast("Agent deleted", "success");
    } catch (error) {
      showToast(error.message || "Could not delete agent", "error");
    }
  };

  const handleOpenWorkspace = (workspacePath) => {
    const browsePath = resolveWorkspaceBrowsePath(workspacePath);
    if (!browsePath) return;
    onNavigateToBrowseFile(browsePath, { view: "edit", directory: true });
  };

  if (loading) {
    return html`
      <div class="agents-detail-panel">
        <div class="flex items-center justify-center w-full py-16">
          <${LoadingSpinner} className="h-5 w-5" />
        </div>
      </div>
    `;
  }

  return html`
    <${AgentDetailPanel}
      agent=${selectedAgent}
      agents=${agents}
      activeTab=${activeTab}
      saving=${saving}
      onUpdateAgent=${handleUpdateAgent}
      onSetLocation=${onSetLocation}
      onSelectTab=${onSelectTab}
      onEdit=${setEditingAgent}
      onDelete=${setDeletingAgent}
      onSetDefault=${handleSetDefault}
      onOpenWorkspace=${handleOpenWorkspace}
    />

    <${CreateAgentModal}
      visible=${createModalVisible}
      loading=${saving}
      onClose=${() => setCreateModalVisible(false)}
      onSubmit=${handleCreate}
    />
    <${EditAgentModal}
      visible=${!!editingAgent}
      loading=${saving}
      agent=${editingAgent}
      onClose=${() => setEditingAgent(null)}
      onSubmit=${handleEdit}
    />
    <${DeleteAgentDialog}
      visible=${!!deletingAgent}
      loading=${saving}
      agent=${deletingAgent}
      onCancel=${() => setDeletingAgent(null)}
      onConfirm=${handleDelete}
    />
  `;
};
