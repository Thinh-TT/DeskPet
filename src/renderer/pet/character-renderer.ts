import { CharacterManifest } from '../../shared/character/schema';
import { PetSnapshot } from '../../shared/ipc/channels';

export interface CharacterRenderer {
  init(container: HTMLElement): Promise<void>;
  loadPack(manifest: CharacterManifest): Promise<void>;
  update(snapshot: PetSnapshot): void;
  destroy(): void;
  onPointerStateChange(callback: (isOverPet: boolean) => void): void;
}
