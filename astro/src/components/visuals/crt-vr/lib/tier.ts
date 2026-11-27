/**
 * Thin adapter over the shell's adaptive VFX quality store
 * (src/lib/motion/vfx-quality.ts). Adds a QA override: ?vfx=full|reduced|static.
 */
import { vfxQuality } from '../../../../lib/motion/vfx-quality';
import type { VfxTier } from '../../../../lib/motion/types';

export type { VfxTier };

let overrideApplied = false;
function applyOverride() {
  if (overrideApplied) return;
  overrideApplied = true;
  try {
    const q = new URL(window.location.href).searchParams.get('vfx');
    if (q === 'full' || q === 'reduced' || q === 'static') {
      vfxQuality.setTier(q);
      // keep the FPS monitor from undoing a QA override
      const pin = () => { if (vfxQuality.getSnapshot().tier !== q) vfxQuality.setTier(q); };
      vfxQuality.subscribe(pin);
    }
  } catch { /* ignore */ }
}

/** Calls fn now and whenever the tier changes (deduplicated). Returns an unsubscribe. */
export function onTier(fn: (tier: VfxTier) => void): () => void {
  applyOverride();
  let last: VfxTier | null = null;
  const check = () => {
    const t = vfxQuality.getSnapshot().tier;
    if (t !== last) { last = t; fn(t); }
  };
  check();
  return vfxQuality.subscribe(check);
}
