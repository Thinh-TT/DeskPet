import {
  Application,
  Assets,
  AnimatedSprite,
  Sprite,
  Container,
  Texture
} from 'pixi.js';
import { CharacterManifest, StateConfig } from '../../shared/character/schema';
import { PetSnapshot } from '../../shared/ipc/channels';
import { CharacterRenderer } from './character-renderer';

export class PixiCharacterRenderer implements CharacterRenderer {
  private app: Application | null = null;
  private rootContainer: Container | null = null;
  private currentManifest: CharacterManifest | null = null;
  private stateSprites: Map<string, AnimatedSprite | Sprite> = new Map();
  private activeState: string = 'idle';
  private pointerOverListeners: ((isOver: boolean) => void)[] = [];
  private currentScale = 1.0;

  async init(container: HTMLElement): Promise<void> {
    const app = new Application();
    await app.init({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true
    });

    container.appendChild(app.canvas);
    this.app = app;

    this.rootContainer = new Container();
    this.rootContainer.eventMode = 'static';
    this.rootContainer.cursor = 'grab';

    // Mouse tracking for click-through
    this.rootContainer.on('pointerenter', () => {
      this.notifyPointerState(true);
    });

    this.rootContainer.on('pointerleave', () => {
      this.notifyPointerState(false);
    });

    this.app.stage.addChild(this.rootContainer);
  }

  onPointerStateChange(callback: (isOverPet: boolean) => void): void {
    this.pointerOverListeners.push(callback);
  }

  private notifyPointerState(isOver: boolean): void {
    for (const listener of this.pointerOverListeners) {
      listener(isOver);
    }
  }

  async loadPack(manifest: CharacterManifest): Promise<void> {
    if (!this.rootContainer) return;

    console.log(`[PixiRenderer] Loading pack: ${manifest.id}`);
    this.currentManifest = manifest;
    this.rootContainer.removeChildren();
    this.stateSprites.clear();

    const packId = manifest.id;
    const baseAssetUrl = (rel: string): string => `pet-asset://${packId}/${rel}`;

    // 1. Fallback stand pose texture
    let fallbackTexture: Texture | null = null;
    try {
      const standPath = manifest.poses['stand'] || manifest.base;
      fallbackTexture = await Assets.load<Texture>(baseAssetUrl(standPath));
      console.log(`[PixiRenderer] Loaded fallback stand pose texture`);
    } catch (err) {
      console.warn('[PixiRenderer] Failed to load stand pose:', err);
    }

    // 2. Load IDLE clip first for instant presentation
    const idleStateConfig = manifest.states['idle'];
    if (idleStateConfig) {
      await this.loadSingleStateClip(manifest, 'idle', idleStateConfig, fallbackTexture);
      this.switchToState('idle');
      console.log('[PixiRenderer] Idle animation ready and displayed');
    }

    // 3. Load other states asynchronously
    const otherStates = Object.entries(manifest.states).filter(([name]) => name !== 'idle');
    for (const [stateName, stateConfig] of otherStates) {
      await this.loadSingleStateClip(manifest, stateName, stateConfig, fallbackTexture);
    }
    console.log(`[PixiRenderer] All states for ${manifest.id} loaded successfully`);
  }

  private async loadSingleStateClip(
    manifest: CharacterManifest,
    stateName: string,
    stateConfig: StateConfig,
    fallbackTexture: Texture | null
  ): Promise<void> {
    if (!this.rootContainer) return;
    const packId = manifest.id;
    const baseAssetUrl = (rel: string): string => `pet-asset://${packId}/${rel}`;

    const clipConfig = manifest.clips[stateConfig.clip];
    if (clipConfig && clipConfig.ready) {
      try {
        const texturePromises: Promise<Texture>[] = [];
        for (let i = 1; i <= clipConfig.count; i++) {
          const frameRel = clipConfig.pattern.replace('{n}', i.toString());
          texturePromises.push(Assets.load<Texture>(baseAssetUrl(frameRel)));
        }

        const textures = await Promise.all(texturePromises);
        if (textures.length > 0) {
          const anim = new AnimatedSprite(textures);
          anim.animationSpeed = clipConfig.fps / 60;
          anim.loop = clipConfig.loop;
          this.applyAnchor(anim, clipConfig.anchor || 'feet');
          anim.visible = false;
          this.rootContainer.addChild(anim);
          this.stateSprites.set(stateName, anim);
          return;
        }
      } catch (err) {
        console.warn(`[PixiRenderer] Could not load clip ${stateConfig.clip}:`, err);
      }
    }

    // Use fallback sprite if clip fails or is static
    if (fallbackTexture) {
      const sprite = new Sprite(fallbackTexture);
      this.applyAnchor(sprite, 'feet');
      sprite.visible = false;
      this.rootContainer.addChild(sprite);
      this.stateSprites.set(stateName, sprite);
    }
  }

  private applyAnchor(
    displayObj: AnimatedSprite | Sprite,
    anchor: 'feet' | 'head' | 'center'
  ): void {
    switch (anchor) {
      case 'feet':
        displayObj.anchor.set(0.5, 1.0);
        break;
      case 'head':
        displayObj.anchor.set(0.5, 0.0);
        break;
      case 'center':
        displayObj.anchor.set(0.5, 0.5);
        break;
    }
  }

  private switchToState(nextState: string): void {
    const currentSprite = this.stateSprites.get(this.activeState);
    if (currentSprite) {
      currentSprite.visible = false;
      if (currentSprite instanceof AnimatedSprite) {
        currentSprite.stop();
      }
    }

    this.activeState = nextState;
    // Fallback to idle if requested state is not yet loaded
    const nextSprite = this.stateSprites.get(nextState) || this.stateSprites.get('idle');
    if (nextSprite) {
      nextSprite.visible = true;
      if (nextSprite instanceof AnimatedSprite) {
        nextSprite.gotoAndPlay(0);
      }
    }
  }

  update(snapshot: PetSnapshot): void {
    if (!this.rootContainer) return;

    this.currentScale = snapshot.scale;

    // Update position
    this.rootContainer.position.set(snapshot.position.x, snapshot.position.y);

    // Switch state animation if needed
    if (snapshot.state !== this.activeState) {
      this.switchToState(snapshot.state);
    }

    // Update facing direction and scale
    const activeSprite = this.stateSprites.get(this.activeState) || this.stateSprites.get('idle');
    if (activeSprite && this.currentManifest) {
      const stateConfig: StateConfig | undefined = this.currentManifest.states[snapshot.state];
      const mirror = stateConfig?.mirrorForLeft ?? true;

      const flip = mirror && snapshot.facing === 'left' ? -1 : 1;
      activeSprite.scale.x = flip * this.currentScale;
      activeSprite.scale.y = this.currentScale;
    }
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: false });
      this.app = null;
    }
    this.stateSprites.clear();
    this.rootContainer = null;
    this.pointerOverListeners = [];
  }
}
