import { app, BrowserWindow, Menu } from 'electron';
import { resolve } from 'path';
import { registerAssetScheme, setupAssetProtocol } from './protocol/asset-protocol';
import { PetCoordinator } from './coordinator';

// Disable default menu bar across the app
Menu.setApplicationMenu(null);

// Register privileged schemes before app is ready
registerAssetScheme();

let coordinator: PetCoordinator | null = null;

async function bootstrap(): Promise<void> {
  const charactersDir = resolve(app.getAppPath(), 'characters');
  setupAssetProtocol(charactersDir);

  coordinator = new PetCoordinator();
  await coordinator.init();

  const petWindow = coordinator.getPetWindow();
  if (petWindow) {
    petWindow.on('closed', () => {
      coordinator?.destroy();
      coordinator = null;
    });
  }
}

app.whenReady().then(async () => {
  await bootstrap();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await bootstrap();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    coordinator?.destroy();
    coordinator = null;
    app.quit();
  }
});
