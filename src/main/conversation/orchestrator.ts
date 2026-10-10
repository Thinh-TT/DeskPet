import { ContextManager } from './context-manager';
import { EmotionTagParser } from './emotion-parser';
import { LLMManager } from '../llm/llm-manager';
import { ChatMessage } from '../../shared/ipc/channels';

export interface OrchestratorCallbacks {
  onChunk: (messageId: string, delta: string) => void;
  onDone: (messageId: string, fullContent: string, emotion?: string) => void;
  onError: (messageId: string, error: string) => void;
  onEmotion: (emotion: string) => void;
  onStateChange: (state: 'think' | 'talk' | 'idle') => void;
}

export class ConversationOrchestrator {
  private contextManager: ContextManager;
  private llmManager: LLMManager;
  private isProcessing = false;
  private currentAbortController: AbortController | null = null;

  constructor(contextManager: ContextManager, llmManager: LLMManager) {
    this.contextManager = contextManager;
    this.llmManager = llmManager;
  }

  getContextManager(): ContextManager {
    return this.contextManager;
  }

  isBusy(): boolean {
    return this.isProcessing;
  }

  async handleUserMessage(
    userText: string,
    callbacks: OrchestratorCallbacks
  ): Promise<void> {
    const trimmed = userText.trim();
    if (!trimmed || this.isProcessing) return;

    this.isProcessing = true;
    this.currentAbortController = new AbortController();

    // 1. Thêm tin nhắn user vào lịch sử
    this.contextManager.addMessage('user', trimmed);

    const assistantMsgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let fullContent = '';
    let detectedEmotion: string | undefined;

    // 2. Chuyển Pet sang trạng thái suy nghĩ
    callbacks.onStateChange('think');

    try {
      const provider = this.llmManager.getActiveProvider();
      const messages = this.contextManager.buildLLMMessages();

      const parser = new EmotionTagParser({
        onEmotion: (emotion) => {
          detectedEmotion = emotion;
          callbacks.onEmotion(emotion);
          callbacks.onStateChange('talk');
        }
      });

      const stream = provider.streamChat(messages, {
        signal: this.currentAbortController.signal
      });

      for await (const chunk of stream) {
        const cleanDelta = parser.feed(chunk);
        if (cleanDelta) {
          fullContent += cleanDelta;
          callbacks.onChunk(assistantMsgId, cleanDelta);
        }
      }

      const tail = parser.flush();
      if (tail) {
        fullContent += tail;
        callbacks.onChunk(assistantMsgId, tail);
      }

      if (!detectedEmotion && parser.getDetectedEmotion()) {
        detectedEmotion = parser.getDetectedEmotion() || undefined;
      }

      // Lưu tin nhắn assistant vào ngữ cảnh
      this.contextManager.addMessage('assistant', fullContent, detectedEmotion);
      callbacks.onDone(assistantMsgId, fullContent, detectedEmotion);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      callbacks.onError(assistantMsgId, errorMsg);
    } finally {
      this.isProcessing = false;
      this.currentAbortController = null;
      // Chờ nhẹ trước khi chuyển về idle
      setTimeout(() => {
        callbacks.onStateChange('idle');
      }, 1500);
    }
  }

  abort(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
      this.isProcessing = false;
    }
  }

  getHistory(): ChatMessage[] {
    return this.contextManager.getHistory();
  }

  clearHistory(): void {
    this.contextManager.clearHistory();
  }
}
