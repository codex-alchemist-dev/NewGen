import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { vfxQuality } from '../../../../lib/motion/vfx-quality';
import { onTier } from '../../../visuals/crt-vr/lib/tier';
import type { VfxTier } from '../../../../lib/motion/types';

const subscribeTier = (cb: () => void) => onTier(() => cb());
const getTier = () => vfxQuality.getSnapshot().tier;
const getServerTier = (): VfxTier => 'full';

/**
 * Live VFX tier (full | reduced | static). Honours the shell's adaptive FPS store,
 * prefers-reduced-motion (pins to static), and the ?vfx= QA override.
 */
export function useTier(): VfxTier {
  return useSyncExternalStore(subscribeTier, getTier, getServerTier);
}

/** True while the element is near the viewport, so offscreen islands stop animating. */
export function useInView<T extends Element>(margin = '200px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, inView] as const;
}

export interface StageApi {
  ctx: CanvasRenderingContext2D;
  w: number; // logical width
  h: number; // logical height
  t: number; // ms since start
  dt: number;
  frame: number;
  tier: VfxTier;
}

/**
 * Canvas stage with a logical coordinate system (w × h), DPR scaling and a
 * tier-aware loop:
 *   full    → rAF every frame, DPR up to 2
 *   reduced → ~30 fps, DPR 1
 *   static  → no loop; draws once, then again whenever `deps` change
 */
export function useStage(
  w: number,
  h: number,
  draw: (s: StageApi) => void,
  deps: unknown[],
  opts: { animate?: boolean } = {},
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tier = useTier();
  const [wrapRef, inView] = useInView<HTMLDivElement>();
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const animate = opts.animate ?? true;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = tier === 'full' ? Math.min(2, window.devicePixelRatio || 1) : 1;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0, frame = 0, last = performance.now(), acc = 0;
    const t0 = last;
    const one = (now: number, dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current({ ctx, w, h, t: now - t0, dt, frame: frame++, tier });
    };
    if (tier === 'static' || !animate || !inView) {
      one(performance.now(), 16);
      return;
    }
    const minStep = tier === 'reduced' ? 1000 / 30 : 0;
    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      acc += dt;
      if (acc >= minStep) { one(now, acc); acc = 0; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, inView, w, h, animate, ...deps]);

  return { canvasRef, wrapRef, tier, inView };
}

/** Map a pointer event to logical canvas coordinates. */
export function pointerToLogical(e: { clientX: number; clientY: number }, el: Element, w: number, h: number) {
  const r = el.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
}

/** Smooth number for readouts (eases toward the target; snaps when static). */
export function useEased(target: number, tier: VfxTier, k = 0.2) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (tier === 'static') { cur.current = target; setV(target); return; }
    let raf = 0;
    const tick = () => {
      cur.current += (target - cur.current) * k;
      if (Math.abs(target - cur.current) < 0.5) { cur.current = target; setV(target); return; }
      setV(cur.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, tier, k]);
  return v;
}
