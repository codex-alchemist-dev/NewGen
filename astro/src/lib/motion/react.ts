import { useSyncExternalStore } from 'react';
import { vfxQuality } from './vfx-quality';
import type { VfxQualitySnapshot } from './types';

const server: VfxQualitySnapshot = { tier: 'full', fps: 60, reducedMotion: false };

/** React islands read the adaptive tier through this hook. */
export function useVfxQuality(): VfxQualitySnapshot {
  return useSyncExternalStore(vfxQuality.subscribe, vfxQuality.getSnapshot, () => server);
}
