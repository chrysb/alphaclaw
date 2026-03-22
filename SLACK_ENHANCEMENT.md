# Slack Enhancement: Phase 1 - Foundation

This PR adds foundational Slack features to bring AlphaClaw's Slack support up to par with Telegram and Discord.

## What Changed

### slack-api.js Enhancements

**Before:** 2 methods (authTest, postMessage - plain text only)  
**After:** 7 methods with rich functionality

**New Methods:**
1. `postMessageInThread(channel, threadTs, text, opts)` - Send message in a specific thread
2. `addReaction(channel, timestamp, emoji)` - Add emoji reaction to a message
3. `removeReaction(channel, timestamp, emoji)` - Remove emoji reaction
4. `uploadFile(channels, fileContent, opts)` - Upload files (Buffer/Stream/path)
5. `uploadTextSnippet(channels, content, opts)` - Upload code/logs with syntax highlighting

**Enhanced Methods:**
- `postMessage()` now accepts:
  - `opts.thread_ts` - Reply in a thread
  - `opts.reply_broadcast` - Post in thread but notify channel
  - `opts.mrkdwn` - Enable Slack markdown (default: true)

### watchdog-notify.js Improvements

**Threading:**
- Crash notifications start new threads
- Recovery messages reply in the crash thread
- Keeps conversations organized, reduces channel noise

**Reactions:**
- ❌ (`:x:`) - Auto-added to crash notifications
- ✅ (`:white_check_mark:`) - Auto-added to recovery notifications
- ❤️ (`:heart:`) - Auto-added to health notifications

**Thread State Tracking:**
- Remembers active threads per user
- Groups related events (crash → recovery)
- Non-intrusive (failures logged, don't block notifications)

## Features

### 1. Threading Support

**Use Case:** Organize watchdog notifications without cluttering channels.

**Example:**
```javascript
// Start a thread
const msg = await slackApi.postMessage("C123", "🚨 Gateway crashed");

// Reply in the thread
await slackApi.postMessageInThread("C123", msg.ts, "Attempting auto-repair...");
await slackApi.postMessageInThread("C123", msg.ts, "✅ Recovery successful");
```

**Automatic in watchdog:**
- Crash event creates thread
- Subsequent recovery/repair messages go in that thread
- New crash = new thread

### 2. Reactions

**Use Case:** Quick visual status without extra messages.

**Example:**
```javascript
const msg = await slackApi.postMessage("C123", "Deployment complete");
await slackApi.addReaction("C123", msg.ts, "rocket"); // 🚀
```

**Emoji names:**
- Accepts with or without colons: `"thumbsup"` or `":thumbsup:"`
- Common ones: `white_check_mark`, `x`, `heart`, `warning`, `fire`

**Automatic in watchdog:**
- Crash → ❌
- Recovery → ✅
- Health check → ❤️

### 3. File Uploads

**Use Case:** Share logs, code snippets, screenshots.

**Example:**
```javascript
// Upload a buffer
const logBuffer = Buffer.from("Error log contents...");
await slackApi.uploadFile("C123", logBuffer, {
  filename: "gateway.log",
  title: "Gateway Crash Logs",
  initial_comment: "Logs from the crash at 10:30 AM"
});

// Upload a file by path
await slackApi.uploadFile("C123", "/path/to/screenshot.png", {
  title: "Error Screenshot"
});

// Upload code with syntax highlighting
await slackApi.uploadTextSnippet("C123", "console.log('debug');", {
  filename: "debug.js",
  title: "Debug Code"
});
```

**Thread support:**
```javascript
await slackApi.uploadFile("C123", logs, {
  thread_ts: "1234.5678", // Upload into a thread
  initial_comment: "Full crash logs attached"
});
```

## Implementation Details

### Native Node.js Features

**No external dependencies added.** Uses:
- `FormData` (Node.js 18+)
- `Blob` (Node.js 18+)
- Built-in `fetch` (Node.js 18+)

### Backward Compatibility

**100% backward compatible.** Existing code continues working:
```javascript
// This still works exactly as before
await slackApi.postMessage("C123", "Hello");
```

New features are opt-in via the `opts` parameter.

### Error Handling

**Graceful degradation:**
- Reaction failures are logged but don't block notifications
- File upload errors throw (can be caught)
- Thread state tracking is best-effort (failures don't crash)

## Required Slack Permissions

Update your Slack bot scopes:

**Existing:**
- `chat:write` - Send messages

**Add:**
- `files:write` - Upload files
- `reactions:write` - Add/remove reactions

**How to add:**
1. Go to api.slack.com → Your App → OAuth & Permissions
2. Under "Scopes" → "Bot Token Scopes", add `files:write` and `reactions:write`
3. Reinstall app to workspace (Slack will prompt)

## Testing

### Unit Tests

Run: `npm test tests/server/slack-api.test.js`

**Coverage:**
- ✅ Method existence validation
- ✅ Token requirement
- ✅ Threading options
- ✅ Emoji name sanitization
- ✅ Buffer conversion for text snippets
- ✅ Error handling

### Manual Testing

**Prerequisites:**
1. Slack workspace with bot installed
2. `SLACK_BOT_TOKEN` in environment
3. Bot permissions updated (files:write, reactions:write)

**Test threading:**
```javascript
const slackApi = require('./lib/server/slack-api').createSlackApi(() => process.env.SLACK_BOT_TOKEN);

const msg = await slackApi.postMessage("YOUR_USER_ID", "Test thread");
await slackApi.postMessageInThread("YOUR_USER_ID", msg.ts, "Reply in thread");
```

**Test reactions:**
```javascript
await slackApi.addReaction("YOUR_USER_ID", msg.ts, "thumbsup");
```

**Test file upload:**
```javascript
await slackApi.uploadTextSnippet("YOUR_USER_ID", "console.log('test');", {
  filename: "test.js",
  title: "Test Code"
});
```

## Migration Guide

### For Users

**No action required.** Features activate automatically once you:
1. Update Slack bot scopes (see above)
2. Deploy the new version

**Notifications will:**
- Automatically use threads for crash/recovery
- Automatically add reaction emojis
- Still send to all configured users

### For Developers

**Existing code works unchanged:**
```javascript
// Before: still works
await slackApi.postMessage(channel, text);

// After: can now do this too
await slackApi.postMessage(channel, text, { thread_ts: "..." });
```

**watchdog-notify.js callers:**
```javascript
// Before:
await watchdogNotifier.notify(message);

// After: can pass event type for better reactions
await watchdogNotifier.notify(message, { eventType: "crash" });
```

Event types: `"crash"`, `"recovery"`, `"health"`, `"info"` (default)

## What's Next

**Phase 2: Rich Formatting (planned)**
- Block Kit support (structured messages with fields, colors)
- Markdown → Slack mrkdwn conversion
- Rich watchdog notifications

**Phase 3: Advanced Features (planned)**
- Message updates/deletes
- User/channel info lookups
- Scheduled messages

## Examples

### Watchdog Crash Flow

**Before this PR:**
```
[DM] 🐺 AlphaClaw Watchdog
[DM] 🔴 Gateway crashed
[DM] Exit code: 1
[DM] Uptime: 2h 15m
[DM] ⚙️ Auto-repair attempt 1...
[DM] ✅ Gateway recovered
```
*(5 separate messages in DM list)*

**After this PR:**
```
[DM] 🐺 AlphaClaw Watchdog ❌
     🔴 Gateway crashed
     Exit code: 1
     Uptime: 2h 15m
     
     ⚙️ Auto-repair attempt 1... ↩️
     ✅ Gateway recovered ✅
```
*(1 thread, visually organized, reactions show status at a glance)*

### File Upload Use Case

**Scenario:** Gateway crashes, you need logs.

**Before:** SSH into server, cat logs, copy/paste

**After:**
```javascript
// In future PR: automatic log upload on crash
await slackApi.uploadFile(userId, crashLogs, {
  filename: "gateway-crash-2026-03-22.log",
  title: "Gateway Crash Logs",
  initial_comment: "Last 100 lines before crash",
  thread_ts: crashThread.ts
});
```

Logs delivered directly to your Slack, in the crash thread.

## Performance

**Minimal overhead:**
- Thread tracking: `Map` with O(1) lookups, negligible memory
- Reactions: Fire-and-forget, don't block notifications
- File uploads: Streaming supported, no full-file buffering required

**Network calls:**
- Threads: Same as before (1 API call per message)
- Reactions: +1 API call (async, non-blocking)
- Files: 1 API call per upload

## Security

**No new security risks:**
- Uses existing SLACK_BOT_TOKEN
- File uploads respect Slack's size limits (10MB free tier)
- Thread IDs are Slack-generated, not user-controlled
- Emoji names are sanitized (colon removal only)

## Comparison to Other Channels

| Feature | Telegram | Discord | Slack (Before) | Slack (After) |
|---------|----------|---------|----------------|---------------|
| Basic messaging | ✅ | ✅ | ✅ | ✅ |
| Threading | ✅ (topics) | ✅ | ❌ | ✅ |
| Reactions | ✅ | ✅ | ❌ | ✅ |
| File uploads | ✅ | ✅ | ❌ | ✅ |
| Rich formatting | ✅ (Markdown) | ✅ | ❌ | 🔜 (Phase 2) |
| API methods | 8 | 3 | 2 | 7 |

**Result:** Slack is now on par with Telegram/Discord for core features.

## Credits

Implemented based on the [comprehensive Slack enhancement plan](https://github.com/chrysb/alphaclaw/issues/XX).

Follows AlphaClaw's design principles:
- Zero external dependencies when possible
- Backward compatibility always
- Graceful degradation
- Simple APIs, powerful features

## Related

- Issue #XX - Slack feature parity
- PR #XX - Phase 2: Block Kit (coming next)
- Slack API docs: https://api.slack.com/methods
