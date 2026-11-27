import type { VfxQualitySnapshot, VfxTier } from './types';

/*
 * Adaptive VFX quality store.
 * Samples frame rate once per second. Two slow windows (< 48 fps, or a window
 * where a quarter of the frames take over 50 ms) step the tier
 * down. Stepping up is sticky: it needs six consecutive fast windows (>= 58 fps,
 * about six seconds of sustained headroom). Every change starts a cooldown, during
 * which no further change happens, so the tier does not flip-flop.
 * prefers-reduced-motion pins the ceiling to 'static'.
 * Read with getSnapshot/subscribe (useSyncExternalStore-compatible).
 */

const ORDER: VfxTier[] = ['full', 'reduced', 'static'];
// Thresholds are for a 60 Hz screen and scale down on slower screens (a 50 Hz
// panel must not read as permanently slow). The refresh rate is the best
// window seen so far, rounded, so high-refresh screens keep the 60 Hz bars.
const SLOW_FPS = 48;
const FAST_FPS = 58;
let refresh = 60;
const slowBar = () => Math.min(SLOW_FPS, refresh * 0.8);
const fastBar = () => Math.min(FAST_FPS, refresh * 0.95);
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

/*
 * FPS can only reach 'reduced'. 'static' is reserved for prefers-reduced-motion
 * (and explicit setTier). Static hides the act transitions and backgrounds, so an
 * FPS dip during fast scrolling used to make them vanish when scrolling back.
 */
function clampToFpsFloor(tier: VfxTier): VfxTier {
  return tier === 'static' && !state.reducedMotion ? 'reduced' : tier;
}

function step(delta: -1 | 1, now: number) {
  const i = ORDER.indexOf(state.tier) + delta;
  if (i < 0 || i >= ORDER.length) return;
  const next = clampToFpsFloor(clampToCeiling(ORDER[i]));
  if (next === state.tier) return;
  emit({ tier: next });
  cooldownUntil = now + COOLDOWN_MS;
  slowRun = 0;
  fastRun = 0;
}

function onWindow(fps: number, longFrac: number, now: number) {
  if (fps > refresh + 2 && fps < 250) refresh = Math.round(fps);
  emit({ fps: Math.round(fps) });
  // During cooldown, observe but do not count toward a change.
  if (now < cooldownUntil) {
    slowRun = 0;
    fastRun = 0;
    return;
  }
  if (fps < slowBar() || longFrac >= 0.25) {
    fastRun = 0;
    if (++slowRun >= SLOW_WINDOWS_TO_DROP) step(1, now);
  } else if (fps >= fastBar()) {
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
    let long = 0;
    let prev = 0;
    let windowStart = performance.now();
    const loop = (now: number) => {
      frames++;
      if (prev && now - prev > 50) long++;
      prev = now;
      const elapsed = now - windowStart;
      if (document.hidden || elapsed > 3000) {
        // background tab or a long stall (tab switch, debugger): not a load signal
        frames = 0;
        long = 0;
        windowStart = now;
      } else if (elapsed >= 1000) {
        onWindow((frames * 1000) / elapsed, long / Math.max(1, frames), now);
        frames = 0;
        long = 0;
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
