import { app, BrowserWindow } from 'electron';
import { registerIpcHandlers } from './ipc/register-handlers';
import { createPetWindow } from './windows/pet-window';

let petWindow: BrowserWindow | null = null;

function bootstrap(): void {
  registerIpcHandlers();
  petWindow = createPetWindow();

  petWindow.on('closed', () => {
    petWindow = null;
  });
}

app.whenReady().then(() => {
  bootstrap();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      bootstrap();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
