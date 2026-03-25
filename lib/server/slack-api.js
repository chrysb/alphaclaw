const kSlackApiBase = "https://slack.com/api";

const createSlackApi = (getToken) => {
  const call = async (method, body = {}) => {
    const token = typeof getToken === "function" ? getToken() : getToken;
    if (!token) throw new Error("SLACK_BOT_TOKEN is not set");
    const res = await fetch(`${kSlackApiBase}/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Slack API ${method}: HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.ok) {
      const err = new Error(data.error || `Slack API error: ${method}`);
      err.slackError = data.error;
      throw err;
    }
    return data;
  };

  const authTest = () => call("auth.test");

  const postMessage = (channel, text) =>
    call("chat.postMessage", { channel, text: String(text || "") });

  return {
    authTest,
    postMessage,
  };
};

module.exports = { createSlackApi };
