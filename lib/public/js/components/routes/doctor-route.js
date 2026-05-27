import { h } from "preact";
import htm from "htm";
import { DoctorTab } from "../doctor/index.js";

const html = htm.bind(h);

export const DoctorRoute = ({ onNavigateToBrowseFile = () => {} }) => html`
  <div class="pt-4">
    <${DoctorTab}
      isActive=${true}
      onOpenFile=${(relativePath, options = {}) => {
        const browsePath = `workspace/${String(relativePath || "").trim().replace(/^workspace\//, "")}`;
        onNavigateToBrowseFile(browsePath, {
          view: "edit",
          ...(options.line ? { line: options.line } : {}),
          ...(options.lineEnd ? { lineEnd: options.lineEnd } : {}),
        });
      }}
    />
  </div>
`;
