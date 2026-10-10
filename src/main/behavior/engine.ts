import { BehaviorStateMachine } from './state-machine';
import { PhysicsSimulation } from './physics';
import {
  BehaviorConfig,
  Bounds2D,
  DEFAULT_BEHAVIOR_CONFIG,
  FacingDirection,
  PetSnapshot,
  Vector2D
} from './types';

export class BehaviorEngine {
  private readonly stateMachine: BehaviorStateMachine;
  private readonly physics: PhysicsSimulation;
  private facing: FacingDirection = 'right';
  private scale = 1.0;
  private currentExpression?: string;
  private config: BehaviorConfig;
  private intervalTimer: NodeJS.Timeout | null = null;
  private listeners: ((snapshot: PetSnapshot) => void)[] = [];
  private lastTickTime = 0;

  constructor(
    initialBounds: Bounds2D,
    config: Partial<BehaviorConfig> = {},
    petWidth = 192
  ) {
    this.config = { ...DEFAULT_BEHAVIOR_CONFIG, ...config };
    this.stateMachine = new BehaviorStateMachine(this.config);

    const initialPos: Vector2D = {
      x: initialBounds.width / 2,
      y: initialBounds.height
    };

    this.physics = new PhysicsSimulation(
      initialPos,
      initialBounds,
      petWidth,
      this.config.gravity
    );
  }

  getSnapshot(): PetSnapshot {
    return {
      state: this.stateMachine.getState(),
      position: this.physics.getPosition(),
      velocity: this.physics.getVelocity(),
      facing: this.facing,
      scale: this.scale,
      expression: this.currentExpression
    };
  }

  setBounds(bounds: Bounds2D): void {
    this.physics.setBounds(bounds);
    this.physics.clampToBounds();
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  setSpeed(speed: number): void {
    this.config.walkSpeed = speed;
  }

  setExpression(expression?: string): void {
    this.currentExpression = expression;
    this.notifyUpdate();
  }

  setPaused(paused: boolean): void {
    this.stateMachine.setPaused(paused);
  }

  onUpdate(callback: (snapshot: PetSnapshot) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  handleClick(): void {
    this.stateMachine.dispatch({ type: 'CLICK' });
    this.notifyUpdate();
  }

  handleDragStart(): void {
    this.stateMachine.dispatch({ type: 'DRAG_START' });
    this.notifyUpdate();
  }

  handleDragMove(pos: Vector2D): void {
    if (this.stateMachine.getState() === 'dragged') {
      this.physics.setPosition(pos);
      this.notifyUpdate();
    }
  }

  handleDragEnd(pos: Vector2D): void {
    if (this.stateMachine.getState() === 'dragged') {
      this.physics.setPosition(pos);
      const groundY = this.physics.getGroundY();
      // If position is within 20px of ground, consider it on ground
      const isOnGround = Math.abs(pos.y - groundY) <= 20;

      this.stateMachine.dispatch({ type: 'DRAG_END', isOnGround });
      this.notifyUpdate();
    }
  }

  forceState(state: PetSnapshot['state']): void {
    this.stateMachine.dispatch({ type: 'FORCE_STATE', state });
    this.notifyUpdate();
  }

  tick(dtMs: number): void {
    const dtSec = dtMs / 1000;
    const currentState = this.stateMachine.dispatch({ type: 'TICK', dtMs });

    if (currentState === 'walk') {
      const walkResult = this.physics.updateWalk(
        dtSec,
        this.config.walkSpeed,
        this.facing
      );
      this.facing = walkResult.facing;
    } else if (currentState === 'falling') {
      const fallResult = this.physics.updateFalling(dtSec);
      if (fallResult.hasLanded) {
        this.stateMachine.dispatch({ type: 'LANDED' });
      }
    }

    this.notifyUpdate();
  }

  start(tickRateHz = 30): void {
    if (this.intervalTimer) return;
    const intervalMs = Math.round(1000 / tickRateHz);
    this.lastTickTime = Date.now();

    this.intervalTimer = setInterval(() => {
      const now = Date.now();
      const dtMs = now - this.lastTickTime;
      this.lastTickTime = now;
      this.tick(dtMs);
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private notifyUpdate(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
