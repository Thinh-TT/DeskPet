import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import { CharacterPackLoader } from '../character/pack-loader';
import { SettingsStore } from '../config/settings-store';

export class TrayManager {
  private tray: Tray | null = null;

  constructor(
    private readonly getPetWindow: () => BrowserWindow | null,
    private readonly packLoader: CharacterPackLoader,
    private readonly settingsStore: SettingsStore,
    private readonly onSelectCharacter: (packId: string) => void
  ) {}

  async init(): Promise<void> {
    // Generate a simple 16x16 icon in RGBA buffer for reliable display
    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip('DeskPet');

    await this.updateMenu();

    this.tray.on('double-click', () => {
      this.togglePetVisibility();
    });
  }

  async updateMenu(): Promise<void> {
    if (!this.tray) return;

    const availablePacks = await this.packLoader.listAvailablePacks();
    const currentSettings = this.settingsStore.getSettings();

    const characterMenuItems: Electron.MenuItemConstructorOptions[] = availablePacks.map(
      (packId) => ({
        label: packId,
        type: 'radio',
        checked: currentSettings.characterId === packId,
        click: (): void => {
          this.settingsStore.updateSettings({ characterId: packId });
          this.onSelectCharacter(packId);
          void this.updateMenu();
        }
      })
    );

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Hiện / Ẩn DeskPet',
        click: (): void => this.togglePetVisibility()
      },
      { type: 'separator' },
      {
        label: 'Chọn nhân vật',
        submenu: characterMenuItems
      },
      {
        label: 'Kích thước',
        submenu: [
          {
            label: 'Nhỏ (75%)',
            type: 'radio',
            checked: currentSettings.scale === 0.75,
            click: (): void => {
              this.settingsStore.updateSettings({ scale: 0.75 });
            }
          },
          {
            label: 'Chuẩn (100%)',
            type: 'radio',
            checked: currentSettings.scale === 1.0,
            click: (): void => {
              this.settingsStore.updateSettings({ scale: 1.0 });
            }
          },
          {
            label: 'Lớn (125%)',
            type: 'radio',
            checked: currentSettings.scale === 1.25,
            click: (): void => {
              this.settingsStore.updateSettings({ scale: 1.25 });
            }
          }
        ]
      },
      {
        label: 'Khởi động cùng Windows',
        type: 'checkbox',
        checked: currentSettings.autoStart,
        click: (item): void => {
          this.settingsStore.updateSettings({ autoStart: item.checked });
        }
      },
      { type: 'separator' },
      {
        label: 'Thoát',
        click: (): void => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private togglePetVisibility(): void {
    const win = this.getPetWindow();
    if (!win) return;
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  }

  private createTrayIcon(): Electron.NativeImage {
    // 16x16 icon with a simple purple circle
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - size / 2;
        const dy = y - size / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;
        if (dist <= size / 2 - 1) {
          buffer[idx] = 168; // R
          buffer[idx + 1] = 85; // G
          buffer[idx + 2] = 247; // B
          buffer[idx + 3] = 255; // A
        } else {
          buffer[idx + 3] = 0; // Transparent
        }
      }
    }
    return nativeImage.createFromBuffer(buffer, { width: size, height: size });
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
