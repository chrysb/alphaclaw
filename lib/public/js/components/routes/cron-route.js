import { h } from "preact";
import htm from "htm";
import { CronTab } from "../cron-tab/index.js";

const html = htm.bind(h);

export const CronRoute = ({ jobId = "", onSetLocation = () => {} }) => html`
  <${CronTab} jobId=${jobId} onSetLocation=${onSetLocation} />
`;
