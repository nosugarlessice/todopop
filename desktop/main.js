// TODOPOP desktop: one transparent, always-on-top window that covers the screen.
// Bubbles float over every other app (including full-screen Chrome). The window only
// takes the mouse while the cursor is over a bubble or the control panel; everywhere
// else, clicks pass straight through to whatever is underneath.

const { app, BrowserWindow, screen, ipcMain, Tray, Menu, globalShortcut, nativeImage, shell } = require('electron');
const path = require('path');
const { openInNewWindow } = require('./openwin');

const isMac = process.platform === 'darwin';
const SHORTCUT = 'CommandOrControl+Shift+Space';
let win = null;
let tray = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function fitToDisplay() {
  if (!win) return;
  const { bounds } = screen.getPrimaryDisplay();
  win.setBounds(bounds);
}

function createOverlay() {
  const { bounds } = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    ...bounds,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
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
  win.once('ready-to-show', () => {
    win.show();
    win.focus(); // so the centred control panel can be typed into right away
  });
}

function showPanel() {
  if (!win) return;
  win.show();
  win.focus();
  win.webContents.send('show-panel');
}

function togglePanel() {
  if (!win) return;
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
const sendPause = (mode) => win && win.webContents.send('pause', mode);

function buildTrayMenu() {
  const shortcutLabel = isMac ? '⌘⇧Space' : 'Ctrl+Shift+Space';
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: `Show / hide control panel (${shortcutLabel})`, click: togglePanel },
      { type: 'separator' },
      paused
        ? { label: 'Resume growing', click: () => sendPause('resume') }
        : {
            label: 'Pause growing',
            submenu: [
              { label: 'For 30 minutes', click: () => sendPause('30') },
              { label: 'For 1 hour', click: () => sendPause('60') },
              { label: 'Until tomorrow morning', click: () => sendPause('tomorrow') },
              { label: 'Until I resume', click: () => sendPause('off') },
            ],
          },
      { type: 'separator' },
      {
        label: 'Start at login',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
      },
      { type: 'separator' },
      { label: 'Quit TODOPOP', role: 'quit' },
    ])
  );
  tray.setToolTip(paused ? 'TODOPOP (paused)' : 'TODOPOP');
}

function createTray() {
  tray = new Tray(trayIcon());
  buildTrayMenu();
  if (!isMac) tray.on('click', togglePanel);
}

ipcMain.on('paused', (_event, on) => {
  paused = !!on;
  if (tray) buildTrayMenu();
});

ipcMain.on('set-interactive', (_event, on) => {
  if (!win) return;
  win.setIgnoreMouseEvents(!on, { forward: true });
});

app.on('second-instance', showPanel);

app.whenReady().then(() => {
  if (isMac && app.dock) app.dock.hide(); // a floating layer, not a regular windowed app
  createOverlay();
  createTray();
  globalShortcut.register(SHORTCUT, togglePanel);
  screen.on('display-metrics-changed', fitToDisplay);
  screen.on('display-added', fitToDisplay);
  screen.on('display-removed', fitToDisplay);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
