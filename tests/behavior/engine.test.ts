import { describe, it, expect } from 'vitest';
import { BehaviorEngine } from '../../src/main/behavior/engine';

describe('BehaviorEngine', () => {
  const bounds = { x: 0, y: 0, width: 800, height: 600 };

  it('should initialize with snapshot at center bottom', () => {
    const engine = new BehaviorEngine(bounds);
    const snapshot = engine.getSnapshot();

    expect(snapshot.state).toBe('idle');
    expect(snapshot.position.x).toBe(400);
    expect(snapshot.position.y).toBe(600);
  });

  it('should notify listener on click', () => {
    const engine = new BehaviorEngine(bounds);
    let updatedState = '';

    engine.onUpdate((s) => {
      updatedState = s.state;
    });

    engine.handleClick();
    expect(updatedState).toBe('react');
  });

  it('should handle dragging and falling correctly', () => {
    const engine = new BehaviorEngine(bounds);
    engine.handleDragStart();
    expect(engine.getSnapshot().state).toBe('dragged');

    engine.handleDragMove({ x: 300, y: 200 });
    expect(engine.getSnapshot().position).toEqual({ x: 300, y: 200 });

    // Release in the air
    engine.handleDragEnd({ x: 300, y: 200 });
    expect(engine.getSnapshot().state).toBe('falling');

    // Tick until landed
    engine.tick(2000);
    expect(engine.getSnapshot().state).toBe('land');
  });
});
