const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron");

const { registerFileIpcHandlers } = require("./ipc/fileIpc");

function buildApplicationMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" }
            ]
          }
        ]
      : []),
    {
      label: "File",
      submenu: [{ role: isMac ? "close" : "quit" }]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        {
          label: "Toggle Developer Tools",
          accelerator: isMac ? "Cmd+Shift+I" : "Ctrl+Shift+I",
          click: (_item, focusedWindow) => {
            focusedWindow?.webContents.toggleDevTools();
          }
        },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildApplicationMenu());
  registerFileIpcHandlers({ ipcMain, dialog });
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
