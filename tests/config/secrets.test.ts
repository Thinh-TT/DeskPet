import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SecretsStore } from '../../src/main/config/secrets-store';

describe('SecretsStore', () => {
  let tempDir: string;
  let secretsPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'deskpet-secrets-test-'));
    secretsPath = join(tempDir, 'secrets.dat');
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('lưu và giải mã API key thành công', () => {
    const store = new SecretsStore(secretsPath);
    expect(store.hasApiKey('gemini')).toBe(false);
    expect(store.hasApiKey('deepseek')).toBe(false);

    store.setApiKey('gemini', 'test-gemini-key-12345');
    store.setApiKey('deepseek', 'test-deepseek-key-67890');

    expect(store.hasApiKey('gemini')).toBe(true);
    expect(store.hasApiKey('deepseek')).toBe(true);
    expect(store.getApiKey('gemini')).toBe('test-gemini-key-12345');
    expect(store.getApiKey('deepseek')).toBe('test-deepseek-key-67890');

    const status = store.getStatus();
    expect(status).toEqual({
      hasGeminiKey: true,
      hasDeepseekKey: true
    });
  });

  it('phục hồi bí mật sau khi nạp lại từ tệp', () => {
    const store1 = new SecretsStore(secretsPath);
    store1.setApiKey('gemini', 'persisted-key');

    const store2 = new SecretsStore(secretsPath);
    expect(store2.getApiKey('gemini')).toBe('persisted-key');
    expect(store2.getApiKey('deepseek')).toBeNull();
  });

  it('xoá API key khi gán chuỗi rỗng', () => {
    const store = new SecretsStore(secretsPath);
    store.setApiKey('gemini', 'initial-key');
    expect(store.hasApiKey('gemini')).toBe(true);

    store.setApiKey('gemini', '   ');
    expect(store.hasApiKey('gemini')).toBe(false);
    expect(store.getApiKey('gemini')).toBeNull();
  });
});
