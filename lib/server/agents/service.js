const fs = require("fs");
const { createAgentsDomain } = require("./agents");
const { createBindingsDomain } = require("./bindings");
const { createChannelsDomain } = require("./channels");

const createAgentsService = ({
  fs: fsImpl = fs,
  OPENCLAW_DIR,
  readEnvFile = () => [],
  writeEnvFile = () => {},
  reloadEnv = () => false,
  restartGateway = async () => {},
  clawCmd = async () => ({
    ok: false,
    stdout: "",
    stderr: "openclaw command unavailable",
  }),
}) => {
  const agentsDomain = createAgentsDomain({
    fsImpl,
    OPENCLAW_DIR,
  });
  const bindingsDomain = createBindingsDomain({
    fsImpl,
    OPENCLAW_DIR,
  });
  const channelsDomain = createChannelsDomain({
    fsImpl,
    OPENCLAW_DIR,
    readEnvFile,
    writeEnvFile,
    reloadEnv,
    restartGateway,
    clawCmd,
  });

  return {
    ...agentsDomain,
    ...bindingsDomain,
    getChannelAccountToken: channelsDomain.getChannelAccountToken,
    createChannelAccount: channelsDomain.createChannelAccount,
    updateChannelAccount: channelsDomain.updateChannelAccount,
    deleteChannelAccount: channelsDomain.deleteChannelAccount,
    listConfiguredChannelAccounts:
      channelsDomain.listConfiguredChannelAccountsWithMaskedTokens,
  };
};

module.exports = { createAgentsService };
