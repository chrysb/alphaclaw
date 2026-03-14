import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

const barColor = (percent) => {
  if (percent == null) return "bg-gray-600";
  return "bg-cyan-400";
};

export const ResourceBar = ({
  label,
  percent,
  detail,
  segments = null,
  expanded = false,
  onToggle = null,
}) => html`
  <div
    class=${onToggle ? "cursor-pointer group" : ""}
    onclick=${onToggle || undefined}
  >
    <span
      class=${`text-xs text-gray-400 ${onToggle ? "group-hover:text-gray-200 transition-colors" : ""}`}
      >${label}</span
    >
    <div
      class=${`h-0.5 w-full bg-white/15 rounded-full overflow-hidden mt-1.5 flex ${onToggle ? "group-hover:bg-white/10 transition-colors" : ""}`}
    >
      ${expanded && segments
        ? segments.map(
            (seg) => html`
              <div
                class="h-full"
                style=${{
                  width: `${Math.min(100, seg.percent ?? 0)}%`,
                  backgroundColor: seg.color,
                  transition:
                    "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease",
                }}
              ></div>
            `,
          )
        : html`
            <div
              class=${`h-full rounded-full ${barColor(percent)}`}
              style=${{
                width: `${Math.min(100, percent ?? 0)}%`,
                transition:
                  "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease",
              }}
            ></div>
          `}
    </div>
    <div class="flex flex-wrap items-center gap-x-3 mt-2.5">
      <span class="text-xs text-gray-500 font-mono flex-1">${detail}</span>
      ${expanded &&
      segments &&
      segments
        .filter((segment) => segment.label)
        .map(
          (segment) => html`
            <span
              class="inline-flex items-center gap-1 text-xs text-gray-500 font-mono"
            >
              <span
                class="inline-block w-1.5 h-1.5 rounded-full"
                style=${{ backgroundColor: segment.color }}
              ></span>
              ${segment.label}
            </span>
          `,
        )}
    </div>
  </div>
`;
