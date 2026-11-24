// Electron main process: opens the window and reads/writes the vault file.
// It never sees the master password or the decrypted data: React encrypts
// everything before handing it over, so this side only moves encrypted JSON.

const { app, BrowserWindow, ipcMain, nativeTheme, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const VAULT_FILE = () => path.join(app.getPath("userData"), "vault.pwvault");

// npm run electron:dev passes --dev-url=http://localhost:5173 to use Vite's dev server
const devUrl = process.argv.find((a) => a.startsWith("--dev-url="))?.slice("--dev-url=".length);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 900,
    minHeight: 560,
    show: false,
    title: "Vault",
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true, // the page can't touch Node or Electron directly
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  // Links (like a login's website) open in the normal browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (url !== win.webContents.getURL()) e.preventDefault();
  });
}

// ---- Vault file ----

ipcMain.handle("vault:load", async () => {
  try {
    return JSON.parse(await fs.readFile(VAULT_FILE(), "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null; // no vault yet
    throw new Error(`The vault file at ${VAULT_FILE()} can't be read: ${err.message}`);
  }
});

ipcMain.handle("vault:save", async (_event, file) => {
  if (file?.format !== "pwvault" || typeof file.data !== "string") {
    throw new Error("Refusing to save something that isn't an encrypted vault.");
  }
  // Write to a temporary file first, then rename: a crash mid-write
  // can never leave a half-written vault behind.
  const target = VAULT_FILE();
  const temp = `${target}.tmp`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(temp, JSON.stringify(file), "utf8");
  await fs.rename(temp, target);
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
