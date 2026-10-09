import { app, ipcMain } from 'electron';
import {
  IpcChannel,
  PetPingPayloadSchema,
  PetPingResponse
} from '../../shared/ipc/channels';

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannel.APP_GET_VERSION, (): string => {
    return app.getVersion();
  });

  ipcMain.handle(
    IpcChannel.PET_PING,
    (_event, rawPayload: unknown): PetPingResponse => {
      const parsed = PetPingPayloadSchema.safeParse(rawPayload);
      if (!parsed.success) {
        throw new Error(`Invalid ping payload: ${parsed.error.message}`);
      }

      return {
        reply: `Pong: ${parsed.data.message}`,
        timestamp: Date.now()
      };
    }
  );
}
