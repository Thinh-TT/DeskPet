import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationOrchestrator } from '../../src/main/conversation/orchestrator';
import { ContextManager } from '../../src/main/conversation/context-manager';
import { LLMManager } from '../../src/main/llm/llm-manager';
import { LLMProvider } from '../../src/main/llm/types';

describe('ConversationOrchestrator', () => {
  let contextManager: ContextManager;
  let mockLLMManager: LLMManager;
  let mockProvider: LLMProvider;

  beforeEach(() => {
    contextManager = new ContextManager();
    mockProvider = {
      id: 'mock',
      name: 'Mock LLM',
      async *streamChat() {
        yield '[emotion:happy] Chào ';
        yield 'bạn nha!';
      },
      testConnection: async () => true
    };

    mockLLMManager = {
      getActiveProvider: () => mockProvider,
      getProvider: () => mockProvider,
      testActiveConnection: async () => ({ success: true, message: 'ok' })
    } as unknown as LLMManager;
  });

  it('điều phối luồng chat, phát sự kiện cảm xúc và stream delta sạch', async () => {
    const orchestrator = new ConversationOrchestrator(contextManager, mockLLMManager);

    const chunks: string[] = [];
    const emotions: string[] = [];
    const states: string[] = [];
    let doneContent = '';

    await orchestrator.handleUserMessage('Xin chào', {
      onChunk: (_msgId, delta) => chunks.push(delta),
      onDone: (_msgId, fullContent, emotion) => {
        doneContent = fullContent;
        if (emotion) emotions.push(emotion);
      },
      onError: () => {},
      onEmotion: (emotion) => emotions.push(emotion),
      onStateChange: (state) => states.push(state)
    });

    expect(chunks.join('')).toBe('Chào bạn nha!');
    expect(doneContent).toBe('Chào bạn nha!');
    expect(emotions).toContain('happy');
    expect(states).toContain('think');
    expect(states).toContain('talk');

    const history = orchestrator.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('Xin chào');
    expect(history[1].role).toBe('assistant');
    expect(history[1].content).toBe('Chào bạn nha!');
    expect(history[1].emotion).toBe('happy');
  });

  it('xử lý lỗi khi stream bị gián đoạn và báo qua onError', async () => {
    mockProvider = {
      id: 'mock-err',
      name: 'Mock Error LLM',
      // eslint-disable-next-line require-yield
      async *streamChat() {
        throw new Error('Mạng bị mất kết nối');
      },
      testConnection: async () => false
    };

    mockLLMManager = {
      getActiveProvider: () => mockProvider
    } as unknown as LLMManager;

    const orchestrator = new ConversationOrchestrator(contextManager, mockLLMManager);
    let capturedError = '';

    await orchestrator.handleUserMessage('Alo', {
      onChunk: () => {},
      onDone: () => {},
      onError: (_msgId, error) => {
        capturedError = error;
      },
      onEmotion: () => {},
      onStateChange: () => {}
    });

    expect(capturedError).toContain('Mạng bị mất kết nối');
  });
});
