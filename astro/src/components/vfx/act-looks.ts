/**
 * Per-act backdrop look: scene + tint, from the design doc's per-act table
 * (coordinator, Nov 27). The tint also colors that act's transition and the
 * live glow (--vfx-tint-rgb). Base bg is #04050a.
 */
export type Scene =
  | 'field' | 'eye' | 'streaks' | 'mosaic' | 'hdr' | 'trails'
  | 'blueprint' | 'cone' | 'calm' | 'timelapse' | 'shimmer' | 'clean';
export interface ActLook { scene: Scene; tint: string }

export const actLooks: Record<number, ActLook> = {
  1: { scene: 'field', tint: '#00ff99' },     // Hook: power-on into the VR field (HookBackground on top)
  2: { scene: 'eye', tint: '#00ff99' },       // Gaze-native: eye-shaped scan field that follows the cursor
  3: { scene: 'streaks', tint: '#00ff99' },   // Velocity: beam streaks that speed up as you scroll
  4: { scene: 'mosaic', tint: '#f0f4ff' },    // RGBMCY: six-primary hex mosaic flow (scene uses the six primaries)
  5: { scene: 'hdr', tint: '#ffffff' },       // Brilliance: white HDR bloom on pure Kurocoat-black void
  6: { scene: 'trails', tint: '#00ff99' },    // Motion: trails that never smear
  7: { scene: 'blueprint', tint: '#7fe8ff' }, // The Machine: blueprint grid, cool cyan
  8: { scene: 'cone', tint: '#c8f6ff' },      // Wraparound Optics: ray cone wrapping the viewer, cyan-white
  9: { scene: 'calm', tint: '#c9d2e3' },      // Safe on Your Face: calm soft gradients, neutral
  10: { scene: 'timelapse', tint: '#d9d2c4' },// Built to Last: slow time-lapse glow, neutral warm
  11: { scene: 'shimmer', tint: '#e4e8f0' },  // Certified: badge shimmer, neutral
  12: { scene: 'clean', tint: '#d8e4ff' },    // Proof: clean modern, retro fully faded
};

export const lookFor = (n: number): ActLook => actLooks[n] ?? { scene: 'field', tint: '#00ff99' };
