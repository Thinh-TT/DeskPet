import { Bounds2D, FacingDirection, Vector2D } from './types';

export class PhysicsSimulation {
  private position: Vector2D;
  private velocity: Vector2D = { x: 0, y: 0 };
  private bounds: Bounds2D;
  private gravity: number;
  private petWidth: number;

  constructor(
    initialPosition: Vector2D,
    bounds: Bounds2D,
    petWidth = 192,
    gravity = 980
  ) {
    this.position = { ...initialPosition };
    this.bounds = { ...bounds };
    this.petWidth = petWidth;
    this.gravity = gravity;
  }

  setBounds(bounds: Bounds2D): void {
    this.bounds = { ...bounds };
  }

  getPosition(): Vector2D {
    return { ...this.position };
  }

  setPosition(pos: Vector2D): void {
    this.position = { ...pos };
  }

  getVelocity(): Vector2D {
    return { ...this.velocity };
  }

  setVelocity(vel: Vector2D): void {
    this.velocity = { ...vel };
  }

  getGroundY(): number {
    return this.bounds.height;
  }

  updateWalk(
    dtSeconds: number,
    speed: number,
    facing: FacingDirection
  ): { facing: FacingDirection } {
    const halfWidth = this.petWidth / 2;
    const minX = halfWidth;
    const maxX = Math.max(minX, this.bounds.width - halfWidth);

    let nextFacing = facing;
    const dir = facing === 'right' ? 1 : -1;
    this.position.x += dir * speed * dtSeconds;

    if (this.position.x <= minX) {
      this.position.x = minX;
      nextFacing = 'right';
    } else if (this.position.x >= maxX) {
      this.position.x = maxX;
      nextFacing = 'left';
    }

    // Keep on the ground
    this.position.y = this.getGroundY();
    this.velocity = { x: 0, y: 0 };

    return { facing: nextFacing };
  }

  updateFalling(dtSeconds: number): { hasLanded: boolean } {
    this.velocity.y += this.gravity * dtSeconds;
    this.position.y += this.velocity.y * dtSeconds;

    const groundY = this.getGroundY();
    if (this.position.y >= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      return { hasLanded: true };
    }

    return { hasLanded: false };
  }

  clampToBounds(): void {
    const halfWidth = this.petWidth / 2;
    const minX = halfWidth;
    const maxX = Math.max(minX, this.bounds.width - halfWidth);
    const minY = 100;
    const maxY = this.getGroundY();

    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
    this.position.y = Math.max(minY, Math.min(maxY, this.position.y));
  }
}
