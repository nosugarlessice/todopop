// TODOPOP desktop: one transparent, always-on-top window that covers the screen.
// Bubbles float over every other app (including full-screen Chrome). The window only
// takes the mouse while the cursor is over a bubble or the control panel; everywhere
// else, clicks pass straight through to whatever is underneath.

const { app, BrowserWindow, screen, ipcMain, Tray, Menu, globalShortcut, nativeImage, shell, powerMonitor, net, systemPreferences, desktopCapturer } = require('electron');
const { spawn } = require('child_process');
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

// Windows: stay above the taskbar, so the taskbar, its icons and the tray menu stay reachable.
// Mac: cover the whole screen, so the focus-mode border always runs along the real edges of the display,
// whether the Dock is showing (desktop) or swiped away (an app in full screen). This is a floating panel at the
// highest level, so macOS lets it cover the menu bar and Dock area; clicks pass through everywhere but our controls.
// Panels, pop-ups and the focus bar still keep clear of the menu bar and Dock: the page is told where they are (insets()).
const overlayBounds = () => { const d = screen.getPrimaryDisplay(); return isMac ? d.bounds : d.workArea; };
let trayMenu = null;
let selfFocus = 0; // when we bring the window forward ourselves
let interactive = false; // true while the cursor is over a bubble or the panel

// which strips of the window the system uses (Mac: menu bar and Dock; Windows: none, the window already avoids the taskbar),
// so the page keeps its controls clear of them on any screen
function insets() {
  const d = screen.getPrimaryDisplay(), w = d.workArea, b = win ? win.getContentBounds() : overlayBounds(); // where the window really is
  return { t: Math.max(0, w.y - b.y), l: Math.max(0, w.x - b.x), r: Math.max(0, (b.x + b.width) - (w.x + w.width)), b: Math.max(0, (b.y + b.height) - (w.y + w.height)) };
}
function fitToDisplay() {
  if (!win) return;
  win.setBounds(overlayBounds());
  win.webContents.send('insets', insets());
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
    enableLargerThanScreen: isMac, // never let macOS nudge the window down from under the menu bar
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
  // if the system moves or resizes the window (a new screen, the Dock appearing), tell the page so its panels stay clear
  const sendInsets = () => { if (win && !win.isDestroyed()) win.webContents.send('insets', insets()); };
  win.on('move', sendInsets); win.on('resize', sendInsets); win.webContents.on('did-finish-load', sendInsets);
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
  if (aside) { sendAside('off'); return; } // asked for TODOPOP while it stepped aside: bring everything back first
  selfFocus = Date.now();
  win.show();
  win.focus();
  win.webContents.send('show-panel');
}

/* Step aside: the page asks, the window hides (nothing to show on a shared screen, nothing drawn).
   The shortcut works like a drawer: once opens or tucks the panel, twice quickly steps aside, once more brings everything back. */
let aside = false, lastShortcut = 0;
const sendAside = (mode) => win && win.webContents.send('aside', mode);
ipcMain.on('aside', (_event, on) => {
  aside = !!on;
  if (win) { if (aside) win.hide(); else win.showInactive(); }
  if (tray) buildTrayMenu();
});
function onShortcut() {
  const now = Date.now();
  if (aside) { lastShortcut = 0; sendAside('off'); return; }
  if (now - lastShortcut < 450) { lastShortcut = 0; sendAside('on'); return; }
  lastShortcut = now;
  togglePanel();
}

function togglePanel() {
  if (!win) return;
  if (aside) { sendAside('off'); return; }
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
      aside
        ? { label: tr(`Bring bubbles back (${shortcutLabel})`, `让泡泡回来（${shortcutLabel}）`), click: () => sendAside('off') }
        : {
            label: tr(`Step aside (${shortcutLabel} twice)`, `先让开（连按两次 ${shortcutLabel}）`),
            submenu: [
              { label: tr('Until I bring them back', '直到我叫回来'), click: () => sendAside('on') },
              { label: tr('For 30 minutes', '30 分钟'), click: () => sendAside('30') },
              { label: tr('For 1 hour', '1 小时'), click: () => sendAside('60') },
            ],
          },
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
  tray.setToolTip(aside ? tr('TODOPOP (stepped aside)', 'TODOPOP（已让开）') : paused ? tr('TODOPOP (paused)', 'TODOPOP（已暂停）') : 'TODOPOP');
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
ipcMain.handle('insets', () => insets());

// ---------- the window you're on, for Tubby (only while you're in focus mode) ----------
// A tiny helper prints the front app, its window title and where the window is, every 1.5 s, and only when it changes.
// Nothing is saved or sent anywhere: the page compares it with your task and your off-task list, then forgets it.
const MAC_WATCH = `ObjC.import('AppKit'); ObjC.import('CoreGraphics');
function run(){ const out = $.NSFileHandle.fileHandleWithStandardOutput; let last = '';
  while(true){ const pool = $.NSAutoreleasePool.alloc.init; let app = '', title = '', b = null;
    try{ const fa = $.NSWorkspace.sharedWorkspace.frontmostApplication;
      if(fa){ app = ObjC.unwrap(fa.localizedName) || ''; const pid = fa.processIdentifier;
        const list = ObjC.deepUnwrap(ObjC.castRefToObject($.CGWindowListCopyWindowInfo(17, 0))) || [];
        for(const w of list){ if(w.kCGWindowOwnerPID === pid && w.kCGWindowLayer === 0){ title = w.kCGWindowName || ''; b = w.kCGWindowBounds || null; break; } } } }catch(e){}
    const line = JSON.stringify({app: app, title: title, b: b});
    if(line !== last){ last = line; out.writeData($(line + '\\n').dataUsingEncoding($.NSUTF8StringEncoding)); }
    pool.drain; delay(1.5); } }`;
const WIN_WATCH = `Add-Type @'
using System; using System.Runtime.InteropServices; using System.Text;
public class FG {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public struct RECT { public int L; public int T; public int R; public int B; }
}
'@
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$last = ''
while ($true) {
  $h = [FG]::GetForegroundWindow(); $sb = New-Object Text.StringBuilder 512; [void][FG]::GetWindowText($h, $sb, 512)
  $p = [uint32]0; [void][FG]::GetWindowThreadProcessId($h, [ref]$p); $name = ''; try { $name = (Get-Process -Id $p -ErrorAction Stop).ProcessName } catch {}
  $r = New-Object FG+RECT; [void][FG]::GetWindowRect($h, [ref]$r)
  $o = @{ app = $name; title = $sb.ToString(); b = @{ X = $r.L; Y = $r.T; Width = $r.R - $r.L; Height = $r.B - $r.T } } | ConvertTo-Json -Compress
  if ($o -ne $last) { $last = $o; [Console]::Out.WriteLine($o); [Console]::Out.Flush() }
  Start-Sleep -Milliseconds 1500
}`;
let watcher = null, watchBuf = '';
function sendActive(o) {
  if (!win || win.isDestroyed()) return;
  const own = /^(todopop|electron)$/i.test(o.app || '');
  let b = null;
  if (o.b) { const wb = win.getBounds(), B = o.b; b = { x: (B.X ?? B.x) - wb.x, y: (B.Y ?? B.y) - wb.y, w: B.Width ?? B.width, h: B.Height ?? B.height }; }
  win.webContents.send('active', { app: o.app || '', title: o.title || '', b, own });
}
function watchStart() {
  if (watcher) return;
  try {
    if (isMac) watcher = spawn('osascript', ['-l', 'JavaScript', '-e', MAC_WATCH]);
    else if (process.platform === 'win32') watcher = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', Buffer.from(WIN_WATCH, 'utf16le').toString('base64')], { windowsHide: true }); // encoded, so its quotes survive
    else return;
  } catch (e) { watcher = null; return; }
  const w = watcher;
  w.stdout.setEncoding('utf8');
  w.stdout.on('data', (d) => {
    watchBuf += d; let i;
    while ((i = watchBuf.indexOf('\n')) >= 0) { const line = watchBuf.slice(0, i).trim(); watchBuf = watchBuf.slice(i + 1); if (line) { try { sendActive(JSON.parse(line)); } catch (e) {} } }
  });
  w.on('error', () => { if (watcher === w) watcher = null; });
  w.on('exit', () => { if (watcher === w) { watcher = null; watchBuf = ''; } });
}
function watchStop() { if (watcher) { try { watcher.kill(); } catch (e) {} watcher = null; watchBuf = ''; } }
ipcMain.on('watch', (_event, on) => (on ? watchStart() : watchStop()));
app.on('before-quit', watchStop);
// on a Mac, window titles need the Screen Recording permission (only titles are read: no pictures of your screen)
ipcMain.handle('titles-perm', () => (isMac ? systemPreferences.getMediaAccessStatus('screen') : 'granted'));
ipcMain.handle('titles-ask', async () => {
  if (!isMac) return 'granted';
  try { await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } }); } catch (e) {} // puts TODOPOP in the list
  const st = systemPreferences.getMediaAccessStatus('screen');
  if (st !== 'granted') shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  return st;
});
// the calendar's private link (an .ics file): fetched here, because calendar sites don't let web pages read them directly.
// Only the user's own link is ever fetched, straight from their calendar; nothing passes through TODOPOP.
ipcMain.handle('cal-fetch', async (_event, link) => {
  try {
    const u = new URL(String(link).trim().replace(/^webcal:/i, 'https:'));
    if (u.protocol !== 'https:') return { error: 'https' };
    const res = await net.fetch(u.href, { headers: { Accept: 'text/calendar, */*' } });
    if (!res.ok) return { error: 'status', status: res.status };
    const text = await res.text();
    if (text.length > 8e6) return { error: 'big' };
    if (!/BEGIN:VCALENDAR/.test(text.slice(0, 2000))) return { error: 'notcal' };
    return { text };
  } catch (e) { return { error: 'net' }; }
});
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
  // the focus timer only counts time you could actually be working: it pauses while the computer sleeps, locks or shuts down
  const power = (state) => { if (win && !win.isDestroyed()) win.webContents.send('power', state); };
  powerMonitor.on('suspend', () => power('sleep'));
  powerMonitor.on('lock-screen', () => power('sleep'));
  powerMonitor.on('shutdown', () => power('sleep'));
  powerMonitor.on('resume', () => power('wake'));
  powerMonitor.on('unlock-screen', () => power('wake'));
  // nobody at the keyboard for two minutes (or the screen went dark): the bubbles redraw once a second instead of 60 times
  let idle = false;
  setInterval(() => {
    let st = 'active'; try { st = powerMonitor.getSystemIdleState(120); } catch (e) {}
    const now = st !== 'active';
    if (now !== idle) { idle = now; power(now ? 'idle' : 'active'); }
  }, 10000);
  if (isMac && app.dock) app.dock.hide(); // a floating layer, not a regular windowed app
  createOverlay();
  createTray();
  setupUpdates();
  globalShortcut.register(SHORTCUT, onShortcut);
  screen.on('display-metrics-changed', fitToDisplay);
  screen.on('display-added', fitToDisplay);
  screen.on('display-removed', fitToDisplay);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
