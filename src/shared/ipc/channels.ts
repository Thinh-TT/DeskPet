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
  PET_UPDATE_SETTINGS: 'pet:update-settings'
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
    'react'
  ]),
  position: z.object({ x: z.number(), y: z.number() }),
  velocity: z.object({ x: z.number(), y: z.number() }),
  facing: z.enum(['left', 'right']),
  scale: z.number()
});
export type PetSnapshot = z.infer<typeof PetSnapshotSchema>;

// Settings
export const AppSettingsSchema = z.object({
  characterId: z.string().default('odette'),
  scale: z.number().positive().default(1.0),
  walkSpeed: z.number().positive().default(60),
  autoStart: z.boolean().default(false)
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

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
}
