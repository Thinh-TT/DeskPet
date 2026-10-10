import { SecretsStore } from '../config/secrets-store';
import { SettingsStore } from '../config/settings-store';
import { LLMProvider } from './types';
import { GeminiProvider } from './adapters/gemini-provider';
import { DeepSeekProvider } from './adapters/deepseek-provider';

export class LLMManager {
  private geminiProvider: GeminiProvider;
  private deepseekProvider: DeepSeekProvider;
  private settingsStore: SettingsStore;
  private secretsStore: SecretsStore;

  constructor(settingsStore: SettingsStore, secretsStore: SecretsStore) {
    this.settingsStore = settingsStore;
    this.secretsStore = secretsStore;

    this.geminiProvider = new GeminiProvider(
      () => this.secretsStore.getApiKey('gemini'),
      () => this.settingsStore.getSettings().geminiModel
    );

    this.deepseekProvider = new DeepSeekProvider(
      () => this.secretsStore.getApiKey('deepseek'),
      () => this.settingsStore.getSettings().deepseekModel
    );
  }

  getProvider(providerId: 'gemini' | 'deepseek'): LLMProvider {
    if (providerId === 'deepseek') {
      return this.deepseekProvider;
    }
    return this.geminiProvider;
  }

  getActiveProvider(): LLMProvider {
    const settings = this.settingsStore.getSettings();
    return this.getProvider(settings.llmProvider);
  }

  async testActiveConnection(): Promise<{ success: boolean; message: string }> {
    const provider = this.getActiveProvider();
    try {
      const ok = await provider.testConnection();
      if (ok) {
        return {
          success: true,
          message: `Kết nối thành công đến ${provider.name}!`
        };
      }
      return {
        success: false,
        message: `Không thể kết nối đến ${provider.name}. Vui lòng kiểm tra lại API Key.`
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Lỗi kết nối ${provider.name}: ${msg}`
      };
    }
  }
}
