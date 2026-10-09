import { app } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AppSettings, AppSettingsSchema } from '../../shared/ipc/channels';

export class SettingsStore {
  private filePath: string;
  private settings: AppSettings;

  constructor(customPath?: string) {
    this.filePath = customPath ?? join(app.getPath('userData'), 'settings.json');
    this.settings = this.load();
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    const updated = AppSettingsSchema.parse({
      ...this.settings,
      ...partial
    });

    this.settings = updated;
    this.save();

    // Auto-start setting with Electron API
    if (partial.autoStart !== undefined && !process.env.VITEST) {
      try {
        app.setLoginItemSettings({
          openAtLogin: updated.autoStart
        });
      } catch (err) {
        console.error('Failed to set login item settings:', err);
      }
    }

    return { ...this.settings };
  }

  private load(): AppSettings {
    if (existsSync(this.filePath)) {
      try {
        const content = readFileSync(this.filePath, 'utf-8');
        const parsed: unknown = JSON.parse(content);
        const result = AppSettingsSchema.safeParse(parsed);
        if (result.success) {
          return result.data;
        }
      } catch (err) {
        console.error('Failed to load settings file, using defaults:', err);
      }
    }

    return AppSettingsSchema.parse({});
  }

  private save(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }
}
