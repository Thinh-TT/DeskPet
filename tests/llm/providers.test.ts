import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../../src/main/llm/adapters/gemini-provider';
import { DeepSeekProvider } from '../../src/main/llm/adapters/deepseek-provider';

describe('LLM Providers with Mock Fetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GeminiProvider', () => {
    it('báo lỗi khi chưa có API Key', async () => {
      const provider = new GeminiProvider(
        () => null,
        () => 'gemini-2.5-flash'
      );
      await expect(async () => {
        for await (const _ of provider.streamChat([{ role: 'user', content: 'hi' }])) {
          // no-op
        }
      }).rejects.toThrow('Chưa cấu hình Gemini API Key');
    });

    it('giải mã SSE stream từ Gemini thành công', async () => {
      const sseChunks = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Xin chào "}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"bạn!"}]}}]}\n\n'
      ];

      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          for (const chunk of sseChunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: stream
      } as unknown as Response);

      const provider = new GeminiProvider(
        () => 'test-key',
        () => 'gemini-2.5-flash'
      );

      const deltas: string[] = [];
      for await (const delta of provider.streamChat([{ role: 'user', content: 'chào' }])) {
        deltas.push(delta);
      }

      expect(deltas.join('')).toBe('Xin chào bạn!');
    });

    it('bắt lỗi rate limit 429', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Quota exceeded'
      } as unknown as Response);

      const provider = new GeminiProvider(
        () => 'test-key',
        () => 'gemini-2.5-flash'
      );

      await expect(async () => {
        for await (const _ of provider.streamChat([{ role: 'user', content: 'test' }])) {
          // no-op
        }
      }).rejects.toThrow('Rate Limit 429');
    });
  });

  describe('DeepSeekProvider', () => {
    it('giải mã SSE stream từ DeepSeek thành công', async () => {
      const sseChunks = [
        'data: {"choices":[{"delta":{"content":"Tôi là "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Odette."}}]}\n\n',
        'data: [DONE]\n\n'
      ];

      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          for (const chunk of sseChunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: stream
      } as unknown as Response);

      const provider = new DeepSeekProvider(
        () => 'test-key',
        () => 'deepseek-chat'
      );

      const deltas: string[] = [];
      for await (const delta of provider.streamChat([{ role: 'user', content: 'bạn là ai' }])) {
        deltas.push(delta);
      }

      expect(deltas.join('')).toBe('Tôi là Odette.');
    });
  });
});
