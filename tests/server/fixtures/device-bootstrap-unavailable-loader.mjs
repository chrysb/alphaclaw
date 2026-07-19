// Module customization hook used by routes-pairings-device-bootstrap.test.js.
// Redirects the dynamic import of the OpenClaw device-bootstrap plugin SDK to
// a local stub without a usable approveDevicePairing helper so tests can
// exercise the "approval helper is unavailable" branch without loading the
// real (heavy) openclaw ESM module graph.
const kBlockedSpecifier = "openclaw/plugin-sdk/device-bootstrap";
const kStubUrl = new URL("./device-bootstrap-stub.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === kBlockedSpecifier) {
    return { shortCircuit: true, url: kStubUrl };
  }
  return nextResolve(specifier, context);
}
