import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { CronTab } from "../cron-tab/index.js";

const html = htm.bind(h);

export const CronRoute = ({ jobId = "", onSetLocation = () => {} }) => html`
  <${CronTab} jobId=${jobId} onSetLocation=${onSetLocation} />
`;
