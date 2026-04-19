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
   * Convert various file input types to Buffer
   */
  const toBuffer = async (content) => {
    if (Buffer.isBuffer(content)) {
      return content;
    } else if (content instanceof Readable) {
      const chunks = [];
      for await (const chunk of content) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } else if (typeof content === "string" && fs.existsSync(content)) {
      return fs.readFileSync(content);
    } else {
      throw new Error("Invalid file content: must be Buffer, Stream, or file path");
    }
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
   * Upload a file to Slack using the 3-step external upload flow
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
    const filename = opts.filename || "file";
    const buffer = await toBuffer(fileContent);
    const filesize = buffer.length;

    // Step 1: Get upload URL
    const uploadInfo = await call("files.getUploadURLExternal", {
      filename,
      length: filesize,
    });

    const { upload_url, file_id } = uploadInfo;

    // Step 2: Upload file to the external URL (raw POST, no auth)
    const uploadRes = await fetch(upload_url, {
      method: "POST",
      headers: {
        "Content-Type": opts.contentType || "application/octet-stream",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      throw new Error(`File upload to external URL failed: HTTP ${uploadRes.status}`);
    }

    // Step 3: Complete the upload and share to channel(s)
    const completePayload = {
      files: [
        {
          id: file_id,
          title: opts.title || filename,
        },
      ],
    };

    // Handle single channel vs multiple channels
    if (channels) {
      if (Array.isArray(channels)) {
        completePayload.channel_id = channels[0]; // Primary channel
        if (channels.length > 1) {
          throw new Error("Multi-channel upload not supported with external upload flow. Use channel_id for one channel.");
        }
      } else {
        completePayload.channel_id = channels;
      }
    }

    if (opts.initial_comment) {
      completePayload.initial_comment = opts.initial_comment;
    }

    if (opts.thread_ts) {
      completePayload.thread_ts = opts.thread_ts;
    }

    return call("files.completeUploadExternal", completePayload);
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

  /**
   * Update an existing message
   * @param {string} channel - Channel ID
   * @param {string} timestamp - Message timestamp
   * @param {string} text - New message text
   * @returns {Promise<object>} Update response
   * @requires chat:write OAuth scope
   */
  const updateMessage = (channel, timestamp, text) => {
    return call("chat.update", {
      channel,
      ts: timestamp,
      text: String(text || ""),
    });
  };

  /**
   * Delete a message
   * @param {string} channel - Channel ID
   * @param {string} timestamp - Message timestamp
   * @requires chat:write OAuth scope
   */
  const deleteMessage = (channel, timestamp) => {
    return call("chat.delete", { channel, ts: timestamp });
  };

  /**
   * Pin a message to a channel
   * @param {string} channel - Channel ID
   * @param {string} timestamp - Message timestamp
   * @requires pins:write OAuth scope
   */
  const pinMessage = (channel, timestamp) => {
    return call("pins.add", { channel, timestamp });
  };

  /**
   * Unpin a message from a channel
   * @param {string} channel - Channel ID
   * @param {string} timestamp - Message timestamp
   * @requires pins:write OAuth scope
   */
  const unpinMessage = (channel, timestamp) => {
    return call("pins.remove", { channel, timestamp });
  };

  /**
   * Get user information
   * @param {string} userId - User ID
   * @returns {Promise<object>} User info (name, real_name, email, etc.)
   * @requires users:read OAuth scope
   */
  const getUserInfo = (userId) => {
    return call("users.info", { user: userId });
  };

  /**
   * Get channel information
   * @param {string} channelId - Channel ID
   * @returns {Promise<object>} Channel info (name, topic, purpose, etc.)
   * @requires channels:read or groups:read OAuth scope (depending on channel type)
   */
  const getChannelInfo = (channelId) => {
    return call("conversations.info", { channel: channelId });
  };

  return {
    authTest,
    postMessage,
    postMessageInThread,
    addReaction,
    removeReaction,
    uploadFile,
    uploadTextSnippet,
    updateMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    getUserInfo,
    getChannelInfo,
  };
};

module.exports = { createSlackApi };
