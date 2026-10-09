import { describe, it, expect } from 'vitest';
import {
  PetPingPayloadSchema,
  PetPingResponseSchema,
  PetUserActionPayloadSchema,
  PetSnapshotSchema,
  AppSettingsSchema
} from '../../src/shared/ipc/channels';

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

  it('should validate PetUserActionPayload discriminated union', () => {
    expect(PetUserActionPayloadSchema.safeParse({ action: 'click' }).success).toBe(true);
    expect(
      PetUserActionPayloadSchema.safeParse({
        action: 'dragMove',
        position: { x: 100, y: 200 }
      }).success
    ).toBe(true);
    expect(PetUserActionPayloadSchema.safeParse({ action: 'unknown' }).success).toBe(false);
  });

  it('should validate PetSnapshotSchema', () => {
    const snapshot = {
      state: 'walk',
      position: { x: 50, y: 100 },
      velocity: { x: 60, y: 0 },
      facing: 'right',
      scale: 1.0
    };
    expect(PetSnapshotSchema.safeParse(snapshot).success).toBe(true);
  });

  it('should apply defaults for AppSettingsSchema', () => {
    const parsed = AppSettingsSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.characterId).toBe('odette');
      expect(parsed.data.scale).toBe(1.0);
      expect(parsed.data.autoStart).toBe(false);
    }
  });
});
