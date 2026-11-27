/**
 * Shared helpers for the Act 8 Wraparound Optics islands.
 * - useTier(): the shell's adaptive VFX tier (+ ?vfx=full|reduced|static QA override).
 * - useLoop(): rAF loop that runs only while the element is on screen and the tier allows motion.
 * - Small SVG geometry helpers.
 */
import { useEffect, useRef, useState } from 'react';
import { useVfxQuality } from '../../../../lib/motion/react';
import type { VfxTier } from '../../../../lib/motion/types';

export type { VfxTier };

export function useTier(initial: VfxTier = 'full'): VfxTier {
  const q = useVfxQuality();
  const [override, setOverride] = useState<VfxTier | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    try {
      const v = new URL(window.location.href).searchParams.get('vfx');
      if (v === 'full' || v === 'reduced' || v === 'static') setOverride(v);
    } catch { /* ignore */ }
  }, []);
  if (!hydrated) return initial;
  if (q.reducedMotion) return 'static';
  return override ?? q.tier;
}

/** Calls fn(dtSeconds, elapsedSeconds) every frame while `el` is visible and `active`. */
export function useLoop(
  ref: React.RefObject<Element | null>,
  active: boolean,
  fn: (dt: number, t: number) => void,
): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    let raf = 0;
    let last = 0;
    let t = 0;
    let visible = false;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      t += dt;
      fnRef.current(dt, t);
      raf = visible ? requestAnimationFrame(frame) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    }, { rootMargin: '120px' });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [ref, active]);
}

/** RGBMCY beam colours, same values as the Act 1 hero animatic. */
export const PRIMARIES = [
  { key: 'R', name: 'Red', color: '#ff2d20' },
  { key: 'G', name: 'Green', color: '#00ff99' },
  { key: 'B', name: 'Blue', color: '#3a6bff' },
  { key: 'M', name: 'Magenta', color: '#ff3cc8' },
  { key: 'C', name: 'Cyan', color: '#00e1ff' },
  { key: 'Y', name: 'Yellow', color: '#ffe135' },
] as const;

export const ICE = '#c8f6ff';     // Act 8 cyan-white
export const CYAN = '#00e1ff';
export const WARN = '#ffb347';    // stretch / beyond markers

const rad = (d: number) => (d * Math.PI) / 180;

/** Polar → SVG point, angle 0° = straight up from the centre, positive = clockwise (to the right). */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = rad(deg);
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

/** SVG arc path from angle a0 to a1 (degrees, same convention as polar). */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${x1.toFixed(1)},${y1.toFixed(1)}`;
}

/** Closed band (annular sector) between radii r0 < r1, from a0 to a1. */
export function bandPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const [ax, ay] = polar(cx, cy, r1, a0);
  const [bx, by] = polar(cx, cy, r1, a1);
  const [c0, c1] = polar(cx, cy, r0, a1);
  const [d0, d1] = polar(cx, cy, r0, a0);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${ax.toFixed(1)},${ay.toFixed(1)} A${r1},${r1} 0 ${large} 1 ${bx.toFixed(1)},${by.toFixed(1)} L${c0.toFixed(1)},${c1.toFixed(1)} A${r0},${r0} 0 ${large} 0 ${d0.toFixed(1)},${d1.toFixed(1)} Z`;
}

