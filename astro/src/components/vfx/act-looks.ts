/**
 * Per-act backdrop look: scene + tint. PROVISIONAL, pending coordinator
 * sign-off. Change here; ActWrapper reads it.
 */
export type Scene = 'phosphor' | 'mask' | 'grid' | 'scan' | 'void';
export interface ActLook { scene: Scene; tint: string }

export const actLooks: Record<number, ActLook> = {
  1: { scene: 'phosphor', tint: '#00ff99' }, // Hook: the glowing tube
  2: { scene: 'grid', tint: '#00b4ff' },     // Gaze-native: VR space
  3: { scene: 'scan', tint: '#ff7a00' },     // Velocity: the raster beam
  4: { scene: 'mask', tint: '#cc44ff' },     // RGBMCY: hex subpixel lattice
  5: { scene: 'phosphor', tint: '#ffe135' }, // Brilliance (+ True Black)
  6: { scene: 'scan', tint: '#00ff99' },     // Motion
  7: { scene: 'mask', tint: '#ff2d20' },     // The Machine: Sony red
  8: { scene: 'grid', tint: '#00b4ff' },     // Wraparound Optics
  9: { scene: 'void', tint: '#00ff99' },     // Safe on Your Face: calm
  10: { scene: 'void', tint: '#ffe135' },    // Built to Last
  11: { scene: 'phosphor', tint: '#f0f4ff' },// Certified
  12: { scene: 'grid', tint: '#00ff99' },    // Proof
};

export const lookFor = (n: number): ActLook => actLooks[n] ?? { scene: 'phosphor', tint: '#00ff99' };
