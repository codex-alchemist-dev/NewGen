/**
 * VFX-side adapter over the shared quality store (src/lib/motion/vfx-quality.ts).
 * The store owns FPS sampling, stepping and the reduced-motion ceiling.
 * This file only gives VFX code a tiny tier API and particle budgets.
 */
import { vfxQuality } from '../../lib/motion/vfx-quality';
import type { VfxTier } from '../../lib/motion/types';

export type Tier = VfxTier;

let synced = false;
function sync() {
  if (synced || typeof document === 'undefined') return;
  synced = true;
  // The store writes <html data-vfx-tier> only on change; make sure the
  // first value (e.g. 'static' under reduced motion) is mirrored too.
  document.documentElement.dataset.vfxTier = vfxQuality.getSnapshot().tier;
  // QA pin: ?vfx=full|reduced|static holds that tier (re-asserted if the
  // FPS monitor steps it). Reduced motion still wins via the store's ceiling.
  const pin = new URLSearchParams(location.search).get('vfx') as Tier | null;
  if (pin === 'full' || pin === 'reduced' || pin === 'static') {
    vfxQuality.setTier(pin);
    vfxQuality.subscribe(() => {
      if (vfxQuality.getSnapshot().tier !== pin) queueMicrotask(() => vfxQuality.setTier(pin));
    });
  }
}

export function getTier(): Tier {
  sync();
  return vfxQuality.getSnapshot().tier;
}

export function setTier(t: Tier) {
  vfxQuality.setTier(t);
}

/** Calls fn(tier, prev) whenever the tier changes. */
export function onTier(fn: (tier: Tier, prev: Tier) => void): () => void {
  sync();
  let prev = vfxQuality.getSnapshot().tier;
  const unsub = vfxQuality.subscribe(() => {
    const t = vfxQuality.getSnapshot().tier;
    if (t !== prev) {
      const p = prev;
      prev = t;
      fn(t, p);
    }
  });
  return () => void unsub();
}

/** Particle / sample budget multiplier for a tier. */
export function budget(tier: Tier = getTier()): number {
  return tier === 'full' ? 1 : tier === 'reduced' ? 0.4 : 0;
}
