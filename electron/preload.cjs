// The only bridge between the web page and Electron.
// It exposes exactly two functions as window.vaultFile, nothing else.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vaultFile", {
  load: () => ipcRenderer.invoke("vault:load"),
  save: (file) => ipcRenderer.invoke("vault:save", file),
});
