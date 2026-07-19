// Module customization hook used by routes-pairings-device-approve.test.js.
// Redirects the dynamic import of the OpenClaw device-bootstrap plugin SDK to
// a local stub whose helper delegates to a test-controlled implementation.
const kBlockedSpecifier = "openclaw/plugin-sdk/device-bootstrap";
const kStubUrl = new URL("./device-bootstrap-callable-stub.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === kBlockedSpecifier) {
    return { shortCircuit: true, url: kStubUrl };
  }
  return nextResolve(specifier, context);
}
