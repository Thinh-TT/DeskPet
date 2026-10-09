import { describe, it, expect } from 'vitest';
import { BehaviorStateMachine } from '../../src/main/behavior/state-machine';

describe('BehaviorStateMachine', () => {
  it('should initialize in idle state', () => {
    const sm = new BehaviorStateMachine();
    expect(sm.getState()).toBe('idle');
  });

  it('should transition to react on CLICK when not dragged', () => {
    const sm = new BehaviorStateMachine();
    sm.dispatch({ type: 'CLICK' });
    expect(sm.getState()).toBe('react');
  });

  it('should return to idle after react duration completes', () => {
    const sm = new BehaviorStateMachine({ reactDuration: 500 });
    sm.dispatch({ type: 'CLICK' });
    expect(sm.getState()).toBe('react');

    sm.dispatch({ type: 'TICK', dtMs: 600 });
    expect(sm.getState()).toBe('idle');
  });

  it('should transition to dragged on DRAG_START', () => {
    const sm = new BehaviorStateMachine();
    sm.dispatch({ type: 'DRAG_START' });
    expect(sm.getState()).toBe('dragged');
  });

  it('should transition to falling on DRAG_END when not on ground', () => {
    const sm = new BehaviorStateMachine();
    sm.dispatch({ type: 'DRAG_START' });
    sm.dispatch({ type: 'DRAG_END', isOnGround: false });
    expect(sm.getState()).toBe('falling');
  });

  it('should transition to land on LANDED after falling', () => {
    const sm = new BehaviorStateMachine({ landDuration: 400 });
    sm.dispatch({ type: 'DRAG_START' });
    sm.dispatch({ type: 'DRAG_END', isOnGround: false });
    sm.dispatch({ type: 'LANDED' });
    expect(sm.getState()).toBe('land');

    sm.dispatch({ type: 'TICK', dtMs: 500 });
    expect(sm.getState()).toBe('idle');
  });

  it('should transition to idle on DRAG_END if dropped on ground', () => {
    const sm = new BehaviorStateMachine();
    sm.dispatch({ type: 'DRAG_START' });
    sm.dispatch({ type: 'DRAG_END', isOnGround: true });
    expect(sm.getState()).toBe('idle');
  });
});
