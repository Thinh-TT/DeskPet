import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron';
import { resolve } from 'path';
import { CharacterPackLoader } from './character/pack-loader';
import { SettingsStore } from './config/settings-store';
import { BehaviorEngine } from './behavior/engine';
import { TrayManager } from './windows/tray-manager';
import { createPetWindow, getPrimaryWorkAreaBounds } from './windows/pet-window';
import {
  AppSettings,
  IpcChannel,
  PetPingPayloadSchema,
  PetPingResponse,
  PetUserActionPayloadSchema,
  SetIgnoreMousePayloadSchema
} from '../shared/ipc/channels';
import { CharacterManifest } from '../shared/character/schema';

export class PetCoordinator {
  private petWindow: BrowserWindow | null = null;
  private packLoader: CharacterPackLoader;
  private settingsStore: SettingsStore;
  private behaviorEngine: BehaviorEngine | null = null;
  private trayManager: TrayManager | null = null;
  private currentManifest: CharacterManifest | null = null;

  constructor() {
    const charactersDir = resolve(app.getAppPath(), 'characters');
    this.packLoader = new CharacterPackLoader(charactersDir);
    this.settingsStore = new SettingsStore();
  }

  async init(): Promise<void> {
    const initialBounds = getPrimaryWorkAreaBounds();
    const settings = this.settingsStore.getSettings();

    // 1. Load active character
    try {
      const pack = await this.packLoader.loadPack(settings.characterId);
      this.currentManifest = pack.manifest;
    } catch {
      // Fallback to odette
      const pack = await this.packLoader.loadPack('odette');
      this.currentManifest = pack.manifest;
      this.settingsStore.updateSettings({ characterId: 'odette' });
    }

    // 2. Initialize behavior engine
    this.behaviorEngine = new BehaviorEngine(
      initialBounds,
      { walkSpeed: settings.walkSpeed },
      this.currentManifest.size.w
    );
    this.behaviorEngine.setScale(settings.scale);

    // 3. Register IPC handlers
    this.registerIpc();

    // 4. Create window
    this.petWindow = createPetWindow();

    // 5. Setup display listener for multi-monitor / workArea changes
    screen.on('display-metrics-changed', () => {
      this.handleDisplayMetricsChanged();
    });

    // 6. Connect behavior engine updates to renderer
    this.behaviorEngine.onUpdate((snapshot) => {
      if (this.petWindow && !this.petWindow.isDestroyed()) {
        this.petWindow.webContents.send(IpcChannel.PET_STATE_UPDATE, snapshot);
      }
    });

    // Start behavior engine loop
    this.behaviorEngine.start(30);

    // 7. Initialize tray
    this.trayManager = new TrayManager(
      () => this.petWindow,
      this.packLoader,
      this.settingsStore,
      (packId) => {
        void this.changeCharacter(packId);
      }
    );
    await this.trayManager.init();
  }

  getPetWindow(): BrowserWindow | null {
    return this.petWindow;
  }

  async changeCharacter(packId: string): Promise<void> {
    try {
      const pack = await this.packLoader.loadPack(packId);
      this.currentManifest = pack.manifest;
      this.settingsStore.updateSettings({ characterId: packId });

      if (this.petWindow && !this.petWindow.isDestroyed()) {
        this.petWindow.webContents.send(
          IpcChannel.PET_CHANGE_CHARACTER,
          this.currentManifest
        );
      }
    } catch (err) {
      console.error(`Failed to change character to ${packId}:`, err);
    }
  }

  private handleDisplayMetricsChanged(): void {
    const bounds = getPrimaryWorkAreaBounds();
    if (this.behaviorEngine) {
      this.behaviorEngine.setBounds(bounds);
    }
    if (this.petWindow && !this.petWindow.isDestroyed()) {
      this.petWindow.setBounds(bounds);
    }
  }

  private registerIpc(): void {
    ipcMain.handle(IpcChannel.APP_GET_VERSION, (): string => {
      return app.getVersion();
    });

    ipcMain.handle(IpcChannel.PET_PING, (_event, rawPayload: unknown): PetPingResponse => {
      const parsed = PetPingPayloadSchema.safeParse(rawPayload);
      if (!parsed.success) {
        throw new Error(`Invalid ping payload: ${parsed.error.message}`);
      }
      return {
        reply: `Pong: ${parsed.data.message}`,
        timestamp: Date.now()
      };
    });

    ipcMain.handle(IpcChannel.PET_GET_CHARACTER, (): CharacterManifest => {
      if (!this.currentManifest) {
        throw new Error('No character manifest loaded');
      }
      return this.currentManifest;
    });

    ipcMain.handle(
      IpcChannel.PET_SET_IGNORE_MOUSE,
      (_event, rawPayload: unknown): void => {
        const parsed = SetIgnoreMousePayloadSchema.safeParse(rawPayload);
        if (parsed.success && this.petWindow && !this.petWindow.isDestroyed()) {
          this.petWindow.setIgnoreMouseEvents(parsed.data.ignore, { forward: true });
        }
      }
    );

    ipcMain.handle(
      IpcChannel.PET_USER_ACTION,
      (_event, rawPayload: unknown): void => {
        const parsed = PetUserActionPayloadSchema.safeParse(rawPayload);
        if (!parsed.success || !this.behaviorEngine) return;

        const action = parsed.data;
        switch (action.action) {
          case 'click':
          case 'dblclick':
            this.behaviorEngine.handleClick();
            break;
          case 'dragStart':
            this.behaviorEngine.handleDragStart();
            break;
          case 'dragMove':
            this.behaviorEngine.handleDragMove(action.position);
            break;
          case 'dragEnd':
            this.behaviorEngine.handleDragEnd(action.position);
            break;
          case 'contextMenu':
            this.showContextMenu();
            break;
        }
      }
    );

    ipcMain.handle(IpcChannel.PET_GET_SETTINGS, (): AppSettings => {
      return this.settingsStore.getSettings();
    });

    ipcMain.handle(
      IpcChannel.PET_UPDATE_SETTINGS,
      (_event, partial: Partial<AppSettings>): AppSettings => {
        const updated = this.settingsStore.updateSettings(partial);
        if (this.behaviorEngine) {
          this.behaviorEngine.setScale(updated.scale);
          this.behaviorEngine.setSpeed(updated.walkSpeed);
        }
        return updated;
      }
    );
  }

  private showContextMenu(): void {
    if (!this.petWindow) return;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Vuốt ve (Phản ứng)',
        click: (): void => this.behaviorEngine?.handleClick()
      },
      {
        label: 'Đi bộ',
        click: (): void => this.behaviorEngine?.forceState('walk')
      },
      {
        label: 'Ngồi nghỉ',
        click: (): void => this.behaviorEngine?.forceState('sit')
      },
      {
        label: 'Đi ngủ',
        click: (): void => this.behaviorEngine?.forceState('sleep')
      },
      { type: 'separator' },
      {
        label: 'Ẩn vào khay hệ thống',
        click: (): void => this.petWindow?.hide()
      },
      {
        label: 'Thoát',
        click: (): void => app.quit()
      }
    ]);
    contextMenu.popup({ window: this.petWindow });
  }

  destroy(): void {
    if (this.behaviorEngine) {
      this.behaviorEngine.stop();
      this.behaviorEngine = null;
    }
    if (this.trayManager) {
      this.trayManager.destroy();
      this.trayManager = null;
    }
  }
}
