// The only bridge between the page and the desktop shell. The page checks for
// window.todopop to know it is running as the desktop app.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todopop', {
  setInteractive: (on) => ipcRenderer.send('set-interactive', !!on),
  onTogglePanel: (cb) => ipcRenderer.on('toggle-panel', () => cb()),
  onShowPanel: (cb) => ipcRenderer.on('show-panel', () => cb()),
  onPause: (cb) => ipcRenderer.on('pause', (_e, mode) => cb(mode)),
  setPaused: (on) => ipcRenderer.send('paused', !!on),
});
