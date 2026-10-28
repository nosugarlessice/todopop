// TODOPOP desktop: one transparent, always-on-top window that covers the screen.
// Bubbles float over every other app (including full-screen Chrome). The window only
// takes the mouse while the cursor is over a bubble or the control panel; everywhere
// else, clicks pass straight through to whatever is underneath.

const { app, BrowserWindow, screen, ipcMain, Tray, Menu, globalShortcut, nativeImage, shell } = require('electron');
const path = require('path');
const { openInNewWindow } = require('./openwin');
// Windows updates itself from the GitHub releases (it downloads in the background and installs when TODOPOP restarts).
// A Mac can't install unsigned updates, so there the page shows a "new version" note with a download link instead.
let autoUpdater = null;
try { ({ autoUpdater } = require('electron-updater')); } catch { /* running from source without it */ }

const isMac = process.platform === 'darwin';
const SHORTCUT = 'CommandOrControl+Shift+Space';
let win = null;
let tray = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

// Windows: stay above the taskbar instead of over it, so the taskbar, its icons and the tray menu stay reachable.
const overlayBounds = () => { const d = screen.getPrimaryDisplay(); return isMac ? d.bounds : d.workArea; };
let trayMenu = null;
let selfFocus = 0; // when we bring the window forward ourselves
let interactive = false; // true while the cursor is over a bubble or the panel

function fitToDisplay() {
  if (!win) return;
  win.setBounds(overlayBounds());
}

function createOverlay() {
  win = new BrowserWindow({
    ...overlayBounds(),
    title: 'TODOPOP',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: !isMac, // Windows: clicking the taskbar icon "minimizes"; we turn that into show/hide panel
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: isMac, // Windows: a TODOPOP icon sits in the taskbar like any other app
    alwaysOnTop: true,
    show: false,
    // On macOS a "panel" window can sit above other apps' full-screen spaces.
    ...(isMac ? { type: 'panel' } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // keep bubbles growing while another app has focus
    },
  });

  // Highest normal level: above full-screen apps and browser windows.
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Start click-through; the page turns mouse capture on over bubbles and the panel.
  win.setIgnoreMouseEvents(true, { forward: true });

  // task links open in a new window of your normal browser
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^(https?|mailto|file):/i.test(url)) openInNewWindow(url, screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea); return { action: 'deny' }; });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  if (!isMac) {
    // Clicking the taskbar icon never hides the bubbles: it brings up the control panel instead.
    win.on('minimize', () => { win.restore(); selfFocus = Date.now(); win.focus(); win.webContents.send('show-panel'); });
    // The overlay only takes the mouse over bubbles and the panel, so being brought to the front any other way
    // (the taskbar icon, Alt+Tab) means you came looking for TODOPOP: open the panel.
    win.on('focus', () => { if (!interactive && Date.now() - selfFocus > 400) win.webContents.send('show-panel'); });
  }
  win.once('ready-to-show', () => {
    win.show();
    win.focus(); // so the centred control panel can be typed into right away
  });
}

function showPanel() {
  if (!win) return;
  selfFocus = Date.now();
  win.show();
  win.focus();
  win.webContents.send('show-panel');
}

function togglePanel() {
  if (!win) return;
  selfFocus = Date.now();
  win.show();
  win.focus();
  win.webContents.send('toggle-panel');
}

function trayIcon() {
  const file = isMac ? 'trayTemplate.png' : 'tray.png';
  const img = nativeImage.createFromPath(path.join(__dirname, 'assets', file));
  if (isMac) img.setTemplateImage(true);
  return img;
}

let paused = false;
let lang = 'en'; // the page tells us which language it's in; the tray menu follows
const tr = (en, zh) => lang === 'zh' ? zh : en;
const sendPause = (mode) => win && win.webContents.send('pause', mode);

function buildTrayMenu() {
  const shortcutLabel = isMac ? '⌘⇧Space' : 'Ctrl+Shift+Space';
  trayMenu = Menu.buildFromTemplate([
      { label: tr(`Show / hide control panel (${shortcutLabel})`, `显示 / 隐藏控制面板（${shortcutLabel}）`), click: togglePanel },
      { type: 'separator' },
      paused
        ? { label: tr('Resume growing', '恢复生长'), click: () => sendPause('resume') }
        : {
            label: tr('Pause growing', '暂停生长'),
            submenu: [
              { label: tr('For 30 minutes', '30 分钟'), click: () => sendPause('30') },
              { label: tr('For 1 hour', '1 小时'), click: () => sendPause('60') },
              { label: tr('Until tomorrow morning', '到明天早上'), click: () => sendPause('tomorrow') },
              { label: tr('Until I resume', '直到我恢复'), click: () => sendPause('off') },
            ],
          },
      { type: 'separator' },
      {
        label: tr('Start at login', '开机时启动'),
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
      },
      { type: 'separator' },
      { label: tr('Quit TODOPOP', '退出 TODOPOP'), role: 'quit' },
  ]);
  if (isMac) tray.setContextMenu(trayMenu); // Windows opens it on right-click below
  tray.setToolTip(paused ? tr('TODOPOP (paused)', 'TODOPOP（已暂停）') : 'TODOPOP');
}

function createTray() {
  tray = new Tray(trayIcon());
  buildTrayMenu();
  if (!isMac) {
    tray.on('click', togglePanel);
    tray.on('right-click', () => tray.popUpContextMenu(trayMenu)); // open the menu ourselves, so it always shows on Windows
  }
}

ipcMain.on('lang', (_event, l) => { lang = l === 'zh' ? 'zh' : 'en'; if (tray) buildTrayMenu(); });
ipcMain.on('paused', (_event, on) => {
  paused = !!on;
  if (tray) buildTrayMenu();
});

ipcMain.handle('app-version', () => app.getVersion());
ipcMain.on('install-update', () => { if (autoUpdater) setImmediate(() => autoUpdater.quitAndInstall(true, true)); });
function setupUpdates() {
  if (isMac || !autoUpdater || !app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // even if you never click Restart, the next start is the new version
  autoUpdater.on('update-downloaded', (info) => { if (win) win.webContents.send('update', { version: info.version, ready: true }); });
  autoUpdater.on('error', () => {}); // offline, or GitHub unreachable: try again later
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 15000); // a moment after start
  setInterval(check, 6 * 60 * 60 * 1000); // and every 6 hours
}

ipcMain.on('set-interactive', (_event, on) => {
  if (!win) return;
  interactive = !!on;
  win.setIgnoreMouseEvents(!on, { forward: true });
});

app.on('second-instance', showPanel);

if (!isMac) app.setAppUserModelId('app.todopop.desktop'); // the taskbar shows TODOPOP's name and icon

app.whenReady().then(() => {
  if (isMac && app.dock) app.dock.hide(); // a floating layer, not a regular windowed app
  createOverlay();
  createTray();
  setupUpdates();
  globalShortcut.register(SHORTCUT, togglePanel);
  screen.on('display-metrics-changed', fitToDisplay);
  screen.on('display-added', fitToDisplay);
  screen.on('display-removed', fitToDisplay);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
