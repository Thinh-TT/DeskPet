import React, { useState, useEffect } from 'react';
import { AppSettings, SecretsStatus } from '@shared/ipc/channels';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [secretsStatus, setSecretsStatus] = useState<SecretsStatus | null>(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [deepseekKeyInput, setDeepseekKeyInput] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && window.deskPetApi) {
      void window.deskPetApi.getSettings().then(setSettings);
      void window.deskPetApi.getSecretsStatus().then(setSecretsStatus);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !settings) return null;

  const handleSave = async (): Promise<void> => {
    if (!window.deskPetApi) return;
    setIsSaving(true);
    try {
      await window.deskPetApi.updateSettings(settings);

      if (geminiKeyInput.trim()) {
        await window.deskPetApi.setApiKey({
          provider: 'gemini',
          apiKey: geminiKeyInput.trim()
        });
        setGeminiKeyInput('');
      }

      if (deepseekKeyInput.trim()) {
        await window.deskPetApi.setApiKey({
          provider: 'deepseek',
          apiKey: deepseekKeyInput.trim()
        });
        setDeepseekKeyInput('');
      }

      const updatedStatus = await window.deskPetApi.getSecretsStatus();
      setSecretsStatus(updatedStatus);
      setTestResult({ success: true, message: 'Đã lưu cấu hình thành công!' });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Lỗi lưu cấu hình: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (): Promise<void> => {
    if (!window.deskPetApi) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      // Lưu key tạm trước khi test nếu người dùng mới gõ
      if (settings.llmProvider === 'gemini' && geminiKeyInput.trim()) {
        await window.deskPetApi.setApiKey({ provider: 'gemini', apiKey: geminiKeyInput.trim() });
      } else if (settings.llmProvider === 'deepseek' && deepseekKeyInput.trim()) {
        await window.deskPetApi.setApiKey({ provider: 'deepseek', apiKey: deepseekKeyInput.trim() });
      }

      const res = await window.deskPetApi.testConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: `Lỗi test: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-header">
        <h3 className="settings-title">Cài đặt LLM & Trò chuyện</h3>
        <button className="btn-icon" onClick={onClose} title="Đóng">
          ✕
        </button>
      </div>

      <div className="settings-body">
        <div className="form-group">
          <label className="form-label">Nhà cung cấp LLM</label>
          <select
            className="form-select"
            value={settings.llmProvider}
            onChange={(e) =>
              setSettings({
                ...settings,
                llmProvider: e.target.value as 'gemini' | 'deepseek'
              })
            }
          >
            <option value="gemini">Google Gemini (Khuyên dùng)</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>

        {settings.llmProvider === 'gemini' && (
          <>
            <div className="form-group">
              <label className="form-label">Mô hình (Model)</label>
              <select
                className="form-select"
                value={settings.geminiModel}
                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Nhanh & Tốt nhất)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Gemini API Key{' '}
                {secretsStatus?.hasGeminiKey && (
                  <span style={{ color: 'var(--success)' }}>✓ Đã lưu an toàn</span>
                )}
              </label>
              <input
                type="password"
                className="form-input"
                placeholder={
                  secretsStatus?.hasGeminiKey
                    ? '•••••••• (Nhập mới để đổi key)'
                    : 'Nhập AIzaSy...'
                }
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
              />
            </div>
          </>
        )}

        {settings.llmProvider === 'deepseek' && (
          <>
            <div className="form-group">
              <label className="form-label">Mô hình (Model)</label>
              <select
                className="form-select"
                value={settings.deepseekModel}
                onChange={(e) => setSettings({ ...settings, deepseekModel: e.target.value })}
              >
                <option value="deepseek-chat">deepseek-chat</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                DeepSeek API Key{' '}
                {secretsStatus?.hasDeepseekKey && (
                  <span style={{ color: 'var(--success)' }}>✓ Đã lưu an toàn</span>
                )}
              </label>
              <input
                type="password"
                className="form-input"
                placeholder={
                  secretsStatus?.hasDeepseekKey
                    ? '•••••••• (Nhập mới để đổi key)'
                    : 'Nhập sk-...'
                }
                value={deepseekKeyInput}
                onChange={(e) => setDeepseekKeyInput(e.target.value)}
              />
            </div>
          </>
        )}

        {testResult && (
          <div className={`status-banner ${testResult.success ? 'success' : 'error'}`}>
            {testResult.message}
          </div>
        )}

        <div className="btn-row">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void handleTestConnection()}
            disabled={isTesting}
          >
            {isTesting ? 'Đang thử...' : 'Kiểm tra kết nối'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  );
};
