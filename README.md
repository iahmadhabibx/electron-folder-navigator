# Electron File Explorer

Application that lets users:

- Select a folder
- List files (`name`, `size`, `type`)
- Preview text files safely
- Read large text files in chunks so UI stays responsive

## Run

```bash
npm install
npm start
```

## Architecture

- `main/main.js`: app bootstrap, secure `BrowserWindow` config
- `preload.js`: renderer-safe API exposed through `contextBridge`
- `main/ipc/channels.js`: structured IPC channel names
- `main/ipc/fileIpc.js`: all IPC handlers in one place
- `main/services/fileService.js`: filesystem logic
- `main/services/errors.js`: app-level typed errors
- `renderer/*`: UI only, no direct Node.js access

## Security defaults used

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- renderer only accesses `window.fileExplorerApi`

## Performance notes

- File preview uses chunked reads (`256KB` per request).
- Large files are not loaded into memory in one pass.
- `Load More` continues preview incrementally.

## Error handling

Main process maps runtime failures to structured app errors:

- `DIRECTORY_NOT_FOUND`
- `FILE_NOT_FOUND`
- `FILE_ACCESS_DENIED`
- `UNSUPPORTED_FILE_TYPE`
- `INVALID_ARGUMENT`
- `UNEXPECTED`

The renderer displays readable error feedback without crashing.
