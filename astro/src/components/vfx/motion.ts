/**
 * VFX motion helpers on top of the shared motion foundation
 * (src/lib/motion: Lenis + GSAP ScrollTrigger + quality store).
 * Adds a smoothed scroll-velocity signal and the math kit the VFX share.
 */
import { gsap, ScrollTrigger } from '../../lib/motion/gsap';
import { getTier, onTier } from './quality';

let booted = false;
let velocity = 0;
const velocityListeners = new Set<(v: number) => void>();

function boot() {
  if (booted || typeof window === 'undefined') return;
  booted = true;
  // Velocity from the real scroll position (Lenis writes native scroll).
  let lastY = scrollY;
  let lastT = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const raw = ((scrollY - lastY) / Math.max(1, now - lastT)) * 16.67; // px per 60 Hz frame
    velocity += (raw - velocity) * 0.25;
    lastY = scrollY;
    lastT = now;
    velocityListeners.forEach((fn) => fn(velocity));
  });
  // Tier changes can swap layouts (static hides transition spacers).
  // Keep the reader anchored on what they were looking at, then re-measure.
  onTier(() => {
    const anchors = [...document.querySelectorAll<HTMLElement>('.section, .act-title, [data-act]')];
    const a = anchors.find((el) => el.getBoundingClientRect().bottom > innerHeight * 0.3);
    const before = a?.getBoundingClientRect().top ?? 0;
    requestAnimationFrame(() => {
      if (a) window.scrollBy(0, a.getBoundingClientRect().top - before);
      ScrollTrigger.refresh();
    });
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  void getTier();
}

/** Shared gsap + ScrollTrigger. */
export function ready() {
  boot();
  return { gsap, ScrollTrigger };
}

/** Smoothed scroll velocity in px per 60 Hz frame. */
export function onVelocity(fn: (v: number) => void) {
  boot();
  velocityListeners.add(fn);
  return () => velocityListeners.delete(fn);
}

/* ── small math kit shared by the VFX ─────────────────────── */
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Map p from [a,b] to [0,1], clamped. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
