const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path"); // Import path module

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: false, // 关闭全屏模式
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.maximize(); // 添加窗口最大化命令
  const isDev = false;
  // 加载应用
  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "build/index.html")}`;
  // const startUrl = 'http://localhost:3000';
  // const startUrl = `file://${path.join(__dirname, 'build/index.html')}`
  win.loadURL(startUrl);
  if (isDev) {
    win.webContents.openDevTools();
  }
}

ipcMain.handle("dialog:openDirectory", async () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) {
    console.error("dialog:openDirectory - 无可用焦点窗口");
    return null; // 或者可以抛出错误，让渲染进程捕获
  }
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(focusedWindow, {
      properties: ["openDirectory"],
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return null; // 用户取消或未选择文件路径
    } else {
      return filePaths[0];
    }
  } catch (error) {
    console.error("dialog:openDirectory - 打开对话框时出错:", error);
    return null; // 或抛出错误
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
