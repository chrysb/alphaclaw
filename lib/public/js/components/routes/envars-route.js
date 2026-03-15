import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Envars } from "../envars.js";

const html = htm.bind(h);

export const EnvarsRoute = ({ onRestartRequired = () => {} }) => html`
  <${Envars} onRestartRequired=${onRestartRequired} />
`;
