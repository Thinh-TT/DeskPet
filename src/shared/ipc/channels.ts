import { z } from 'zod';

export const IpcChannel = {
  APP_GET_VERSION: 'app:get-version',
  PET_PING: 'pet:ping'
} as const;

export type IpcChannelType = (typeof IpcChannel)[keyof typeof IpcChannel];

export const PetPingPayloadSchema = z.object({
  message: z.string().min(1)
});

export type PetPingPayload = z.infer<typeof PetPingPayloadSchema>;

export const PetPingResponseSchema = z.object({
  reply: z.string(),
  timestamp: z.number()
});

export type PetPingResponse = z.infer<typeof PetPingResponseSchema>;

export interface DeskPetApi {
  getVersion: () => Promise<string>;
  ping: (payload: PetPingPayload) => Promise<PetPingResponse>;
}
