const kDefaultTreeDepth = 3;
const kMaxTreeDepth = 3;
const kIgnoredDirectoryNames = new Set([
  ".git",
  ".alphaclaw",
  "node_modules",
  ".cache",
  "dist",
  "build",
]);
const kImageMimeTypeByExtension = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".bmp", "image/bmp"],
  [".ico", "image/x-icon"],
  [".avif", "image/avif"],
]);
const kCommitHistoryLimit = 12;
const kAudioMimeTypeByExtension = new Map([
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
  [".ogg", "audio/ogg"],
  [".oga", "audio/ogg"],
  [".m4a", "audio/mp4"],
  [".aac", "audio/aac"],
  [".flac", "audio/flac"],
  [".opus", "audio/opus"],
  [".weba", "audio/webm"],
]);
const kSqliteFileExtensions = new Set([
  ".sqlite",
  ".sqlite3",
  ".db",
  ".db3",
  ".sdb",
  ".sqlitedb",
]);
const kSqliteTablePageSize = 50;

module.exports = {
  kDefaultTreeDepth,
  kMaxTreeDepth,
  kIgnoredDirectoryNames,
  kImageMimeTypeByExtension,
  kCommitHistoryLimit,
  kAudioMimeTypeByExtension,
  kSqliteFileExtensions,
  kSqliteTablePageSize,
};
