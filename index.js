const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 591,
    resizable: false,
    backgroundColor: "#0a0a0a",
    autoHideMenuBar: true,
  });

  win.loadFile(path.join(__dirname, "src", "index.html"));
  win.center();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
