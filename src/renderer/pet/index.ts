import React from 'react';
import { createRoot } from 'react-dom/client';
import type { DeskPetApi } from '../../shared/ipc/channels';
import { PixiCharacterRenderer } from './pixi-renderer';
import { PetApp } from './ui/PetApp';

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

  const pixiContainer = document.getElementById('pixi-container');
  const uiRoot = document.getElementById('ui-root');
  if (!pixiContainer || !uiRoot) return;

  // 1. Initialize Pixi Character Renderer
  const renderer = new PixiCharacterRenderer();
  await renderer.init(pixiContainer);

  // Load initial character pack
  try {
    const manifest = await api.getCharacter();
    await renderer.loadPack(manifest);
  } catch (err) {
    console.error('Failed to load initial character pack:', err);
  }

  // Handle character changes
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

  // 2. Hybrid Hit-Testing & Click-Through coordination
  let isOverPet = false;
  let isOverUi = false;
  let isInteracting = false;

  const syncIgnoreMouse = (): void => {
    const shouldCapture = isOverPet || isOverUi || isInteracting;
    void api.setIgnoreMouse(!shouldCapture);
  };

  renderer.onPointerStateChange((isOver) => {
    isOverPet = isOver;
    syncIgnoreMouse();
  });

  const handleUiPointerChange = (isOver: boolean): void => {
    isOverUi = isOver;
    syncIgnoreMouse();
  };

  // 3. Mount React UI Overlay
  const reactRoot = createRoot(uiRoot);
  reactRoot.render(
    React.createElement(PetApp, {
      onUiPointerChange: handleUiPointerChange
    })
  );

  // 4. Mouse interaction handling on Character
  let isDragging = false;
  let dragThresholdPassed = false;
  let startX = 0;
  let startY = 0;

  pixiContainer.addEventListener('pointerdown', (e) => {
    if (!isOverPet) return;
    if (e.button === 0) {
      isDragging = true;
      isInteracting = true;
      dragThresholdPassed = false;
      startX = e.clientX;
      startY = e.clientY;
      syncIgnoreMouse();
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);

    if (!dragThresholdPassed && (dx > 5 || dy > 5)) {
      dragThresholdPassed = true;
      void api.sendUserAction({ action: 'dragStart' });
    }

    if (dragThresholdPassed) {
      void api.sendUserAction({
        action: 'dragMove',
        position: { x: e.clientX, y: e.clientY }
      });
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (!isDragging) return;

    if (dragThresholdPassed) {
      void api.sendUserAction({
        action: 'dragEnd',
        position: { x: e.clientX, y: e.clientY }
      });
    } else if (e.button === 0) {
      void api.sendUserAction({ action: 'click' });
    }

    isDragging = false;
    isInteracting = false;
    dragThresholdPassed = false;
    syncIgnoreMouse();
  });

  pixiContainer.addEventListener('dblclick', () => {
    if (isOverPet) {
      void api.sendUserAction({ action: 'dblclick' });
    }
  });

  pixiContainer.addEventListener('contextmenu', (e) => {
    if (isOverPet) {
      e.preventDefault();
      void api.sendUserAction({ action: 'contextMenu' });
    }
  });
}

bootstrap().catch((err) => {
  console.error('Failed to initialize pet renderer:', err);
});
