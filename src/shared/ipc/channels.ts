import { z } from 'zod';
import type { CharacterManifest } from '../character/schema';

export const IpcChannel = {
  APP_GET_VERSION: 'app:get-version',
  PET_PING: 'pet:ping',
  PET_GET_CHARACTER: 'pet:get-character',
  PET_SET_IGNORE_MOUSE: 'pet:set-ignore-mouse',
  PET_STATE_UPDATE: 'pet:state-update',
  PET_USER_ACTION: 'pet:user-action',
  PET_CHANGE_CHARACTER: 'pet:change-character',
  PET_GET_SETTINGS: 'pet:get-settings',
  PET_UPDATE_SETTINGS: 'pet:update-settings',
  // Chat & LLM
  CHAT_SEND_MESSAGE: 'chat:send-message',
  CHAT_STREAM_CHUNK: 'chat:stream-chunk',
  CHAT_STREAM_DONE: 'chat:stream-done',
  CHAT_STREAM_ERROR: 'chat:stream-error',
  CHAT_GET_HISTORY: 'chat:get-history',
  CHAT_CLEAR_HISTORY: 'chat:clear-history',
  CHAT_TOGGLE_WINDOW: 'chat:toggle-window',
  CHAT_TEST_CONNECTION: 'chat:test-connection',
  // Secrets
  SECRETS_SET_KEY: 'secrets:set-key',
  SECRETS_GET_STATUS: 'secrets:get-status'
} as const;

export type IpcChannelType = (typeof IpcChannel)[keyof typeof IpcChannel];

// Ping
export const PetPingPayloadSchema = z.object({
  message: z.string().min(1)
});
export type PetPingPayload = z.infer<typeof PetPingPayloadSchema>;

export const PetPingResponseSchema = z.object({
  reply: z.string(),
  timestamp: z.number()
});
export type PetPingResponse = z.infer<typeof PetPingResponseSchema>;

// Ignore mouse
export const SetIgnoreMousePayloadSchema = z.object({
  ignore: z.boolean()
});
export type SetIgnoreMousePayload = z.infer<typeof SetIgnoreMousePayloadSchema>;

// User Action
export const PetUserActionPayloadSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('click') }),
  z.object({ action: z.literal('dblclick') }),
  z.object({ action: z.literal('dragStart') }),
  z.object({
    action: z.literal('dragMove'),
    position: z.object({ x: z.number(), y: z.number() })
  }),
  z.object({
    action: z.literal('dragEnd'),
    position: z.object({ x: z.number(), y: z.number() })
  }),
  z.object({ action: z.literal('contextMenu') })
]);
export type PetUserActionPayload = z.infer<typeof PetUserActionPayloadSchema>;

// State snapshot
export const PetSnapshotSchema = z.object({
  state: z.enum([
    'idle',
    'walk',
    'sit',
    'sleep',
    'dragged',
    'falling',
    'land',
    'react',
    'think',
    'talk',
    'listen'
  ]),
  position: z.object({ x: z.number(), y: z.number() }),
  velocity: z.object({ x: z.number(), y: z.number() }),
  facing: z.enum(['left', 'right']),
  scale: z.number(),
  expression: z.string().optional()
});
export type PetSnapshot = z.infer<typeof PetSnapshotSchema>;

// Settings
export const AppSettingsSchema = z.object({
  characterId: z.string().default('odette'),
  scale: z.number().positive().default(1.0),
  walkSpeed: z.number().positive().default(60),
  autoStart: z.boolean().default(false),
  llmProvider: z.enum(['gemini', 'deepseek']).default('gemini'),
  geminiModel: z.string().default('gemini-2.5-flash'),
  deepseekModel: z.string().default('deepseek-chat'),
  temperature: z.number().min(0).max(2).default(0.7)
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

// Chat message
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.number(),
  emotion: z.string().optional()
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatSendMessagePayloadSchema = z.object({
  text: z.string().min(1)
});
export type ChatSendMessagePayload = z.infer<typeof ChatSendMessagePayloadSchema>;

export const ChatStreamChunkSchema = z.object({
  messageId: z.string(),
  delta: z.string()
});
export type ChatStreamChunk = z.infer<typeof ChatStreamChunkSchema>;

export const ChatStreamDoneSchema = z.object({
  messageId: z.string(),
  fullContent: z.string(),
  emotion: z.string().optional()
});
export type ChatStreamDone = z.infer<typeof ChatStreamDoneSchema>;

export const ChatStreamErrorSchema = z.object({
  messageId: z.string(),
  error: z.string()
});
export type ChatStreamError = z.infer<typeof ChatStreamErrorSchema>;

// Secrets
export const SecretsSetKeyPayloadSchema = z.object({
  provider: z.enum(['gemini', 'deepseek']),
  apiKey: z.string().min(1)
});
export type SecretsSetKeyPayload = z.infer<typeof SecretsSetKeyPayloadSchema>;

export const SecretsStatusSchema = z.object({
  hasGeminiKey: z.boolean(),
  hasDeepseekKey: z.boolean()
});
export type SecretsStatus = z.infer<typeof SecretsStatusSchema>;

// DeskPet API exposed in Preload
export interface DeskPetApi {
  getVersion: () => Promise<string>;
  ping: (payload: PetPingPayload) => Promise<PetPingResponse>;
  getCharacter: () => Promise<CharacterManifest>;
  setIgnoreMouse: (ignore: boolean) => Promise<void>;
  sendUserAction: (action: PetUserActionPayload) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  onStateUpdate: (callback: (snapshot: PetSnapshot) => void) => () => void;
  onCharacterChanged: (callback: (manifest: CharacterManifest) => void) => () => void;

  // Chat APIs
  sendMessage: (payload: ChatSendMessagePayload) => Promise<void>;
  getChatHistory: () => Promise<ChatMessage[]>;
  clearChatHistory: () => Promise<void>;
  toggleChatWindow: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; message: string }>;
  onStreamChunk: (callback: (chunk: ChatStreamChunk) => void) => () => void;
  onStreamDone: (callback: (done: ChatStreamDone) => void) => () => void;
  onStreamError: (callback: (err: ChatStreamError) => void) => () => void;

  // Secrets APIs
  setApiKey: (payload: SecretsSetKeyPayload) => Promise<void>;
  getSecretsStatus: () => Promise<SecretsStatus>;
}
