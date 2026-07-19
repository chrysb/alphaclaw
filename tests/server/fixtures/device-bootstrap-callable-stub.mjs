// Stand-in for openclaw/plugin-sdk/device-bootstrap whose helper delegates to
// a test-controlled implementation on globalThis. Served by
// device-bootstrap-callable-loader.mjs so tests can exercise the direct
// call-through branch of the default device approval helper.
export const approveDevicePairing = async (requestId, options, baseDir) => {
  const impl = globalThis.__alphaclawDeviceBootstrapApprove;
  return typeof impl === "function" ? impl(requestId, options, baseDir) : null;
};
