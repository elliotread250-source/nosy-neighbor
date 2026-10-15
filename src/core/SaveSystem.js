// localStorage wrapper. Every access is guarded: if storage is blocked
// (private mode, sandboxed iframe), the game still runs, it just won't save.
const KEY = 'nosy-neighbor-save-v1';
const SETTINGS_KEY = 'nosy-neighbor-settings-v1';

function read(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export const SaveSystem = {
  load: () => read(KEY),
  save: (data) => write(KEY, { ...data, savedAt: Date.now() }),
  hasSave: () => !!read(KEY),
  clear() {
    try { window.localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  },
  loadSettings: () => read(SETTINGS_KEY) || {},
  saveSettings: (s) => write(SETTINGS_KEY, s),
};
