const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { ocr } = require('./ocr'); // Import the ocr function

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  readdirSync: (dirPath) => fs.readdirSync(dirPath),
  statSync: (filePath) => fs.statSync(filePath),
  joinPath: (...args) => path.join(...args),
  resolvePath: (filePath) => path.resolve(filePath),
  extname: (filePath) => path.extname(filePath),
  basename: (filePath, ext) => path.basename(filePath, ext),
  readFileSync: (filePath, options) => fs.readFileSync(filePath, options),
  isDirectory: (filePath) => fs.statSync(filePath).isDirectory(),
  isFileSync: (filePath) => fs.statSync(filePath).isFile(),
  ocr: ocr,
  dirname: (filePath) => path.dirname(filePath),
  writeFile: (filePath, content) => fs.writeFileSync(filePath, content, 'utf8'),
});