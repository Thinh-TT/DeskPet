import { BehaviorConfig, DEFAULT_BEHAVIOR_CONFIG, PetState } from './types';

export type StateMachineEvent =
  | { type: 'TICK'; dtMs: number }
  | { type: 'CLICK' }
  | { type: 'DRAG_START' }
  | { type: 'DRAG_END'; isOnGround: boolean }
  | { type: 'LANDED' }
  | { type: 'FORCE_STATE'; state: PetState };

export class BehaviorStateMachine {
  private currentState: PetState = 'idle';
  private stateTimerMs = 0;
  private targetDurationMs = 0;
  private readonly config: BehaviorConfig;

  constructor(config: Partial<BehaviorConfig> = {}) {
    this.config = { ...DEFAULT_BEHAVIOR_CONFIG, ...config };
    this.targetDurationMs = this.randomBetween(
      this.config.idleDurationMin,
      this.config.idleDurationMax
    );
  }

  getState(): PetState {
    return this.currentState;
  }

  dispatch(event: StateMachineEvent): PetState {
    switch (event.type) {
      case 'FORCE_STATE':
        this.transitionTo(event.state);
        return this.currentState;

      case 'CLICK':
        if (this.currentState !== 'dragged') {
          this.transitionTo('react');
        }
        return this.currentState;

      case 'DRAG_START':
        this.transitionTo('dragged');
        return this.currentState;

      case 'DRAG_END':
        if (this.currentState === 'dragged') {
          if (event.isOnGround) {
            this.transitionTo('idle');
          } else {
            this.transitionTo('falling');
          }
        }
        return this.currentState;

      case 'LANDED':
        if (this.currentState === 'falling') {
          this.transitionTo('land');
        }
        return this.currentState;

      case 'TICK':
        this.updateTick(event.dtMs);
        return this.currentState;
    }
  }

  private updateTick(dtMs: number): void {
    this.stateTimerMs += dtMs;

    switch (this.currentState) {
      case 'idle':
        if (this.stateTimerMs >= this.targetDurationMs) {
          const rand = Math.random();
          if (rand < 0.6) {
            this.transitionTo('walk');
          } else if (rand < 0.85) {
            this.transitionTo('sit');
          } else {
            this.transitionTo('sleep');
          }
        }
        break;

      case 'walk':
        if (this.stateTimerMs >= this.targetDurationMs) {
          this.transitionTo('idle');
        }
        break;

      case 'sit':
        if (this.stateTimerMs >= this.targetDurationMs) {
          this.transitionTo('idle');
        }
        break;

      case 'sleep':
        if (this.stateTimerMs >= this.targetDurationMs) {
          this.transitionTo('idle');
        }
        break;

      case 'react':
        if (this.stateTimerMs >= this.config.reactDuration) {
          this.transitionTo('idle');
        }
        break;

      case 'land':
        if (this.stateTimerMs >= this.config.landDuration) {
          this.transitionTo('idle');
        }
        break;

      case 'dragged':
      case 'falling':
        // Duration not time-based
        break;
    }
  }

  private transitionTo(newState: PetState): void {
    this.currentState = newState;
    this.stateTimerMs = 0;

    switch (newState) {
      case 'idle':
        this.targetDurationMs = this.randomBetween(
          this.config.idleDurationMin,
          this.config.idleDurationMax
        );
        break;
      case 'walk':
        this.targetDurationMs = this.randomBetween(
          this.config.walkDurationMin,
          this.config.walkDurationMax
        );
        break;
      case 'sit':
        this.targetDurationMs = this.randomBetween(
          this.config.sitDurationMin,
          this.config.sitDurationMax
        );
        break;
      case 'sleep':
        this.targetDurationMs = this.randomBetween(
          this.config.sleepDurationMin,
          this.config.sleepDurationMax
        );
        break;
      default:
        this.targetDurationMs = 0;
        break;
    }
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
