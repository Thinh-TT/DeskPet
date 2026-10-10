export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMStreamOptions {
  signal?: AbortSignal;
  temperature?: number;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  streamChat(messages: LLMMessage[], options?: LLMStreamOptions): AsyncIterable<string>;
  testConnection(): Promise<boolean>;
}
