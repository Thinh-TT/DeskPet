import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron';
import { resolve } from 'path';
import { CharacterPackLoader } from './character/pack-loader';
import { SettingsStore } from './config/settings-store';
import { SecretsStore } from './config/secrets-store';
import { BehaviorEngine } from './behavior/engine';
import { TrayManager } from './windows/tray-manager';
import { createPetWindow, getPrimaryWorkAreaBounds } from './windows/pet-window';
import { LLMManager } from './llm/llm-manager';
import { ContextManager } from './conversation/context-manager';
import { ConversationOrchestrator } from './conversation/orchestrator';
import {
  AppSettings,
  ChatMessage,
  ChatSendMessagePayloadSchema,
  ChatToggleUiPayloadSchema,
  IpcChannel,
  PetPingPayloadSchema,
  PetPingResponse,
  PetUserActionPayloadSchema,
  SecretsSetKeyPayloadSchema,
  SecretsStatus,
  SetIgnoreMousePayloadSchema,
  WindowSetFocusablePayloadSchema
} from '../shared/ipc/channels';
import { CharacterManifest } from '../shared/character/schema';

export class PetCoordinator {
  private petWindow: BrowserWindow | null = null;
  private packLoader: CharacterPackLoader;
  private settingsStore: SettingsStore;
  private secretsStore: SecretsStore;
  private behaviorEngine: BehaviorEngine | null = null;
  private trayManager: TrayManager | null = null;
  private llmManager: LLMManager;
  private contextManager: ContextManager;
  private orchestrator: ConversationOrchestrator;
  private currentManifest: CharacterManifest | null = null;
  private charactersDir: string;
  private isChatOpen = false;

  constructor() {
    this.charactersDir = resolve(app.getAppPath(), 'characters');
    this.packLoader = new CharacterPackLoader(this.charactersDir);
    this.settingsStore = new SettingsStore();
    this.secretsStore = new SecretsStore();
    this.llmManager = new LLMManager(this.settingsStore, this.secretsStore);
    this.contextManager = new ContextManager();
    this.orchestrator = new ConversationOrchestrator(
      this.contextManager,
      this.llmManager
    );
  }

  async init(): Promise<void> {
    const initialBounds = getPrimaryWorkAreaBounds();
    const settings = this.settingsStore.getSettings();

    // 1. Load active character
    try {
      const pack = await this.packLoader.loadPack(settings.characterId);
      this.currentManifest = pack.manifest;
      this.contextManager.loadCharacter(pack.baseDir, pack.manifest);
    } catch {
      // Fallback to odette
      const pack = await this.packLoader.loadPack('odette');
      this.currentManifest = pack.manifest;
      this.contextManager.loadCharacter(pack.baseDir, pack.manifest);
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

    // 4. Create single window
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
      },
      () => {
        this.toggleChat();
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
      this.contextManager.loadCharacter(pack.baseDir, pack.manifest);
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

  toggleChat(visible?: boolean): void {
    if (!this.behaviorEngine) return;
    this.isChatOpen = visible !== undefined ? visible : !this.isChatOpen;

    if (this.petWindow && !this.petWindow.isDestroyed()) {
      this.petWindow.webContents.send(IpcChannel.CHAT_TOGGLE_UI, {
        visible: this.isChatOpen
      });
    }

    if (this.isChatOpen) {
      this.behaviorEngine.setPaused(true);
      this.behaviorEngine.forceState('listen');
    } else {
      this.behaviorEngine.setPaused(false);
      if (this.petWindow && !this.petWindow.isDestroyed()) {
        this.petWindow.setFocusable(false);
      }
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
      IpcChannel.WINDOW_SET_FOCUSABLE,
      (_event, rawPayload: unknown): void => {
        const parsed = WindowSetFocusablePayloadSchema.safeParse(rawPayload);
        if (parsed.success && this.petWindow && !this.petWindow.isDestroyed()) {
          const { focusable } = parsed.data;
          this.petWindow.setFocusable(focusable);
          if (focusable) {
            this.petWindow.focus();
          }
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
            this.behaviorEngine.handleClick();
            break;
          case 'dblclick':
            this.toggleChat();
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

    // Chat & LLM IPC
    ipcMain.handle(
      IpcChannel.CHAT_SEND_MESSAGE,
      async (_event, rawPayload: unknown): Promise<void> => {
        const parsed = ChatSendMessagePayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(`Dữ liệu tin nhắn không hợp lệ: ${parsed.error.message}`);
        }

        const win = this.petWindow;

        await this.orchestrator.handleUserMessage(parsed.data.text, {
          onChunk: (messageId, delta) => {
            if (win && !win.isDestroyed()) {
              win.webContents.send(IpcChannel.CHAT_STREAM_CHUNK, {
                messageId,
                delta
              });
            }
          },
          onDone: (messageId, fullContent, emotion) => {
            if (win && !win.isDestroyed()) {
              win.webContents.send(IpcChannel.CHAT_STREAM_DONE, {
                messageId,
                fullContent,
                emotion
              });
            }
          },
          onError: (messageId, error) => {
            if (win && !win.isDestroyed()) {
              win.webContents.send(IpcChannel.CHAT_STREAM_ERROR, {
                messageId,
                error
              });
            }
          },
          onEmotion: (emotion) => {
            if (this.behaviorEngine) {
              this.behaviorEngine.setExpression(emotion);
            }
          },
          onStateChange: (state) => {
            if (this.behaviorEngine) {
              this.behaviorEngine.forceState(state);
            }
          }
        });
      }
    );

    ipcMain.handle(IpcChannel.CHAT_GET_HISTORY, (): ChatMessage[] => {
      return this.orchestrator.getHistory();
    });

    ipcMain.handle(IpcChannel.CHAT_CLEAR_HISTORY, (): void => {
      this.orchestrator.clearHistory();
    });

    ipcMain.handle(
      IpcChannel.CHAT_TOGGLE_WINDOW,
      (_event, rawPayload: unknown): void => {
        const parsed = ChatToggleUiPayloadSchema.safeParse(rawPayload);
        const visible = parsed.success ? parsed.data.visible : undefined;
        this.toggleChat(visible);
      }
    );

    ipcMain.handle(
      IpcChannel.CHAT_TEST_CONNECTION,
      async (): Promise<{ success: boolean; message: string }> => {
        return this.llmManager.testActiveConnection();
      }
    );

    // Secrets IPC
    ipcMain.handle(
      IpcChannel.SECRETS_SET_KEY,
      (_event, rawPayload: unknown): void => {
        const parsed = SecretsSetKeyPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          throw new Error(`Dữ liệu key không hợp lệ: ${parsed.error.message}`);
        }
        this.secretsStore.setApiKey(parsed.data.provider, parsed.data.apiKey);
      }
    );

    ipcMain.handle(IpcChannel.SECRETS_GET_STATUS, (): SecretsStatus => {
      return this.secretsStore.getStatus();
    });
  }

  private showContextMenu(): void {
    if (!this.petWindow) return;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Trò chuyện... (Chat)',
        click: (): void => this.toggleChat()
      },
      { type: 'separator' },
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
    contextMenu.popup();
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
