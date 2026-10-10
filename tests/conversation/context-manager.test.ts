import { describe, it, expect } from 'vitest';
import { ContextManager } from '../../src/main/conversation/context-manager';
import { CharacterManifest } from '../../src/shared/character/schema';

describe('ContextManager', () => {
  const dummyManifest: CharacterManifest = {
    id: 'odette',
    name: 'Odette',
    renderer: 'sprite',
    size: { w: 192, h: 384 },
    anchor: { x: 0.5, y: 1.0 },
    base: 'master/front_neutral.png',
    address: { self: 'tôi', user: 'bạn' },
    emotions: {
      neutral: { expression: 'neutral' },
      happy: { expression: 'happy', motion: 'hop' },
      shy: { expression: 'shy' }
    },
    states: {
      idle: { clip: 'idle' }
    },
    poses: {},
    clips: {},
    expressions: {},
    mouth: {}
  };

  it('xây dựng system prompt chuẩn mực với danh sách thẻ cảm xúc và xưng hô', () => {
    const manager = new ContextManager();
    manager.loadCharacter('', dummyManifest);

    const prompt = manager.getSystemPrompt();
    expect(prompt).toContain('Bạn là Odette');
    expect(prompt).toContain('Xưng là "tôi"');
    expect(prompt).toContain('gọi người dùng là "bạn"');
    expect(prompt).toContain('neutral, happy, shy');
    expect(prompt).toContain('[emotion:<tên>]');
  });

  it('quản lý lịch sử và sliding window đúng giới hạn', () => {
    const manager = new ContextManager();
    manager.loadCharacter('', dummyManifest);

    for (let i = 1; i <= 20; i++) {
      manager.addMessage(i % 2 === 1 ? 'user' : 'assistant', `Tin nhắn ${i}`);
    }

    expect(manager.getHistory().length).toBe(20);

    const llmMessages = manager.buildLLMMessages(6);
    // 1 system prompt + 6 tin nhắn gần nhất
    expect(llmMessages.length).toBe(7);
    expect(llmMessages[0].role).toBe('system');
    expect(llmMessages[1].content).toBe('Tin nhắn 15');
    expect(llmMessages[6].content).toBe('Tin nhắn 20');
  });

  it('xoá lịch sử hoạt động chính xác', () => {
    const manager = new ContextManager();
    manager.addMessage('user', 'Hello');
    expect(manager.getHistory().length).toBe(1);

    manager.clearHistory();
    expect(manager.getHistory().length).toBe(0);
  });
});
