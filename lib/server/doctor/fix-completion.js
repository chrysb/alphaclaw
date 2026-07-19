const crypto = require("crypto");

const hashDoctorFixToken = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

module.exports = { hashDoctorFixToken };
