const normalizeIp = (ip) => String(ip || "").replace(/^::ffff:/, "");

module.exports = {
  normalizeIp,
};
