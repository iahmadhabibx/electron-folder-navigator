const { IPC_CHANNELS } = require("./channels");
const { AppError, ErrorCode } = require("../services/errors");
const { listDirectoryFiles, readTextChunk, selectDirectory } = require("../services/fileService");

function normalizeError(error) {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    };
  }

  return {
    code: ErrorCode.UNEXPECTED,
    message: "Unexpected internal error.",
    details: error?.message
  };
}

function registerFileIpcHandlers({ ipcMain, dialog }) {
  ipcMain.handle(IPC_CHANNELS.FILES.SELECT_DIRECTORY, async () => {
    try {
      return { ok: true, data: await selectDirectory(dialog) };
    } catch (error) {
      return { ok: false, error: normalizeError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES.LIST_DIRECTORY_FILES, async (_event, directoryPath) => {
    try {
      return { ok: true, data: await listDirectoryFiles(directoryPath) };
    } catch (error) {
      return { ok: false, error: normalizeError(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILES.READ_TEXT_CHUNK, async (_event, payload) => {
    try {
      const safePayload = payload || {};
      return {
        ok: true,
        data: await readTextChunk(safePayload.filePath, {
          offset: safePayload.offset,
          chunkSize: safePayload.chunkSize
        })
      };
    } catch (error) {
      return { ok: false, error: normalizeError(error) };
    }
  });
}

module.exports = { registerFileIpcHandlers };
