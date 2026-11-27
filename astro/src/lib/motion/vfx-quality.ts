import type { VfxQualitySnapshot, VfxTier } from './types';

/*
 * Adaptive VFX quality store.
 * Samples frame rate once per second. Two slow windows (< 45 fps) step the tier
 * down; four fast windows (>= 58 fps) step it back up, never above the ceiling.
 * prefers-reduced-motion pins the ceiling to 'static'.
 * Read with getSnapshot/subscribe (useSyncExternalStore-compatible).
 */

const ORDER: VfxTier[] = ['full', 'reduced', 'static'];
const SLOW_FPS = 45;
const FAST_FPS = 58;
const SLOW_WINDOWS_TO_DROP = 2;
const FAST_WINDOWS_TO_RAISE = 4;

const reducedQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

let state: VfxQualitySnapshot = {
  tier: reducedQuery?.matches ? 'static' : 'full',
  fps: 60,
  reducedMotion: reducedQuery?.matches ?? false,
};
let ceiling: VfxTier = state.reducedMotion ? 'static' : 'full';
const listeners = new Set<() => void>();
let slowRun = 0;
let fastRun = 0;
let running = false;
let rafId = 0;

function emit(next: Partial<VfxQualitySnapshot>) {
  state = { ...state, ...next };
  document.documentElement.dataset.vfxTier = state.tier;
  listeners.forEach((fn) => fn());
}

function clampToCeiling(tier: VfxTier): VfxTier {
  return ORDER.indexOf(tier) < ORDER.indexOf(ceiling) ? ceiling : tier;
}

function step(delta: -1 | 1) {
  const i = ORDER.indexOf(state.tier) + delta;
  if (i < 0 || i >= ORDER.length) return;
  emit({ tier: clampToCeiling(ORDER[i]) });
}

function onWindow(fps: number) {
  emit({ fps: Math.round(fps) });
  if (fps < SLOW_FPS) {
    fastRun = 0;
    if (++slowRun >= SLOW_WINDOWS_TO_DROP) {
      slowRun = 0;
      step(1);
    }
  } else if (fps >= FAST_FPS) {
    slowRun = 0;
    if (++fastRun >= FAST_WINDOWS_TO_RAISE) {
      fastRun = 0;
      step(-1);
    }
  } else {
    slowRun = 0;
    fastRun = 0;
  }
}

export const vfxQuality = {
  getSnapshot: (): VfxQualitySnapshot => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** Start the FPS monitor. Idempotent. Returns a stop function. */
  start(): () => void {
    if (running || typeof window === 'undefined') return () => {};
    running = true;
    let frames = 0;
    let windowStart = performance.now();
    const loop = (now: number) => {
      frames++;
      const elapsed = now - windowStart;
      if (elapsed >= 1000) {
        onWindow((frames * 1000) / elapsed);
        frames = 0;
        windowStart = now;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    reducedQuery?.addEventListener('change', (e) => {
      ceiling = e.matches ? 'static' : 'full';
      emit({ reducedMotion: e.matches, tier: clampToCeiling(e.matches ? 'static' : state.tier) });
    });
    return () => {
      cancelAnimationFrame(rafId);
      running = false;
    };
  },
  /** Force a tier for QA or a user setting. Still respects the reduced-motion ceiling. */
  setTier(tier: VfxTier) {
    emit({ tier: clampToCeiling(tier) });
  },
};
