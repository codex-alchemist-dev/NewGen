import { useEffect, useRef, useState } from 'react';
import { useVfxQuality } from '../../../../lib/motion/react';
import type { VfxTier } from '../../../../lib/motion/types';

/** Tier for an Act 4 island: explicit prop wins over the adaptive store; ?vfx= overrides for QA. */
export function useAct4Tier(propTier?: VfxTier, reducedMotion?: boolean): VfxTier {
  const snap = useVfxQuality();
  const [qa, setQa] = useState<VfxTier | null>(null);
  useEffect(() => {
    try {
      const q = new URL(window.location.href).searchParams.get('vfx');
      if (q === 'full' || q === 'reduced' || q === 'static') setQa(q);
    } catch { /* ignore */ }
  }, []);
  if (qa) return qa;
  if (reducedMotion || snap.reducedMotion) return 'static';
  // the store is the live source; a prop only caps it
  const order: VfxTier[] = ['full', 'reduced', 'static'];
  const cap = propTier ?? 'full';
  return order.indexOf(snap.tier) > order.indexOf(cap) ? snap.tier : cap;
}

/** True once the element has been on screen (fires once). */
export function useInView<T extends Element>(margin = '0px 0px -15% 0px') {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || seen) return;
    if (!('IntersectionObserver' in window)) { setSeen(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(el); return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}

/** True while the element is on screen (for pausing animation loops). */
export function useVisible<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || !('IntersectionObserver' in window)) { setVis(true); return; }
    const io = new IntersectionObserver((es) => setVis(es[0]?.isIntersecting ?? false));
    io.observe(el); return () => io.disconnect();
  }, []);
  return [ref, vis] as const;
}
