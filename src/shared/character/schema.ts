import { z } from 'zod';

export const AnchorPointSchema = z.enum(['feet', 'head', 'center']);
export type AnchorPoint = z.infer<typeof AnchorPointSchema>;

export const ClipConfigSchema = z.object({
  pattern: z.string().min(1),
  count: z.number().int().positive(),
  fps: z.number().positive(),
  loop: z.boolean(),
  anchor: AnchorPointSchema.optional().default('feet'),
  ready: z.boolean().default(true)
});
export type ClipConfig = z.infer<typeof ClipConfigSchema>;

export const ExitTransitionSchema = z.union([
  z.string(),
  z.object({
    clip: z.string(),
    reverse: z.boolean().optional()
  })
]);
export type ExitTransition = z.infer<typeof ExitTransitionSchema>;

export const StateConfigSchema = z.object({
  clip: z.string(),
  fallbackPose: z.string().optional(),
  motion: z.string().optional(),
  facing: z.enum(['left', 'right']).optional(),
  mirrorForLeft: z.boolean().optional(),
  enter: z.string().optional(),
  exit: ExitTransitionSchema.optional(),
  next: z.string().optional(),
  mouth: z.string().optional()
});
export type StateConfig = z.infer<typeof StateConfigSchema>;

export const EmotionConfigSchema = z.object({
  expression: z.string(),
  motion: z.string().optional()
});
export type EmotionConfig = z.infer<typeof EmotionConfigSchema>;

export const CharacterManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.string().optional(),
  renderer: z.enum(['sprite', 'layered', 'live2d']).default('sprite'),
  size: z.object({
    w: z.number().positive(),
    h: z.number().positive()
  }),
  anchor: z.object({
    x: z.number(),
    y: z.number()
  }),
  persona: z.string().optional(),
  address: z
    .object({
      self: z.string(),
      user: z.string()
    })
    .optional(),
  base: z.string().min(1),
  states: z.record(StateConfigSchema),
  poses: z.record(z.string()).default({}),
  clips: z.record(ClipConfigSchema).default({}),
  expressions: z.record(z.string()).default({}),
  emotions: z.record(EmotionConfigSchema).default({}),
  mouth: z.record(z.string()).default({})
});

export type CharacterManifest = z.infer<typeof CharacterManifestSchema>;
