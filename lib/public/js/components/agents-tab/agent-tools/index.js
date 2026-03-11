import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ToggleSwitch } from "../../toggle-switch.js";
import { InfoTooltip } from "../../info-tooltip.js";
import { SegmentedControl } from "../../segmented-control.js";
import { kSections, kToolProfiles, kProfileLabels } from "./tool-catalog.js";

const html = htm.bind(h);

const kProfileDescriptions = {
  minimal: "Only session status — grant specific tools with alsoAllow",
  messaging: "Session access and messaging — ideal for notification agents",
  coding: "File I/O, shell, memory, sessions, cron, and image generation",
  full: "All tools enabled, no restrictions",
};

const kProfileOptions = kToolProfiles.map((p) => ({
  label: kProfileLabels[p],
  value: p,
  title: kProfileDescriptions[p],
}));

const ToolRow = ({ tool, onToggle }) => html`
  <div class="flex items-center justify-between gap-3 py-2.5 px-4">
    <div class="min-w-0">
      <div class="text-sm text-gray-200 flex items-center gap-1.5">
        <span>${tool.label}</span>
        ${tool.help
          ? html`<${InfoTooltip} text=${tool.help} widthClass="w-72" />`
          : null}
      </div>
      <span class="text-xs font-mono text-gray-500">${tool.id}</span>
    </div>
    <${ToggleSwitch}
      checked=${tool.enabled}
      onChange=${(checked) => onToggle(tool.id, checked)}
      label=${null}
    />
  </div>
`;

const ToolSection = ({ section, toolStates, onToggle }) => {
  const sectionTools = toolStates.filter((t) => t.section === section.id);
  if (!sectionTools.length) return null;

  return html`
    <div class="bg-surface border border-border rounded-xl overflow-hidden">
      <h3 class="card-label text-xs px-4 pt-3 pb-2">${section.label}</h3>
      <div class="divide-y divide-border">
        ${sectionTools.map(
          (tool) =>
            html`<${ToolRow}
              key=${tool.id}
              tool=${tool}
              onToggle=${onToggle}
            />`,
        )}
      </div>
    </div>
  `;
};

export const AgentToolsPanel = ({ agent = {}, tools = {} }) => {
  const { profile, toolStates, setProfile, toggleTool } = tools;

  const enabledTotal = (toolStates || []).filter((t) => t.enabled).length;
  const totalTools = (toolStates || []).length;

  return html`
    <div class="space-y-4">
      <div class="bg-surface border border-border rounded-xl p-4 space-y-4">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="card-label text-xs">Preset</h3>
            <span class="text-xs text-gray-500"
              >${enabledTotal}/${totalTools} tools enabled</span
            >
          </div>
          <${SegmentedControl}
            options=${kProfileOptions}
            value=${profile}
            onChange=${setProfile}
            fullWidth
            className="ac-segmented-control-dark"
          />
        </div>
      </div>

      <div style="columns: 2; column-gap: 0.75rem;">
        ${kSections.map(
          (section) => html`
            <div style="break-inside: avoid; margin-bottom: 0.75rem;">
              <${ToolSection}
                key=${section.id}
                section=${section}
                toolStates=${toolStates || []}
                onToggle=${toggleTool}
              />
            </div>
          `,
        )}
      </div>
    </div>
  `;
};
