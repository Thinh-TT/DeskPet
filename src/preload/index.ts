import { contextBridge, ipcRenderer } from 'electron';
import {
  DeskPetApi,
  IpcChannel,
  PetPingPayload,
  PetPingResponse
} from '../shared/ipc/channels';

const api: DeskPetApi = {
  getVersion: (): Promise<string> => ipcRenderer.invoke(IpcChannel.APP_GET_VERSION),
  ping: (payload: PetPingPayload): Promise<PetPingResponse> =>
    ipcRenderer.invoke(IpcChannel.PET_PING, payload)
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
