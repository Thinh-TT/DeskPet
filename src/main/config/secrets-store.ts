import { app, safeStorage } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { SecretsStatus } from '../../shared/ipc/channels';

export type SupportedLlmProvider = 'gemini' | 'deepseek';

interface StoredSecrets {
  geminiApiKeyEncrypted?: string;
  deepseekApiKeyEncrypted?: string;
}

export class SecretsStore {
  private filePath: string;
  private secrets: StoredSecrets = {};

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      try {
        this.filePath = join(app.getPath('userData'), 'secrets.dat');
      } catch {
        this.filePath = join(process.cwd(), 'secrets.dat');
      }
    }
    this.load();
  }

  setApiKey(provider: SupportedLlmProvider, apiKey: string): void {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      if (provider === 'gemini') delete this.secrets.geminiApiKeyEncrypted;
      if (provider === 'deepseek') delete this.secrets.deepseekApiKeyEncrypted;
      this.save();
      return;
    }

    const encryptedBase64 = this.encrypt(trimmed);
    if (provider === 'gemini') {
      this.secrets.geminiApiKeyEncrypted = encryptedBase64;
    } else if (provider === 'deepseek') {
      this.secrets.deepseekApiKeyEncrypted = encryptedBase64;
    }
    this.save();
  }

  getApiKey(provider: SupportedLlmProvider): string | null {
    const enc =
      provider === 'gemini'
        ? this.secrets.geminiApiKeyEncrypted
        : this.secrets.deepseekApiKeyEncrypted;

    if (!enc) return null;
    return this.decrypt(enc);
  }

  hasApiKey(provider: SupportedLlmProvider): boolean {
    const key = this.getApiKey(provider);
    return Boolean(key && key.length > 0);
  }

  getStatus(): SecretsStatus {
    return {
      hasGeminiKey: this.hasApiKey('gemini'),
      hasDeepseekKey: this.hasApiKey('deepseek')
    };
  }

  private encrypt(plainText: string): string {
    const canUseSafeStorage =
      !process.env.VITEST &&
      typeof safeStorage?.isEncryptionAvailable === 'function' &&
      safeStorage.isEncryptionAvailable();

    if (canUseSafeStorage) {
      const buffer = safeStorage.encryptString(plainText);
      return `dpapi:${buffer.toString('base64')}`;
    }

    // Fallback cho môi trường kiểm thử / headless Vitest
    const encoded = Buffer.from(plainText, 'utf-8').toString('base64');
    return `test:${encoded}`;
  }

  private decrypt(cipherText: string): string | null {
    try {
      if (cipherText.startsWith('dpapi:')) {
        const raw = cipherText.slice(6);
        const buffer = Buffer.from(raw, 'base64');
        return safeStorage.decryptString(buffer);
      }
      if (cipherText.startsWith('test:')) {
        const raw = cipherText.slice(5);
        return Buffer.from(raw, 'base64').toString('utf-8');
      }
      return null;
    } catch (err) {
      console.error('Failed to decrypt secret:', err);
      return null;
    }
  }

  private load(): void {
    if (existsSync(this.filePath)) {
      try {
        const content = readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(content) as StoredSecrets;
        if (typeof parsed === 'object' && parsed !== null) {
          this.secrets = parsed;
        }
      } catch (err) {
        console.error('Failed to load secrets store, starting clean:', err);
        this.secrets = {};
      }
    }
  }

  private save(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.filePath, JSON.stringify(this.secrets, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save secrets store:', err);
    }
  }
}
