const path = require("path");
const {
  kImageMimeTypeByExtension,
  kAudioMimeTypeByExtension,
  kSqliteFileExtensions,
} = require("./constants");

const isLikelyBinaryFile = (fs, targetPath) => {
  let fileHandle = null;
  try {
    fileHandle = fs.openSync(targetPath, "r");
    const sample = Buffer.alloc(512);
    const bytesRead = fs.readSync(fileHandle, sample, 0, sample.length, 0);
    for (let index = 0; index < bytesRead; index += 1) {
      if (sample[index] === 0) return true;
    }
    return false;
  } finally {
    if (fileHandle !== null) fs.closeSync(fileHandle);
  }
};

const getImageMimeType = (targetPath) => {
  const extension = String(path.extname(targetPath || "") || "").toLowerCase();
  return kImageMimeTypeByExtension.get(extension) || "";
};

const getAudioMimeType = (targetPath) => {
  const extension = String(path.extname(targetPath || "") || "").toLowerCase();
  return kAudioMimeTypeByExtension.get(extension) || "";
};

const isSqliteFilePath = (targetPath) => {
  const extension = String(path.extname(targetPath || "") || "").toLowerCase();
  return kSqliteFileExtensions.has(extension);
};

module.exports = {
  isLikelyBinaryFile,
  getImageMimeType,
  getAudioMimeType,
  isSqliteFilePath,
};
