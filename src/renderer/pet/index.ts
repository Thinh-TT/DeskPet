import type { DeskPetApi } from '../../shared/ipc/channels';

declare global {
  interface Window {
    deskPetApi?: DeskPetApi;
  }
}

const root = document.getElementById('root');

if (root) {
  // Initial empty stage placeholder for Phase 0
  const placeholder = document.createElement('div');
  placeholder.setAttribute('id', 'pet-stage');
  root.appendChild(placeholder);
}
