import { vfxQuality } from './vfx-quality';
import { startSmoothScroll } from './smooth-scroll';

let started = false;

/** Called once from BaseLayout. Starts the FPS monitor and Lenis (unless reduced motion). */
export function initMotion(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  const { reducedMotion } = vfxQuality.getSnapshot();
  startSmoothScroll(reducedMotion);
  vfxQuality.start();
}
