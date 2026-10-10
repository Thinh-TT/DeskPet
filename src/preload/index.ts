import { contextBridge, ipcRenderer } from 'electron';
import {
  AppSettings,
  ChatMessage,
  ChatSendMessagePayload,
  ChatStreamChunk,
  ChatStreamDone,
  ChatStreamError,
  DeskPetApi,
  IpcChannel,
  PetPingPayload,
  PetPingResponse,
  PetSnapshot,
  PetUserActionPayload,
  SecretsSetKeyPayload,
  SecretsStatus
} from '../shared/ipc/channels';
import { CharacterManifest } from '../shared/character/schema';

const api: DeskPetApi = {
  getVersion: (): Promise<string> => ipcRenderer.invoke(IpcChannel.APP_GET_VERSION),

  ping: (payload: PetPingPayload): Promise<PetPingResponse> =>
    ipcRenderer.invoke(IpcChannel.PET_PING, payload),

  getCharacter: (): Promise<CharacterManifest> =>
    ipcRenderer.invoke(IpcChannel.PET_GET_CHARACTER),

  setIgnoreMouse: (ignore: boolean): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.PET_SET_IGNORE_MOUSE, { ignore }),

  sendUserAction: (action: PetUserActionPayload): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.PET_USER_ACTION, action),

  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IpcChannel.PET_GET_SETTINGS),

  updateSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IpcChannel.PET_UPDATE_SETTINGS, settings),

  onStateUpdate: (callback: (snapshot: PetSnapshot) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: PetSnapshot): void => {
      callback(snapshot);
    };
    ipcRenderer.on(IpcChannel.PET_STATE_UPDATE, listener);
    return () => {
      ipcRenderer.removeListener(IpcChannel.PET_STATE_UPDATE, listener);
    };
  },

  onCharacterChanged: (callback: (manifest: CharacterManifest) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, manifest: CharacterManifest): void => {
      callback(manifest);
    };
    ipcRenderer.on(IpcChannel.PET_CHANGE_CHARACTER, listener);
    return () => {
      ipcRenderer.removeListener(IpcChannel.PET_CHANGE_CHARACTER, listener);
    };
  },

  // Chat APIs
  sendMessage: (payload: ChatSendMessagePayload): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.CHAT_SEND_MESSAGE, payload),

  getChatHistory: (): Promise<ChatMessage[]> =>
    ipcRenderer.invoke(IpcChannel.CHAT_GET_HISTORY),

  clearChatHistory: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.CHAT_CLEAR_HISTORY),

  toggleChatWindow: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.CHAT_TOGGLE_WINDOW),

  testConnection: (): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke(IpcChannel.CHAT_TEST_CONNECTION),

  onStreamChunk: (callback: (chunk: ChatStreamChunk) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, chunk: ChatStreamChunk): void => {
      callback(chunk);
    };
    ipcRenderer.on(IpcChannel.CHAT_STREAM_CHUNK, listener);
    return () => {
      ipcRenderer.removeListener(IpcChannel.CHAT_STREAM_CHUNK, listener);
    };
  },

  onStreamDone: (callback: (done: ChatStreamDone) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, done: ChatStreamDone): void => {
      callback(done);
    };
    ipcRenderer.on(IpcChannel.CHAT_STREAM_DONE, listener);
    return () => {
      ipcRenderer.removeListener(IpcChannel.CHAT_STREAM_DONE, listener);
    };
  },

  onStreamError: (callback: (err: ChatStreamError) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, err: ChatStreamError): void => {
      callback(err);
    };
    ipcRenderer.on(IpcChannel.CHAT_STREAM_ERROR, listener);
    return () => {
      ipcRenderer.removeListener(IpcChannel.CHAT_STREAM_ERROR, listener);
    };
  },

  // Secrets APIs
  setApiKey: (payload: SecretsSetKeyPayload): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.SECRETS_SET_KEY, payload),

  getSecretsStatus: (): Promise<SecretsStatus> =>
    ipcRenderer.invoke(IpcChannel.SECRETS_GET_STATUS)
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('deskPetApi', api);
  } catch (error) {
    console.error('Failed to expose deskPetApi into main world:', error);
  }
} else {
  (window as unknown as { deskPetApi: DeskPetApi }).deskPetApi = api;
}
