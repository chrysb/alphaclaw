import { h } from "preact";
import htm from "htm";
import { McpTab } from "../mcp-tab/index.js";

const html = htm.bind(h);

export const McpRoute = () => html`<${McpTab} />`;
