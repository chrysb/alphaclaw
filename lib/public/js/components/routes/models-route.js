import { h } from "preact";
import htm from "htm";
import { Models } from "../models-tab/index.js";

const html = htm.bind(h);

export const ModelsRoute = ({ onRestartRequired = () => {} }) => html`
  <${Models} onRestartRequired=${onRestartRequired} />
`;
