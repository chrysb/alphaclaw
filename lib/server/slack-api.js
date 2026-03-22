const kSlackApiBase = "https://slack.com/api";
const fs = require("fs");
const { Readable } = require("stream");
const { Blob } = require("buffer");

/**
 * Create Slack API client with enhanced features:
 * - Threading support
 * - Reactions
 * - File uploads
 * - Backward compatible with existing code
 */
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

  /**
   * Upload file using multipart/form-data (for files.uploadV2)
   */
  const callMultipart = async (method, fields = {}, files = []) => {
    const token = typeof getToken === "function" ? getToken() : getToken;
    if (!token) throw new Error("SLACK_BOT_TOKEN is not set");

    const form = new FormData();
    
    // Add text fields
    for (const [key, value] of Object.entries(fields)) {
      if (value != null) {
        form.append(key, String(value));
      }
    }

    // Add file(s) - convert to Blob for native FormData
    for (const file of files) {
      let blob;
      let filename = file.filename || "file";

      if (Buffer.isBuffer(file.content)) {
        blob = new Blob([file.content], { type: file.contentType || "application/octet-stream" });
      } else if (file.content instanceof Readable) {
        // Convert stream to buffer first
        const chunks = [];
        for await (const chunk of file.content) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        blob = new Blob([buffer], { type: file.contentType || "application/octet-stream" });
      } else if (typeof file.content === "string" && fs.existsSync(file.content)) {
        // File path - read into buffer
        const buffer = fs.readFileSync(file.content);
        blob = new Blob([buffer], { type: file.contentType || "application/octet-stream" });
        filename = file.filename || require("path").basename(file.content);
      } else {
        throw new Error("Invalid file content: must be Buffer, Stream, or file path");
      }

      form.append(file.fieldName || "file", blob, filename);
    }

    const res = await fetch(`${kSlackApiBase}/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
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

  /**
   * Verify Slack credentials
   */
  const authTest = () => call("auth.test");

  /**
   * Send a message to a channel or DM
   * @param {string} channel - Channel ID or user ID
   * @param {string} text - Message text
   * @param {object} opts - Options
   * @param {string} opts.thread_ts - Thread timestamp (for threaded replies)
   * @param {boolean} opts.reply_broadcast - Also send to channel (when in thread)
   * @param {boolean} opts.mrkdwn - Enable Slack markdown formatting (default: true)
   * @returns {Promise<object>} Response with ts (message timestamp)
   */
  const postMessage = (channel, text, opts = {}) => {
    const payload = {
      channel,
      text: String(text || ""),
    };

    // Threading support
    if (opts.thread_ts) {
      payload.thread_ts = opts.thread_ts;
    }
    if (opts.reply_broadcast) {
      payload.reply_broadcast = true;
    }

    // Formatting
    if (opts.mrkdwn !== false) {
      payload.mrkdwn = true;
    }

    return call("chat.postMessage", payload);
  };

  /**
   * Post a message in a thread (convenience wrapper)
   * @param {string} channel - Channel ID
   * @param {string} threadTs - Thread timestamp
   * @param {string} text - Message text
   * @param {object} opts - Additional options (reply_broadcast, etc.)
   */
  const postMessageInThread = (channel, threadTs, text, opts = {}) => {
    return postMessage(channel, text, { ...opts, thread_ts: threadTs });
  };

  /**
   * Add a reaction emoji to a message
   * @param {string} channel - Channel ID
   * @param {string} timestamp - Message timestamp
   * @param {string} emoji - Emoji name (without colons, e.g., "white_check_mark")
   */
  const addReaction = (channel, timestamp, emoji) => {
    // Remove colons if user included them
    const cleanEmoji = String(emoji || "").replace(/^:|:$/g, "");
    return call("reactions.add", {
      channel,
      timestamp,
      name: cleanEmoji,
    });
  };

  /**
   * Remove a reaction emoji from a message
   * @param {string} channel - Channel ID
   * @param {string} timestamp - Message timestamp
   * @param {string} emoji - Emoji name (without colons)
   */
  const removeReaction = (channel, timestamp, emoji) => {
    const cleanEmoji = String(emoji || "").replace(/^:|:$/g, "");
    return call("reactions.remove", {
      channel,
      timestamp,
      name: cleanEmoji,
    });
  };

  /**
   * Upload a file to Slack
   * @param {string|string[]} channels - Channel ID(s) to share file in
   * @param {Buffer|Stream|string} fileContent - File content (Buffer, Stream, or file path)
   * @param {object} opts - Options
   * @param {string} opts.filename - Filename
   * @param {string} opts.title - File title
   * @param {string} opts.initial_comment - Comment to add with file
   * @param {string} opts.thread_ts - Thread timestamp (upload to thread)
   * @param {string} opts.contentType - MIME type
   * @returns {Promise<object>} Upload response with file info
   */
  const uploadFile = async (channels, fileContent, opts = {}) => {
    const channelList = Array.isArray(channels) ? channels.join(",") : channels;

    const fields = {
      channels: channelList,
    };

    if (opts.filename) fields.filename = opts.filename;
    if (opts.title) fields.title = opts.title;
    if (opts.initial_comment) fields.initial_comment = opts.initial_comment;
    if (opts.thread_ts) fields.thread_ts = opts.thread_ts;

    const files = [
      {
        content: fileContent,
        filename: opts.filename || "file",
        contentType: opts.contentType || "application/octet-stream",
      },
    ];

    return callMultipart("files.uploadV2", fields, files);
  };

  /**
   * Upload text as a code snippet with syntax highlighting
   * @param {string|string[]} channels - Channel ID(s)
   * @param {string} content - Text content
   * @param {object} opts - Options
   * @param {string} opts.filename - Filename (affects syntax highlighting, e.g., "code.js")
   * @param {string} opts.title - Snippet title
   * @param {string} opts.filetype - File type for syntax highlighting (e.g., "javascript")
   * @param {string} opts.initial_comment - Comment
   * @param {string} opts.thread_ts - Thread timestamp
   */
  const uploadTextSnippet = (channels, content, opts = {}) => {
    const buffer = Buffer.from(String(content || ""), "utf8");
    
    // Detect language from filename if provided
    let filename = opts.filename || "snippet.txt";
    if (opts.filetype) {
      const ext = opts.filetype.replace(/^\./, "");
      if (!filename.includes(".")) {
        filename = `snippet.${ext}`;
      }
    }

    return uploadFile(channels, buffer, {
      ...opts,
      filename,
      contentType: "text/plain",
    });
  };

  return {
    authTest,
    postMessage,
    postMessageInThread,
    addReaction,
    removeReaction,
    uploadFile,
    uploadTextSnippet,
  };
};

module.exports = { createSlackApi };
