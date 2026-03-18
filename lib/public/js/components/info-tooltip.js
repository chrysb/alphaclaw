import { h } from "preact";
import htm from "htm";
import { Tooltip } from "./tooltip.js";

const html = htm.bind(h);

export const InfoTooltip = ({ text = "", widthClass = "w-64" }) => html`
  <${Tooltip} text=${text} widthClass=${widthClass}>
    <span
      class="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-500 text-[10px] text-gray-400 cursor-default select-none"
      aria-label=${text}
      >?</span
    >
  </${Tooltip}>
`;
