const { contextBridge, ipcRenderer } = require("electron");

// Sandboxed preload cannot `require()` project files. Keep these strings in sync
// with `main/ipc/channels.js`.
const IPC_CHANNELS = Object.freeze({
  FILES: Object.freeze({
    SELECT_DIRECTORY: "files:select-directory",
    LIST_DIRECTORY_FILES: "files:list-directory-files",
    READ_TEXT_CHUNK: "files:read-text-chunk"
  })
});

function assertString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

async function invokeAndUnwrap(channel, payload) {
  const response = await ipcRenderer.invoke(channel, payload);
  if (response?.ok) {
    return response.data;
  }

  const error = response?.error || {
    code: "UNEXPECTED",
    message: "Unexpected IPC error."
  };

  throw error;
}

contextBridge.exposeInMainWorld("fileExplorerApi", {
  pickDirectory: async () => invokeAndUnwrap(IPC_CHANNELS.FILES.SELECT_DIRECTORY),

  listFiles: async (directoryPath) => {
    assertString(directoryPath, "directoryPath");
    return invokeAndUnwrap(IPC_CHANNELS.FILES.LIST_DIRECTORY_FILES, directoryPath);
  },

  readTextChunk: async ({ filePath, offset = 0, chunkSize = 256 * 1024 }) => {
    assertString(filePath, "filePath");
    return invokeAndUnwrap(IPC_CHANNELS.FILES.READ_TEXT_CHUNK, {
      filePath,
      offset,
      chunkSize
    });
  }
});
