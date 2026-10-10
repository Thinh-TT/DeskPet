import React, { useState, useEffect } from 'react';
import { CharacterManifest } from '../../../shared/character/schema';
import { PetSnapshot } from '../../../shared/ipc/channels';
import { ChatOverlay } from './ChatOverlay';

interface PetAppProps {
  onUiPointerChange: (isOverUi: boolean) => void;
}

export const PetApp: React.FC<PetAppProps> = ({ onUiPointerChange }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [characterManifest, setCharacterManifest] = useState<CharacterManifest | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<PetSnapshot | null>(null);

  useEffect(() => {
    const api = window.deskPetApi;
    if (!api) return;

    // Load initial character
    void api.getCharacter().then((manifest) => {
      setCharacterManifest(manifest);
    });

    // Character changes
    const cleanupChar = api.onCharacterChanged((manifest) => {
      setCharacterManifest(manifest);
    });

    // Pet position/state updates
    const cleanupState = api.onStateUpdate((snapshot) => {
      setLatestSnapshot(snapshot);
    });

    // Chat toggle events from Main (Tray / IPC)
    const cleanupToggle = api.onToggleChatUi((payload) => {
      setIsChatOpen((prev) => {
        const next = payload?.visible !== undefined ? payload.visible : !prev;
        if (!next) {
          onUiPointerChange(false);
          void api.setFocusable(false);
        }
        return next;
      });
    });

    return () => {
      cleanupChar();
      cleanupState();
      cleanupToggle();
    };
  }, [onUiPointerChange]);

  const handleCloseChat = (): void => {
    setIsChatOpen(false);
    onUiPointerChange(false);
    if (window.deskPetApi) {
      void window.deskPetApi.toggleChatWindow(false);
      void window.deskPetApi.setFocusable(false);
    }
  };

  return (
    <ChatOverlay
      isOpen={isChatOpen}
      petSnapshot={latestSnapshot}
      characterManifest={characterManifest}
      onClose={handleCloseChat}
      onUiPointerEnter={() => onUiPointerChange(true)}
      onUiPointerLeave={() => onUiPointerChange(false)}
    />
  );
};
