import { describe, it, expect } from 'vitest';
import { PetPingPayloadSchema, PetPingResponseSchema } from '../../src/shared/ipc/channels';

describe('Shared IPC Schemas', () => {
  it('should validate valid PetPingPayload', () => {
    const valid = { message: 'hello' };
    const result = PetPingPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe('hello');
    }
  });

  it('should reject invalid PetPingPayload with empty string', () => {
    const invalid = { message: '' };
    const result = PetPingPayloadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should validate valid PetPingResponse', () => {
    const valid = {
      reply: 'Pong: hello',
      timestamp: 1700000000000
    };
    const result = PetPingResponseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
