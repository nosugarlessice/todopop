// The only bridge between the page and the desktop shell. The page checks for
// window.todopop to know it is running as the desktop app.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todopop', {
  setInteractive: (on) => ipcRenderer.send('set-interactive', !!on),
  onTogglePanel: (cb) => ipcRenderer.on('toggle-panel', () => cb()),
  onShowPanel: (cb) => ipcRenderer.on('show-panel', () => cb()),
  onPause: (cb) => ipcRenderer.on('pause', (_e, mode) => cb(mode)),
  setPaused: (on) => ipcRenderer.send('paused', !!on),
  setAside: (on) => ipcRenderer.send('aside', !!on), // step aside: the window hides until it's brought back
  onAside: (cb) => ipcRenderer.on('aside', (_e, mode) => cb(mode)), // 'on' | '30' | '60' | 'off', from the shortcut or the tray
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('app-version'),
  onUpdate: (cb) => ipcRenderer.on('update', (_e, info) => cb(info)), // Windows: a new version is downloaded and ready
  installUpdate: () => ipcRenderer.send('install-update'),
  getInsets: () => ipcRenderer.invoke('insets'), // menu bar / Dock / taskbar: the strips to keep controls clear of
  onInsets: (cb) => ipcRenderer.on('insets', (_e, i) => cb(i)),
  onPower: (cb) => ipcRenderer.on('power', (_e, state) => cb(state)), // 'sleep', 'wake', 'idle' or 'active'
  fetchCalendar: (link) => ipcRenderer.invoke('cal-fetch', link),
  watchWindows: (on) => ipcRenderer.send('watch', !!on), // only while in focus mode
  onActive: (cb) => ipcRenderer.on('active', (_e, a) => cb(a)), // {app, title, b: where the window is, own}
  titlesPermission: () => ipcRenderer.invoke('titles-perm'),
  askTitlesPermission: () => ipcRenderer.invoke('titles-ask'), // the user's private calendar link → its events, as .ics text
  setLang: (l) => ipcRenderer.send('lang', l === 'zh' ? 'zh' : 'en'), // so the tray menu speaks the same language
});
