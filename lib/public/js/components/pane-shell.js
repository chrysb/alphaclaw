import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

/**
 * Shared layout shell for pages that need a fixed header with a
 * separately scrollable body. The header stays pinned at the top
 * while body content scrolls underneath.
 *
 * @param {preact.ComponentChildren} props.header  Content rendered in the fixed header area.
 * @param {preact.ComponentChildren} props.children  Content rendered in the scrollable body.
 */
export const PaneShell = ({ header, children }) => html`
  <div class="ac-pane-shell">
    <div class="ac-pane-header">
      <div class="ac-pane-header-content">
        ${header}
      </div>
    </div>
    <div class="ac-pane-body">
      <div class="ac-pane-body-content">
        ${children}
      </div>
    </div>
  </div>
`;
