import { describe, it, expect } from 'vitest';
import { PhysicsSimulation } from '../../src/main/behavior/physics';

describe('PhysicsSimulation', () => {
  const bounds = { x: 0, y: 0, width: 1000, height: 600 };

  it('should bounce/turn around when reaching boundary during walk', () => {
    const physics = new PhysicsSimulation({ x: 900, y: 600 }, bounds, 100);

    // Walking right approaching right bound (maxX = 1000 - 50 = 950)
    const res1 = physics.updateWalk(1.0, 100, 'right');
    // x = 900 + 100 = 1000 -> clamped to 950 -> turns left
    expect(res1.facing).toBe('left');
    expect(physics.getPosition().x).toBe(950);
  });

  it('should fall and report landed when reaching ground', () => {
    // Initial at y = 100 (high up), ground is at 600
    const physics = new PhysicsSimulation({ x: 500, y: 100 }, bounds, 100, 500);

    const step1 = physics.updateFalling(0.5);
    expect(step1.hasLanded).toBe(false);
    expect(physics.getPosition().y).toBeGreaterThan(100);

    // Run enough time to hit ground
    const step2 = physics.updateFalling(3.0);
    expect(step2.hasLanded).toBe(true);
    expect(physics.getPosition().y).toBe(600);
  });
});
