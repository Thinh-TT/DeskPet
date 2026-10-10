import { BrowserWindow, screen } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';
import { Bounds2D } from '../behavior/types';

export function getPrimaryWorkAreaBounds(): Bounds2D {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.workArea;
  return { x, y, width, height };
}

function resolvePreloadPath(): string {
  const mjsPath = join(__dirname, '../preload/index.mjs');
  if (existsSync(mjsPath)) {
    return mjsPath;
  }
  return join(__dirname, '../preload/index.js');
}

export function createPetWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.workArea;

  const window = new BrowserWindow({
    x,
    y,
    width,
    height,
    show: false,
    autoHideMenuBar: false,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: false,
    type: 'toolbar',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#00000000',
      height: 0
    },
    roundedCorners: false,
    backgroundMaterial: 'none',
    backgroundColor: '#00000000',
    title: '',
    thickFrame: false,
    webPreferences: {
      preload: resolvePreloadPath(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.setTitle('');

  // Safeguard: immediately discard OS focus if redirected to pet window
  window.on('focus', () => {
    window.blur();
  });

  // Permanently strip all menu bars from the pet window
  window.setMenu(null);
  window.removeMenu();
  window.setMenuBarVisibility(false);
  window.setAutoHideMenuBar(false);

  // Prevent Alt key from toggling any system menus
  window.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Alt') {
      event.preventDefault();
    }
  });

  // Enable initial click-through on Windows
  window.setIgnoreMouseEvents(true, { forward: true });

  window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer Log ${level}] ${message} (${sourceId}:${line})`);
  });

  window.on('ready-to-show', () => {
    window.show();
  });

  // HMR or load static html
  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pet/index.html`);
  } else {
    window.loadFile(join(__dirname, '../renderer/pet/index.html'));
  }

  return window;
}
