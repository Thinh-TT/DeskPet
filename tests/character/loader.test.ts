import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { CharacterPackLoader } from '../../src/main/character/pack-loader';

describe('CharacterPackLoader', () => {
  const charactersDir = resolve(__dirname, '../../characters');
  const loader = new CharacterPackLoader(charactersDir);

  it('should list available packs including odette', async () => {
    const packs = await loader.listAvailablePacks();
    expect(packs).toContain('odette');
  });

  it('should load odette manifest successfully', async () => {
    const pack = await loader.loadPack('odette');
    expect(pack.manifest.id).toBe('odette');
    expect(pack.manifest.size.w).toBe(192);
    expect(pack.manifest.size.h).toBe(384);
  });

  it('should throw an error if the pack does not exist', async () => {
    await expect(loader.loadPack('non_existent_pack')).rejects.toThrow();
  });
});
