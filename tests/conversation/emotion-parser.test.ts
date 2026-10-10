import { describe, it, expect, vi } from 'vitest';
import { EmotionTagParser } from '../../src/main/conversation/emotion-parser';

describe('EmotionTagParser', () => {
  it('bóc tách thẻ cảm xúc nguyên khối và kích hoạt callback', () => {
    const onEmotion = vi.fn();
    const parser = new EmotionTagParser({ onEmotion });

    const text = parser.feed('[emotion:happy] Chào bạn, hôm nay thế nào?');
    const flushed = parser.flush();

    expect(text + flushed).toBe('Chào bạn, hôm nay thế nào?');
    expect(onEmotion).toHaveBeenCalledWith('happy');
    expect(parser.getDetectedEmotion()).toBe('happy');
  });

  it('xử lý thẻ cảm xúc bị ngắt thành nhiều chunk dở dang', () => {
    const onEmotion = vi.fn();
    const parser = new EmotionTagParser({ onEmotion });

    const c1 = parser.feed('[emo');
    const c2 = parser.feed('tion:soft] ');
    const c3 = parser.feed('Tôi ở đây.');
    const flushed = parser.flush();

    expect(c1).toBe('');
    expect(c2).toBe('');
    expect(c3).toBe('Tôi ở đây.');
    expect(flushed).toBe('');
    expect(onEmotion).toHaveBeenCalledWith('soft');
    expect(parser.getDetectedEmotion()).toBe('soft');
  });

  it('giữ nguyên dấu ngoặc vuông thông thường không phải thẻ cảm xúc', () => {
    const onEmotion = vi.fn();
    const parser = new EmotionTagParser({ onEmotion });

    const c1 = parser.feed('Đây là [ghi chú] và [123] thông thường.');
    const flushed = parser.flush();

    expect(c1 + flushed).toBe('Đây là [ghi chú] và [123] thông thường.');
    expect(onEmotion).not.toHaveBeenCalled();
  });

  it('xử lý chuỗi không có thẻ cảm xúc', () => {
    const onEmotion = vi.fn();
    const parser = new EmotionTagParser({ onEmotion });

    const output = parser.feed('Chào bạn, tôi là Odette.');
    const flushed = parser.flush();

    expect(output + flushed).toBe('Chào bạn, tôi là Odette.');
    expect(onEmotion).not.toHaveBeenCalled();
    expect(parser.getDetectedEmotion()).toBeNull();
  });
});
