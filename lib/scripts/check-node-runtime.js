const { assertSupportedNodeVersion } = require("../node-runtime");

try {
  assertSupportedNodeVersion();
} catch (error) {
  console.error(`[alphaclaw] ${error.message}`);
  console.error(
    "[alphaclaw] Upgrade Node before installing this AlphaClaw release.",
  );
  process.exit(1);
}
