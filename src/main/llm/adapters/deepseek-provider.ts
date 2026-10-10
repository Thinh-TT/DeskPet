import { LLMMessage, LLMProvider, LLMStreamOptions } from '../types';

export class DeepSeekProvider implements LLMProvider {
  readonly id = 'deepseek';
  readonly name = 'DeepSeek';

  private apiKeyProvider: () => string | null;
  private modelProvider: () => string;

  constructor(apiKeyProvider: () => string | null, modelProvider: () => string) {
    this.apiKeyProvider = apiKeyProvider;
    this.modelProvider = modelProvider;
  }

  async *streamChat(
    messages: LLMMessage[],
    options?: LLMStreamOptions
  ): AsyncIterable<string> {
    const apiKey = this.apiKeyProvider();
    if (!apiKey) {
      throw new Error(
        'Chưa cấu hình DeepSeek API Key. Vui lòng vào Cài đặt để thêm key.'
      );
    }

    const model = this.modelProvider() || 'deepseek-chat';
    const url = 'https://api.deepseek.com/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: options?.temperature ?? 0.7
      }),
      signal: options?.signal
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (response.status === 429) {
        throw new Error('Đã chạm giới hạn tần suất yêu cầu (Rate Limit 429) từ DeepSeek.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `DeepSeek API Key không hợp lệ hoặc đã hết hạn (${response.status}): ${errText}`
        );
      }
      throw new Error(`Lỗi kết nối DeepSeek (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error('Không nhận được phản hồi body từ DeepSeek.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr) as {
                choices?: Array<{
                  delta?: {
                    content?: string;
                  };
                }>;
              };

              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                yield delta;
              }
            } catch {
              // Bỏ qua dòng json chưa hoàn chỉnh
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async testConnection(): Promise<boolean> {
    const apiKey = this.apiKeyProvider();
    if (!apiKey) return false;

    const model = this.modelProvider() || 'deepseek-chat';
    const url = 'https://api.deepseek.com/chat/completions';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
