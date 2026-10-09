import { contextBridge, ipcRenderer } from 'electron';
import {
  AppSettings,
  DeskPetApi,
  IpcChannel,
  PetPingPayload,
  PetPingResponse,
  PetSnapshot,
  PetUserActionPayload
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
  }
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
