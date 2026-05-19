import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import htm from "htm";
import { fetchAgentDefaults, updateAgentDefaults } from "../../lib/api.js";
import { setCached } from "../../lib/api-cache.js";
import { useCachedFetch } from "../../hooks/use-cached-fetch.js";
import { ChevronDownIcon } from "../icons.js";
import { ToggleSwitch } from "../toggle-switch.js";
import { showToast } from "../toast.js";

const html = htm.bind(h);

const kAgentDefaultsCacheKey = "/api/agent-defaults";
const kThinkingOptions = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const AgentDefaults = () => {
  const { data, loading } = useCachedFetch(
    kAgentDefaultsCacheKey,
    fetchAgentDefaults,
    { maxAgeMs: 30000 },
  );
  const serverDefaults = data?.agentDefaults || null;
  const [savingKey, setSavingKey] = useState("");
  const [thinking, setThinking] = useState("medium");
  const [dreaming, setDreaming] = useState(false);

  useEffect(() => {
    if (!serverDefaults) return;
    if (typeof serverDefaults.thinking === "string") {
      setThinking(serverDefaults.thinking);
    }
    if (typeof serverDefaults.dreaming === "boolean") {
      setDreaming(serverDefaults.dreaming);
    }
  }, [serverDefaults?.thinking, serverDefaults?.dreaming]);

  const save = async (key, payload, optimistic) => {
    const previous = key === "thinking" ? thinking : dreaming;
    optimistic();
    setSavingKey(key);
    try {
      const response = await updateAgentDefaults(payload);
      if (!response.ok) {
        throw new Error(response.error || "Could not save agent defaults");
      }
      const next = response.agentDefaults || {};
      if (typeof next.thinking === "string") setThinking(next.thinking);
      if (typeof next.dreaming === "boolean") setDreaming(next.dreaming);
      setCached(kAgentDefaultsCacheKey, { ...(data || {}), ...response });
      showToast("Agent defaults saved", "success");
    } catch (err) {
      if (key === "thinking") setThinking(previous);
      else setDreaming(previous);
      showToast(err.message || "Could not save agent defaults", "error");
    } finally {
      setSavingKey("");
    }
  };

  const handleThinkingChange = (event) => {
    const nextThinking = String(event.target.value || "");
    save("thinking", { thinking: nextThinking }, () => setThinking(nextThinking));
  };

  const handleDreamingChange = (nextDreaming) => {
    save("dreaming", { dreaming: nextDreaming }, () => setDreaming(nextDreaming));
  };

  const disabled = loading && !serverDefaults;

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label mb-3">Agent Defaults</h2>
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm text-body">Thinking default</p>
            <p class="text-xs text-fg-muted">Default reasoning depth for agent calls.</p>
          </div>
          <div class="relative shrink-0">
            <select
              value=${thinking}
              onchange=${handleThinkingChange}
              disabled=${disabled || savingKey === "thinking"}
              class="appearance-none bg-field border border-border rounded-lg pl-2.5 pr-9 py-1.5 text-xs text-body ${disabled ||
              savingKey === "thinking"
                ? "opacity-50 cursor-not-allowed"
                : ""}"
            >
              ${kThinkingOptions.map(
                (option) => html`
                  <option value=${option.value}>${option.label}</option>
                `,
              )}
            </select>
            <${ChevronDownIcon}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
            />
          </div>
        </div>
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm text-body">Dreaming</p>
            <p class="text-xs text-fg-muted">Allow the agent to run background ideation between turns.</p>
          </div>
          <${ToggleSwitch}
            checked=${dreaming}
            disabled=${disabled || savingKey === "dreaming"}
            onChange=${handleDreamingChange}
            label=${dreaming ? "On" : "Off"}
          />
        </div>
      </div>
    </div>
  `;
};
