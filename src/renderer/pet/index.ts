import type { DeskPetApi } from '../../shared/ipc/channels';
import { PixiCharacterRenderer } from './pixi-renderer';

declare global {
  interface Window {
    deskPetApi?: DeskPetApi;
  }
}

async function bootstrap(): Promise<void> {
  const api = window.deskPetApi;
  if (!api) {
    console.error('deskPetApi is not available on window');
    return;
  }

  const root = document.getElementById('root');
  if (!root) return;

  const renderer = new PixiCharacterRenderer();
  await renderer.init(root);

  // Load active character pack
  try {
    const manifest = await api.getCharacter();
    await renderer.loadPack(manifest);
  } catch (err) {
    console.error('Failed to load initial character pack:', err);
  }

  // Handle character changes from Tray/Settings
  api.onCharacterChanged(async (newManifest) => {
    try {
      await renderer.loadPack(newManifest);
    } catch (err) {
      console.error('Failed to reload character pack:', err);
    }
  });

  // State updates from Main Behavior Engine
  api.onStateUpdate((snapshot) => {
    renderer.update(snapshot);
  });

  // Click-through: enable mouse capture when hovering over pet
  renderer.onPointerStateChange((isOver) => {
    api.setIgnoreMouse(!isOver);
  });

  // Mouse interaction handling
  let isDragging = false;
  let dragThresholdPassed = false;
  let startX = 0;
  let startY = 0;

  root.addEventListener('pointerdown', (e) => {
    if (e.button === 0) {
      // Left mouse button
      isDragging = true;
      dragThresholdPassed = false;
      startX = e.clientX;
      startY = e.clientY;
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);

    if (!dragThresholdPassed && (dx > 5 || dy > 5)) {
      dragThresholdPassed = true;
      api.sendUserAction({ action: 'dragStart' });
    }

    if (dragThresholdPassed) {
      api.sendUserAction({
        action: 'dragMove',
        position: { x: e.clientX, y: e.clientY }
      });
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (!isDragging) return;

    if (dragThresholdPassed) {
      api.sendUserAction({
        action: 'dragEnd',
        position: { x: e.clientX, y: e.clientY }
      });
    } else {
      // Normal click
      api.sendUserAction({ action: 'click' });
    }

    isDragging = false;
    dragThresholdPassed = false;
  });

  root.addEventListener('dblclick', () => {
    api.sendUserAction({ action: 'dblclick' });
  });

  root.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    api.sendUserAction({ action: 'contextMenu' });
  });
}

bootstrap().catch((err) => {
  console.error('Failed to initialize pet renderer:', err);
});
