export interface EmotionTagParserOptions {
  onEmotion?: (emotion: string) => void;
}

export class EmotionTagParser {
  private buffer = '';
  private onEmotion?: (emotion: string) => void;
  private emotionDetected: string | null = null;

  constructor(options?: EmotionTagParserOptions) {
    this.onEmotion = options?.onEmotion;
  }

  getDetectedEmotion(): string | null {
    return this.emotionDetected;
  }

  feed(chunk: string): string {
    this.buffer += chunk;
    let output = '';

    while (this.buffer.length > 0) {
      const openBracketIdx = this.buffer.indexOf('[');

      // Nếu không có '[' trong buffer, toàn bộ là text an toàn
      if (openBracketIdx === -1) {
        output += this.buffer;
        this.buffer = '';
        break;
      }

      // Có '[' nhưng trước nó có text an toàn
      if (openBracketIdx > 0) {
        output += this.buffer.slice(0, openBracketIdx);
        this.buffer = this.buffer.slice(openBracketIdx);
        continue;
      }

      // buffer bắt đầu bằng '['
      const closeBracketIdx = this.buffer.indexOf(']');

      // Chưa có ']', kiểm tra xem đoạn đang có có khớp tiền tố "[emotion:" không
      if (closeBracketIdx === -1) {
        const potentialTag = '[emotion:';
        // Nếu buffer dài hơn potentialTag mà không bắt đầu bằng potentialTag, thì không phải thẻ emotion
        if (
          this.buffer.length >= potentialTag.length &&
          !this.buffer.startsWith(potentialTag)
        ) {
          output += this.buffer[0];
          this.buffer = this.buffer.slice(1);
          continue;
        }

        // Nếu buffer ngắn hơn potentialTag nhưng không khớp prefix của nó
        if (!potentialTag.startsWith(this.buffer)) {
          output += this.buffer[0];
          this.buffer = this.buffer.slice(1);
          continue;
        }

        // Khớp một phần tiền tố, giữ lại buffer chờ chunk tiếp theo
        break;
      }

      // Đã có cả '[' và ']'
      const candidateTag = this.buffer.slice(0, closeBracketIdx + 1);
      const match = candidateTag.match(/^\[emotion:([a-zA-Z0-9_-]+)\]$/i);

      if (match) {
        const emotionName = match[1].toLowerCase();
        this.emotionDetected = emotionName;
        this.onEmotion?.(emotionName);
        // Bỏ qua thẻ, không thêm vào output
        this.buffer = this.buffer.slice(closeBracketIdx + 1);
        // Bỏ khoảng trắng ngay sau thẻ nếu có
        if (this.buffer.startsWith(' ')) {
          this.buffer = this.buffer.slice(1);
        }
      } else {
        // Không phải thẻ [emotion:...], emit ký tự '[' và tiếp tục
        output += this.buffer[0];
        this.buffer = this.buffer.slice(1);
      }
    }

    return output;
  }

  flush(): string {
    const remaining = this.buffer;
    this.buffer = '';
    return remaining;
  }
}
