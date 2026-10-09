import { promises as fs } from 'fs';
import { join } from 'path';
import {
  CharacterManifest,
  CharacterManifestSchema
} from '../../shared/character/schema';

export interface LoadedPack {
  manifest: CharacterManifest;
  baseDir: string;
}

export class CharacterPackLoader {
  constructor(private readonly charactersDir: string) {}

  async listAvailablePacks(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.charactersDir, { withFileTypes: true });
      const packs: string[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const jsonPath = join(this.charactersDir, entry.name, 'character.json');
        try {
          await fs.access(jsonPath);
          packs.push(entry.name);
        } catch {
          // No character.json in this directory
        }
      }

      return packs;
    } catch {
      return [];
    }
  }

  async loadPack(packId: string): Promise<LoadedPack> {
    const packDir = join(this.charactersDir, packId);
    const jsonPath = join(packDir, 'character.json');

    const content = await fs.readFile(jsonPath, 'utf-8');
    const parsedJson: unknown = JSON.parse(content);

    const validation = CharacterManifestSchema.safeParse(parsedJson);
    if (!validation.success) {
      throw new Error(
        `Invalid character manifest for pack "${packId}": ${JSON.stringify(validation.error.issues)}`
      );
    }

    return {
      manifest: validation.data,
      baseDir: packDir
    };
  }

  resolveAssetPath(packId: string, relativePath: string): string {
    return join(this.charactersDir, packId, relativePath);
  }
}
