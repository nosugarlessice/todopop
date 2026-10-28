// The only bridge between the page and the desktop shell. The page checks for
// window.todopop to know it is running as the desktop app.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todopop', {
  setInteractive: (on) => ipcRenderer.send('set-interactive', !!on),
  onTogglePanel: (cb) => ipcRenderer.on('toggle-panel', () => cb()),
  onShowPanel: (cb) => ipcRenderer.on('show-panel', () => cb()),
  onPause: (cb) => ipcRenderer.on('pause', (_e, mode) => cb(mode)),
  setPaused: (on) => ipcRenderer.send('paused', !!on),
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('app-version'),
  onUpdate: (cb) => ipcRenderer.on('update', (_e, info) => cb(info)), // Windows: a new version is downloaded and ready
  installUpdate: () => ipcRenderer.send('install-update'),
  setLang: (l) => ipcRenderer.send('lang', l === 'zh' ? 'zh' : 'en'), // so the tray menu speaks the same language
});
