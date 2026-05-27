import { h } from "preact";
import htm from "htm";

const html = htm.bind(h);

const kToneClasses = {
  success: "bg-green-500/10 text-status-success-muted",
  warning: "bg-yellow-500/10 text-status-warning-muted",
  danger: "bg-red-500/10 text-status-error-muted",
  neutral: "bg-gray-500/10 text-fg-muted",
  info: "bg-blue-500/10 text-blue-400",
  accent: "bg-purple-500/10 text-purple-400",
  cyan: "bg-cyan-500/10 text-cyan-400",
  secondary: "bg-indigo-500/10 text-indigo-300",
};

export const Badge = ({ tone = "neutral", children }) => html`
  <span class="text-xs px-2 py-0.5 rounded-full font-medium ${kToneClasses[tone] || kToneClasses.neutral}">
    ${children}
  </span>
`;
