const fs = require("node:fs");
const path = require("node:path");

const { AppError, ErrorCode } = require("./errors");

const SUPPORTED_TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".html",
  ".css",
  ".xml",
  ".yml",
  ".yaml",
  ".log"
]);

function mapFileType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return extension.length > 0 ? extension.slice(1) : "unknown";
}

async function selectDirectory(dialog) {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}

async function listDirectoryFiles(directoryPath) {
  if (typeof directoryPath !== "string" || directoryPath.trim().length === 0) {
    throw new AppError(ErrorCode.INVALID_ARGUMENT, "A valid directory path is required.");
  }

  let entries;
  try {
    entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new AppError(ErrorCode.DIRECTORY_NOT_FOUND, "The selected directory no longer exists.");
    }
    if (error?.code === "EACCES") {
      throw new AppError(ErrorCode.FILE_ACCESS_DENIED, "Permission denied while reading this directory.");
    }
    throw new AppError(ErrorCode.UNEXPECTED, "Unable to read directory.", error?.message);
  }

  const fileEntries = entries.filter((entry) => entry.isFile());
  const settled = await Promise.allSettled(
    fileEntries.map(async (entry) => {
      const absolutePath = path.join(directoryPath, entry.name);
      const stats = await fs.promises.stat(absolutePath);

      return {
        name: entry.name,
        absolutePath,
        size: stats.size,
        type: mapFileType(entry.name)
      };
    })
  );

  const files = [];
  for (const item of settled) {
    if (item.status === "fulfilled") {
      files.push(item.value);
      continue;
    }

    const reason = item.reason;
    if (reason?.code === "ENOENT") {
      continue;
    }
    if (reason?.code === "EACCES") {
      throw new AppError(
        ErrorCode.FILE_ACCESS_DENIED,
        "Permission denied while reading one of the files in this directory."
      );
    }
    throw new AppError(ErrorCode.UNEXPECTED, "Unable to inspect files in this directory.", reason?.message);
  }

  files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

function ensureTextFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_TEXT_EXTENSIONS.has(extension)) {
    throw new AppError(
      ErrorCode.UNSUPPORTED_FILE_TYPE,
      `Unsupported file type "${extension || "unknown"}". Only text files can be previewed.`
    );
  }
}

async function readTextChunk(filePath, options = {}) {
  if (typeof filePath !== "string" || filePath.trim().length === 0) {
    throw new AppError(ErrorCode.INVALID_ARGUMENT, "A valid file path is required.");
  }

  const offset = Number.isInteger(options.offset) ? options.offset : 0;
  const chunkSize = Number.isInteger(options.chunkSize) ? options.chunkSize : 256 * 1024;

  if (offset < 0 || chunkSize <= 0 || chunkSize > 1024 * 1024) {
    throw new AppError(
      ErrorCode.INVALID_ARGUMENT,
      "Invalid chunk arguments. chunkSize must be between 1 and 1048576."
    );
  }

  ensureTextFile(filePath);

  let fileHandle;
  try {
    fileHandle = await fs.promises.open(filePath, "r");
    const stats = await fileHandle.stat();

    const buffer = Buffer.allocUnsafe(Math.min(chunkSize, Math.max(stats.size - offset, 0)));
    const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, offset);
    const content = buffer.subarray(0, bytesRead).toString("utf8");

    return {
      content,
      offset,
      bytesRead,
      fileSize: stats.size,
      hasMore: offset + bytesRead < stats.size
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new AppError(ErrorCode.FILE_NOT_FOUND, "The selected file no longer exists.");
    }
    if (error?.code === "EACCES") {
      throw new AppError(ErrorCode.FILE_ACCESS_DENIED, "Permission denied while reading this file.");
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(ErrorCode.UNEXPECTED, "Unable to read file.", error?.message);
  } finally {
    if (fileHandle) {
      await fileHandle.close();
    }
  }
}

module.exports = {
  listDirectoryFiles,
  readTextChunk,
  selectDirectory
};
