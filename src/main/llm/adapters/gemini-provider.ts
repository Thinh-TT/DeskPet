import { LLMMessage, LLMProvider, LLMStreamOptions } from '../types';

export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';

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
      throw new Error('Chưa cấu hình Gemini API Key. Vui lòng vào Cài đặt để thêm key.');
    }

    const model = this.modelProvider() || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    // Tách system messages và chat contents
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const contents = conversationMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const bodyPayload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7
      }
    };

    if (systemMessages.length > 0) {
      bodyPayload.systemInstruction = {
        parts: systemMessages.map((m) => ({ text: m.content }))
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload),
      signal: options?.signal
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (response.status === 429) {
        throw new Error('Đã chạm giới hạn tần suất yêu cầu (Rate Limit 429) từ Gemini.');
      }
      if (response.status === 400 || response.status === 403) {
        throw new Error(
          `Gemini API Key hoặc mô hình không hợp lệ (${response.status}): ${errText}`
        );
      }
      throw new Error(`Lỗi kết nối Gemini (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error('Không nhận được phản hồi body từ Gemini.');
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
                candidates?: Array<{
                  content?: {
                    parts?: Array<{ text?: string }>;
                  };
                }>;
              };

              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield text;
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

    const model = this.modelProvider() || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
