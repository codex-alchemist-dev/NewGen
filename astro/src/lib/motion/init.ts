import { vfxQuality } from './vfx-quality';
import { startSmoothScroll } from './smooth-scroll';

let started = false;

/** Called once from BaseLayout. Starts the FPS monitor and Lenis (unless reduced motion). */
export function initMotion(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  // Re-assert the tier attribute on first load (the store also does this at module load).
  const { reducedMotion, tier } = vfxQuality.getSnapshot();
  document.documentElement.dataset.vfxTier = tier;
  startSmoothScroll(reducedMotion);
  vfxQuality.start();
}
