/** VFX quality tiers. `static` is also forced under prefers-reduced-motion. */
export type VfxTier = 'full' | 'reduced' | 'static';

/** Props every VFX, visual and interactive slot component receives. */
export interface VfxSlotProps {
  tier: VfxTier;
  reducedMotion: boolean;
  /** 0..1 scroll progress through the owning act, when the slot is scrubbed. */
  progress?: number;
  /** Act transition / background variant, e.g. 'default' | 'eye' | 'warp' | 'six-beam' | 'rays'. */
  variant?: string;
}

export interface VfxQualitySnapshot {
  tier: VfxTier;
  fps: number;
  reducedMotion: boolean;
}
