import { BrowserWindow } from 'electron';
import { join } from 'path';

export function createPetWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
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
