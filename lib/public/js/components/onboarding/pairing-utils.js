export const getPreferredPairingChannel = (vals = {}) => {
  if (vals.TELEGRAM_BOT_TOKEN) return "telegram";
  if (vals.DISCORD_BOT_TOKEN) return "discord";
  if (vals.WHATSAPP_OWNER_NUMBER) return "whatsapp";
  return "";
};

export const isChannelPaired = (channels = {}, channel = "") => {
  if (!channel) return false;
  const info = channels?.[channel];
  if (!info) return false;
  return info.status === "paired" && Number(info.paired || 0) > 0;
};
