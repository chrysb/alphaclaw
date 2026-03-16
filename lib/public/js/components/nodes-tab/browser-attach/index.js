import { h } from "https://esm.sh/preact";
import { useMemo } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { marked } from "https://esm.sh/marked";

const html = htm.bind(h);

const kReleaseNotesUrl =
  "https://github.com/openclaw/openclaw/releases/tag/v2026.3.13";
const kSetupInstructionsMarkdown = `Release reference: [OpenClaw 2026.3.13](${kReleaseNotesUrl})

## Requirements

- OpenClaw 2026.3.13+
- Chrome 144+
- Node.js installed on the Mac node so \`npx\` is available

## Setup

### 1) Enable remote debugging in Chrome

Open \`chrome://inspect/#remote-debugging\` and turn it on. Do **not** launch Chrome with \`--remote-debugging-port\`.

### 2) Configure the node

In \`~/.openclaw/openclaw.json\` on the Mac node:

\`\`\`json
{
  "browser": {
    "defaultProfile": "user"
  }
}
\`\`\`

The built-in \`user\` profile uses live Chrome attach. You do not need a custom \`existing-session\` profile.

### 3) Approve Chrome consent

On first connect, Chrome prompts for DevTools MCP access. Click **Allow**.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Browser proxy times out (20s) | Restart Chrome cleanly and run the check again. |
| Config validation error on existing-session | Do not define a custom existing-session profile. Use \`defaultProfile: "user"\`. |
| EADDRINUSE on port 9222 | Quit Chrome launched with \`--remote-debugging-port\` and relaunch normally. |
| Consent dialog appears but attach hangs | Quit Chrome, relaunch, and approve the dialog again. |
| \`npx chrome-devtools-mcp\` not found | Install Node.js on the Mac node so \`npx\` exists in PATH. |`;

export const BrowserAttachCard = () => {
  const setupInstructionsHtml = useMemo(
    () =>
      marked.parse(kSetupInstructionsMarkdown, {
        gfm: true,
        breaks: true,
      }),
    [],
  );

  return html`
    <details
      class="ac-surface-inset rounded-lg border border-border px-3 py-2.5"
    >
      <summary class="cursor-pointer text-xs text-gray-300 hover:text-gray-200">
        Chrome debugging setup / troubleshooting
      </summary>
      <div
        class="pt-3 px-2 file-viewer-preview release-notes-preview text-xs leading-5"
        dangerouslySetInnerHTML=${{ __html: setupInstructionsHtml }}
      ></div>
    </details>
  `;
};
