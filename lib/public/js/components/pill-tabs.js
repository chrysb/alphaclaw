import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

const kPillBaseClassName =
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";
const kPillActiveClassName =
  "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]";
const kPillInactiveClassName =
  "border-border bg-black/20 text-gray-500 hover:border-gray-500 hover:text-gray-300";

export const PillTabs = ({
  tabs = [],
  activeTab = "",
  onSelectTab = () => {},
  className = "flex items-center gap-2",
} = {}) => html`
  <div class=${className}>
    ${tabs.map(
      (tab) => html`
        <button
          key=${String(tab?.value || "")}
          type="button"
          class=${`${kPillBaseClassName} ${activeTab === tab?.value ? kPillActiveClassName : kPillInactiveClassName}`}
          onclick=${() => onSelectTab(tab?.value)}
        >
          ${String(tab?.label || tab?.value || "")}
        </button>
      `,
    )}
  </div>
`;
