import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { formatBytes } from "../helpers.js";
import { ResourceBar } from "../resource-bar.js";

const html = htm.bind(h);

export const WatchdogResourcesCard = ({
  resources = null,
  memoryExpanded = false,
  onSetMemoryExpanded = () => {},
}) => {
  if (!resources) return null;
  const memorySegments = (() => {
    const processes = resources.processes;
    const totalBytes = resources.memory?.totalBytes;
    const usedBytes = resources.memory?.usedBytes;
    if (!processes || !totalBytes || !usedBytes) return null;
    const segments = [];
    let trackedBytes = 0;
    if (processes.gateway?.rssBytes != null) {
      trackedBytes += processes.gateway.rssBytes;
      segments.push({
        percent: (processes.gateway.rssBytes / totalBytes) * 100,
        color: "#22d3ee",
        label: `Gateway ${formatBytes(processes.gateway.rssBytes)}`,
      });
    }
    if (processes.alphaclaw?.rssBytes != null) {
      trackedBytes += processes.alphaclaw.rssBytes;
      segments.push({
        percent: (processes.alphaclaw.rssBytes / totalBytes) * 100,
        color: "#a78bfa",
        label: `AlphaClaw ${formatBytes(processes.alphaclaw.rssBytes)}`,
      });
    }
    const otherBytes = Math.max(0, usedBytes - trackedBytes);
    if (otherBytes > 0) {
      segments.push({
        percent: (otherBytes / totalBytes) * 100,
        color: "#4b5563",
        label: `Other ${formatBytes(otherBytes)}`,
      });
    }
    return segments.length ? segments : null;
  })();

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      ${memoryExpanded
        ? html`
            <${ResourceBar}
              label="Memory"
              detail=${`${formatBytes(resources.memory?.usedBytes)} / ${formatBytes(resources.memory?.totalBytes)}`}
              percent=${resources.memory?.percent}
              expanded=${true}
              onToggle=${() => onSetMemoryExpanded(false)}
              segments=${memorySegments}
            />
          `
        : html`
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <${ResourceBar}
                label="Memory"
                percent=${resources.memory?.percent}
                detail=${`${formatBytes(resources.memory?.usedBytes)} / ${formatBytes(resources.memory?.totalBytes)}`}
                onToggle=${() => onSetMemoryExpanded(true)}
              />
              <${ResourceBar}
                label=${`Disk${resources.disk?.path ? ` (${resources.disk.path})` : ""}`}
                percent=${resources.disk?.percent}
                detail=${`${formatBytes(resources.disk?.usedBytes)} / ${formatBytes(resources.disk?.totalBytes)}`}
              />
              <${ResourceBar}
                label=${`CPU${resources.cpu?.cores ? ` (${resources.cpu.cores} vCPU)` : ""}`}
                percent=${resources.cpu?.percent}
                detail=${resources.cpu?.percent != null
                  ? `${resources.cpu.percent}%`
                  : "—"}
              />
            </div>
          `}
    </div>
  `;
};
