// Where the encrypted vault file lives.
// - In Electron: a real file on disk (window.vaultFile comes from electron/preload.cjs)
// - In the browser (npm run dev): localStorage
// Both have the same two async functions, so the rest of the app doesn't care which one it gets.
//
// load() returns null only when there is NO vault yet. If a vault exists but
// can't be read, it throws: otherwise the app would offer to create a new
// vault and overwrite the old one.

const KEY = "pwvault";

const browserStorage = {
  async load() {
    let raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      return null; // storage blocked (private mode): behave like a fresh start
    }
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("The saved vault is damaged and can't be read.");
    }
  },

  async save(file) {
    localStorage.setItem(KEY, JSON.stringify(file));
  },
};

const electronStorage = typeof window !== "undefined" ? window.vaultFile : undefined;

export const storage = electronStorage ?? browserStorage;
