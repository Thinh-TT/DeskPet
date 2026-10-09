export type PetState =
  | 'idle'
  | 'walk'
  | 'sit'
  | 'sleep'
  | 'dragged'
  | 'falling'
  | 'land'
  | 'react';

export type FacingDirection = 'left' | 'right';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Bounds2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PetSnapshot {
  state: PetState;
  position: Vector2D;
  velocity: Vector2D;
  facing: FacingDirection;
  scale: number;
}

export interface BehaviorConfig {
  walkSpeed: number; // pixels per second
  gravity: number; // pixels per second^2
  idleDurationMin: number; // ms
  idleDurationMax: number; // ms
  walkDurationMin: number; // ms
  walkDurationMax: number; // ms
  sitDurationMin: number; // ms
  sitDurationMax: number; // ms
  sleepDurationMin: number; // ms
  sleepDurationMax: number; // ms
  reactDuration: number; // ms
  landDuration: number; // ms
}

export const DEFAULT_BEHAVIOR_CONFIG: BehaviorConfig = {
  walkSpeed: 60,
  gravity: 980,
  idleDurationMin: 3000,
  idleDurationMax: 8000,
  walkDurationMin: 4000,
  walkDurationMax: 10000,
  sitDurationMin: 6000,
  sitDurationMax: 15000,
  sleepDurationMin: 12000,
  sleepDurationMax: 30000,
  reactDuration: 1200,
  landDuration: 800
};
