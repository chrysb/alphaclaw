import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

const kToneClasses = {
  success: "bg-green-500/10 text-green-500",
  warning: "bg-yellow-500/10 text-yellow-500",
  neutral: "bg-gray-500/10 text-gray-400",
};

export const Badge = ({ tone = "neutral", children }) => html`
  <span class="text-xs px-2 py-0.5 rounded-full font-medium ${kToneClasses[tone] || kToneClasses.neutral}">
    ${children}
  </span>
`;
