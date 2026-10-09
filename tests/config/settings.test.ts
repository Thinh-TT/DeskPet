import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { SettingsStore } from '../../src/main/config/settings-store';

describe('SettingsStore', () => {
  const tempSettingsPath = resolve(__dirname, 'temp-settings.json');

  afterEach(() => {
    if (existsSync(tempSettingsPath)) {
      unlinkSync(tempSettingsPath);
    }
  });

  it('should return default settings when file does not exist', () => {
    const store = new SettingsStore(tempSettingsPath);
    const settings = store.getSettings();

    expect(settings.characterId).toBe('odette');
    expect(settings.scale).toBe(1.0);
    expect(settings.autoStart).toBe(false);
  });

  it('should save and reload updated settings', () => {
    const store = new SettingsStore(tempSettingsPath);
    store.updateSettings({ characterId: 'placeholder', scale: 1.25 });

    const reloaded = new SettingsStore(tempSettingsPath);
    expect(reloaded.getSettings().characterId).toBe('placeholder');
    expect(reloaded.getSettings().scale).toBe(1.25);
  });
});
