import { h } from "preact";
import htm from "htm";

const html = htm.bind(h);

const kToneClasses = {
  success: "bg-green-500/10 text-green-500",
  warning: "bg-yellow-500/10 text-yellow-500",
  danger: "bg-red-500/10 text-red-400",
  neutral: "bg-gray-500/10 text-gray-400",
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
