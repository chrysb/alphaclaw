import { h } from "preact";
import htm from "htm";
import { FileViewer } from "../file-viewer/index.js";

const html = htm.bind(h);

export const BrowseRoute = ({
  activeBrowsePath = "",
  browseView = "edit",
  lineTarget = 0,
  lineEndTarget = 0,
  selectedBrowsePath = "",
  onNavigateToBrowseFile = () => {},
  onEditSelectedBrowseFile = () => {},
  onClearSelection = () => {},
}) => html`
  <div class="w-full">
    <${FileViewer}
      filePath=${activeBrowsePath}
      isPreviewOnly=${false}
      browseView=${browseView}
      lineTarget=${lineTarget}
      lineEndTarget=${lineEndTarget}
      onRequestEdit=${(targetPath) => {
        const normalizedTargetPath = String(targetPath || "");
        if (normalizedTargetPath && normalizedTargetPath !== selectedBrowsePath) {
          onNavigateToBrowseFile(normalizedTargetPath, { view: "edit" });
          return;
        }
        onEditSelectedBrowseFile();
      }}
      onRequestClearSelection=${onClearSelection}
    />
  </div>
`;
