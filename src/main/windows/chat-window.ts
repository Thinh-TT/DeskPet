import { BrowserWindow, screen } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';

function resolvePreloadPath(): string {
  const mjsPath = join(__dirname, '../preload/index.mjs');
  if (existsSync(mjsPath)) {
    return mjsPath;
  }
  return join(__dirname, '../preload/index.js');
}

export class ChatWindowManager {
  private window: BrowserWindow | null = null;
  private width = 380;
  private height = 520;

  createWindow(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.workArea;

    // Đặt mặc định ở góc dưới bên phải màn hình
    const initialX = x + width - this.width - 40;
    const initialY = y + height - this.height - 40;

    this.window = new BrowserWindow({
      x: initialX,
      y: initialY,
      width: this.width,
      height: this.height,
      show: false,
      frame: false,
      transparent: true,
      hasShadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      title: '',
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#00000000',
        symbolColor: '#00000000',
        height: 0
      },
      thickFrame: false,
      roundedCorners: false,
      backgroundMaterial: 'none',
      backgroundColor: '#00000000',
      autoHideMenuBar: false,
      focusable: true,
      webPreferences: {
        preload: resolvePreloadPath(),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.window.setTitle('');

    this.window.setMenu(null);
    this.window.removeMenu();
    this.window.setMenuBarVisibility(false);
    this.window.setAutoHideMenuBar(false);

    this.window.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'Alt') {
        event.preventDefault();
      }
    });

    if (process.env['ELECTRON_RENDERER_URL']) {
      void this.window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/ui/index.html`);
    } else {
      void this.window.loadFile(join(__dirname, '../renderer/ui/index.html'));
    }

    // Khi người dùng bấm nút close trong UI thì chỉ hide chứ không destroy
    this.window.on('close', (event) => {
      if (this.window && !this.window.isDestroyed()) {
        event.preventDefault();
        this.window.hide();
      }
    });

    return this.window;
  }

  getWindow(): BrowserWindow | null {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }
    return null;
  }

  showNearPet(petX: number, petY: number): void {
    const win = this.window && !this.window.isDestroyed() ? this.window : this.createWindow();

    const primaryDisplay = screen.getPrimaryDisplay();
    const { x: workX, y: workY, width: workW, height: workH } = primaryDisplay.workArea;

    // Căn cửa sổ chat cạnh nhân vật:
    // Ưu tiên hiển thị phía trên bên phải của nhân vật
    let targetX = petX + 40;
    let targetY = petY - this.height;

    // Nếu tràn sang phải màn hình -> đảo sang bên trái
    if (targetX + this.width > workX + workW) {
      targetX = petX - this.width - 40;
    }
    // Kẹp trong màn hình (Clamp)
    targetX = Math.max(workX + 10, Math.min(targetX, workX + workW - this.width - 10));
    targetY = Math.max(workY + 10, Math.min(targetY, workY + workH - this.height - 10));

    win.setPosition(Math.round(targetX), Math.round(targetY));
    win.show();
    win.focus();
  }

  toggle(petX?: number, petY?: number): void {
    const win = this.getWindow();
    if (win && win.isVisible()) {
      win.hide();
    } else {
      if (petX !== undefined && petY !== undefined) {
        this.showNearPet(petX, petY);
      } else {
        const w = this.createWindow();
        w.show();
        w.focus();
      }
    }
  }

  hide(): void {
    const win = this.getWindow();
    if (win && win.isVisible()) {
      win.hide();
    }
  }

  destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
      this.window = null;
    }
  }
}
