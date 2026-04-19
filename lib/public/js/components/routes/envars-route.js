import { h } from "preact";
import htm from "htm";
import { Envars } from "../envars.js";

const html = htm.bind(h);

export const EnvarsRoute = ({ onRestartRequired = () => {} }) => html`
  <${Envars} onRestartRequired=${onRestartRequired} />
`;
