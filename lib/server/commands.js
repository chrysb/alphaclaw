const { exec } = require("child_process");
const { OPENCLAW_DIR, GOG_KEYRING_PASSWORD } = require("./constants");

const createCommands = ({ gatewayEnv }) => {
  const shellCmd = (cmd, opts = {}) =>
    new Promise((resolve, reject) => {
      const { logStdout, ...execOpts } = opts;
      const shouldLogStdout =
        typeof logStdout === "boolean" ? logStdout : !cmd.includes("--json");
      console.log(
        `[onboard] Running: ${cmd
          .replace(/ghp_[^\s"]+/g, "***")
          .replace(/sk-[^\s"]+/g, "***")
          .slice(0, 200)}`,
      );
      exec(cmd, { timeout: 60000, ...execOpts }, (err, stdout, stderr) => {
        if (err) {
          console.error(
            `[onboard] Error: ${(stderr || err.message).slice(0, 300)}`,
          );
          return reject(err);
        }
        if (shouldLogStdout && stdout.trim()) {
          console.log(`[onboard] ${stdout.trim().slice(0, 300)}`);
        }
        resolve(stdout.trim());
      });
    });

  const clawCmd = (cmd, { quiet = false } = {}) =>
    new Promise((resolve) => {
      if (!quiet) console.log(`[wrapper] Running: openclaw ${cmd}`);
      exec(
        `openclaw ${cmd}`,
        {
          env: gatewayEnv(),
          timeout: 15000,
        },
        (err, stdout, stderr) => {
          const result = {
            ok: !err,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            code: err?.code,
          };
          if (!quiet && !result.ok) {
            console.log(`[wrapper] Error: ${result.stderr.slice(0, 200)}`);
          }
          resolve(result);
        },
      );
    });

  const gogCmd = (cmd, { quiet = false } = {}) =>
    new Promise((resolve) => {
      if (!quiet) console.log(`[wrapper] Running: gog ${cmd}`);
      exec(
        `gog ${cmd}`,
        {
          timeout: 15000,
          env: {
            ...process.env,
            XDG_CONFIG_HOME: OPENCLAW_DIR,
            GOG_KEYRING_PASSWORD,
          },
        },
        (err, stdout, stderr) => {
          const result = {
            ok: !err,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
          };
          if (!quiet && !result.ok) {
            console.log(`[wrapper] gog error: ${result.stderr.slice(0, 200)}`);
          }
          resolve(result);
        },
      );
    });

  return { shellCmd, clawCmd, gogCmd };
};

module.exports = { createCommands };
