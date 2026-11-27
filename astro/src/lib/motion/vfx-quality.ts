import type { VfxQualitySnapshot, VfxTier } from './types';

/*
 * Adaptive VFX quality store.
 * Samples frame rate once per second. Two slow windows (< 45 fps) step the tier
 * down. Stepping up is sticky: it needs six consecutive fast windows (>= 58 fps,
 * about six seconds of sustained headroom). Every change starts a cooldown, during
 * which no further change happens, so the tier does not flip-flop.
 * prefers-reduced-motion pins the ceiling to 'static'.
 * Read with getSnapshot/subscribe (useSyncExternalStore-compatible).
 */

const ORDER: VfxTier[] = ['full', 'reduced', 'static'];
const SLOW_FPS = 45;
const FAST_FPS = 58;
const SLOW_WINDOWS_TO_DROP = 2;
const FAST_WINDOWS_TO_RAISE = 6;
const COOLDOWN_MS = 4000;

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
let cooldownUntil = 0;
let running = false;
let rafId = 0;

function mirrorTier() {
  if (typeof document !== 'undefined') document.documentElement.dataset.vfxTier = state.tier;
}

function emit(next: Partial<VfxQualitySnapshot>) {
  state = { ...state, ...next };
  mirrorTier();
  listeners.forEach((fn) => fn());
}

// Mirror the initial tier right away, so a reduced-motion first load is not left at the HTML default.
mirrorTier();

function clampToCeiling(tier: VfxTier): VfxTier {
  return ORDER.indexOf(tier) < ORDER.indexOf(ceiling) ? ceiling : tier;
}

function step(delta: -1 | 1, now: number) {
  const i = ORDER.indexOf(state.tier) + delta;
  if (i < 0 || i >= ORDER.length) return;
  const next = clampToCeiling(ORDER[i]);
  if (next === state.tier) return;
  emit({ tier: next });
  cooldownUntil = now + COOLDOWN_MS;
  slowRun = 0;
  fastRun = 0;
}

function onWindow(fps: number, now: number) {
  emit({ fps: Math.round(fps) });
  // During cooldown, observe but do not count toward a change.
  if (now < cooldownUntil) {
    slowRun = 0;
    fastRun = 0;
    return;
  }
  if (fps < SLOW_FPS) {
    fastRun = 0;
    if (++slowRun >= SLOW_WINDOWS_TO_DROP) step(1, now);
  } else if (fps >= FAST_FPS) {
    slowRun = 0;
    if (++fastRun >= FAST_WINDOWS_TO_RAISE) step(-1, now);
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
        onWindow((frames * 1000) / elapsed, now);
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
