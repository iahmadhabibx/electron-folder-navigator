const IPC_CHANNELS = Object.freeze({
  FILES: Object.freeze({
    SELECT_DIRECTORY: "files:select-directory",
    LIST_DIRECTORY_FILES: "files:list-directory-files",
    READ_TEXT_CHUNK: "files:read-text-chunk"
  })
});

module.exports = { IPC_CHANNELS };
