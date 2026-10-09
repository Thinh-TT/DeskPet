import { describe, it, expect } from 'vitest';
import { CharacterManifestSchema } from '../../src/shared/character/schema';
import odetteManifest from '../../characters/odette/character.json';

describe('CharacterManifestSchema', () => {
  it('should validate the odette character.json pack successfully', () => {
    const result = CharacterManifestSchema.safeParse(odetteManifest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('odette');
      expect(result.data.name).toBe('Odette');
      expect(result.data.states.idle.clip).toBe('idle');
      expect(result.data.clips.walk.count).toBe(12);
    }
  });

  it('should fail when required fields like id or size are missing', () => {
    const invalid = {
      name: 'No ID',
      size: { w: 100 }
    };
    const result = CharacterManifestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
