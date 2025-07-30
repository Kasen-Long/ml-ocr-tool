const { app, process, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const sharp = require("sharp");

app.commandLine.appendSwitch("disable-web-security");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors"); // 允许跨域
app.commandLine.appendSwitch("--ignore-certificate-errors", "true"); // 忽略证书相关错误

const isDev = false;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
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

  mainWindow.maximize(); // 添加窗口最大化命令

  // 加载应用
  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "build/index.html")}`;
  // const startUrl = 'http://localhost:3000';
  // const startUrl = `file://${path.join(__dirname, 'build/index.html')}`
  mainWindow.loadURL(startUrl);
  if (isDev) {
    mainWindow.webContents.openDevTools();
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

ipcMain.handle("select-image", async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: "选择图片",
      properties: ["openFile"],
      filters: [
        { name: "图片文件", extensions: ["jpg", "jpeg", "png", "tif", "tiff"] },
      ],
    });
    if (result.canceled) {
      return null;
    }
    const sharpInstance = sharp(result.filePaths[0], {
      failOnError: false,
      limitInputPixels: false,
    }).tile({
      size: 8192,
    });
    const metadata = await sharpInstance.metadata();
    const buffer = await sharpInstance.png().toBuffer();
    const ocr = buffer.toString("base64");
    const base64 = `data:image/png;base64,${ocr}`;
    return {
      path: result.filePaths[0],
      name: path.basename(result.filePaths[0]),
      ext: path.extname(result.filePaths[0]),
      base64,
      ocr,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (e) {
    console.log(e);
    return null;
  }
});

ipcMain.handle("deal-image", async (event, imagePath) => {
  try {
    const sharpInstance = sharp(imagePath, {
      failOnError: false,
      limitInputPixels: false,
    }).tile({
      size: 8192,
    });
    const metadata = await sharpInstance.metadata();
    const buffer = await sharpInstance.png().toBuffer();
    const ocr = buffer.toString("base64");
    const base64 = `data:image/png;base64,${ocr}`;
    return {
      path: imagePath,
      name: path.basename(imagePath),
      ext: path.extname(imagePath),
      base64,
      ocr,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (e) {
    console.log(e);
    return null;
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
  if (process?.platform !== "darwin") {
    app.quit();
  }
});
