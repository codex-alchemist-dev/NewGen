/**
 * CRT-VR · shared foveation model (ILLUSTRATIVE).
 *
 * A straight port of the live page's "Gaze-Following Scan Density" math
 * (Sony/CRT-VR/index.html on main, §05). Every Act 2 / Act 3 interactive takes
 * its numbers from here so they agree with each other.
 *
 *   whole-screen refresh = 120 Hz × (fixed-grid points ÷ points scanned this frame)
 *
 * With the original zone radii this gives ≈227 Hz at mild foveation (gaze centred),
 * ≈836 Hz at maximum aggressiveness, and ≈2400 Hz with the gaze in a corner, where
 * the fovea is clipped to about 1/4. These are illustrations of the conversion
 * mechanism (beam time saved → whole-screen refresh), not measured specs. TRL 2–3.
 */

/** Model field, in the original canvas units. */
export const FW = 720;
export const FH = 420;
export const CELL = 10;
export const COLS = Math.floor(FW / CELL); // 72
export const ROWS = Math.floor(FH / CELL); // 42
export const FIXED_POINTS = COLS * ROWS;   // 3024

/** Full-field baseline: a grid panel (or a plain raster) refreshing every dot. */
export const BASELINE_HZ = 120;
export const R_FOVEA = 70;
export const R_MID = 190;

/** Angular mapping used by the acuity curve (coordinator-approved, illustrative). */
export const CORE_DEG = 5;   // full-res core, ±5° (2° fovea + tracking margin)
export const MID_DEG = 20;   // interlaced mid-zone to ±20°
export const FOV_DEG = 180;  // 180°+ field
/** Relative acuity, standard falloff: 1 / (1 + e / E2). */
export const ACUITY_E2 = 2.3;
export const acuity = (eDeg: number) => 1 / (1 + Math.abs(eDeg) / ACUITY_E2);

/** Mid-zone keeps 1 of every k dots (checkerboard), k = 1..4. Interlaced: half the kept dots light per frame. */
export const midKeep = (agg: number) => 1 + Math.round(agg * 3);
/** Edge keeps every k-th dot on both axes, k = 2..8. Never interlaced: full temporal rate. */
export const edgeKeep = (agg: number) => 2 + Math.round(agg * 6);

export type Zone = 'fovea' | 'mid' | 'edge' | 'skip';

/** Zone of a grid dot (gx, gy) for a gaze point in model units. */
export function zoneOf(gx: number, gy: number, gazeX: number, gazeY: number, agg: number, noFovea = false): Zone {
  const x = gx * CELL + CELL / 2;
  const y = gy * CELL + CELL / 2;
  const d = Math.hypot(x - gazeX, y - gazeY);
  if (!noFovea && d < R_FOVEA) return 'fovea';
  if (!noFovea && d < R_MID) return (gx + gy) % midKeep(agg) === 0 ? 'mid' : 'skip';
  const k = edgeKeep(agg);
  return gx % k === 0 && gy % k === 0 ? 'edge' : 'skip';
}

export interface FrameCount {
  fovea: number;
  mid: number;
  edge: number;
  drawn: number;
  saved: number; // 0..1 beam time reclaimed
  hz: number;    // whole-screen refresh
  frameMs: number;
}

/** Points scheduled this frame. Interlaced mid dots count on their off-phase too (half-rate dwell), as in the original. */
export function countFrame(gazeX: number, gazeY: number, agg: number, noFovea = false): FrameCount {
  let fovea = 0, mid = 0, edge = 0;
  for (let gy = 0; gy < ROWS; gy++) {
    for (let gx = 0; gx < COLS; gx++) {
      const z = zoneOf(gx, gy, gazeX, gazeY, agg, noFovea);
      if (z === 'fovea') fovea++;
      else if (z === 'mid') mid++;
      else if (z === 'edge') edge++;
    }
  }
  const drawn = fovea + mid + edge;
  const hz = hzFor(drawn);
  return { fovea, mid, edge, drawn, saved: 1 - drawn / FIXED_POINTS, hz, frameMs: 1000 / hz };
}

export const hzFor = (drawn: number) => Math.round(BASELINE_HZ / Math.max(0.05, drawn / FIXED_POINTS));

/** Is an interlaced mid dot lit on this frame? (Original: (gx+gy+frame) % 2, off below 15% aggressiveness.) */
export const midLit = (gx: number, gy: number, frame: number, agg: number) => ((gx + gy + frame) % 2 === 0) || agg < 0.15;

/** Fraction of the foveal disc that falls inside the screen (sampled). 1/4 at a corner. */
export function foveaVisibleFraction(gazeX: number, gazeY: number): number {
  let inside = 0, total = 0;
  const N = 40;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const u = (i + 0.5) / N * 2 - 1, v = (j + 0.5) / N * 2 - 1;
    if (u * u + v * v > 1) continue;
    total++;
    const x = gazeX + u * R_FOVEA, y = gazeY + v * R_FOVEA;
    if (x >= 0 && x <= FW && y >= 0 && y <= FH) inside++;
  }
  return inside / total;
}

/** Preset gaze/aggressiveness pairs that reproduce the headline figures. */
export const PRESETS = {
  mild: { agg: 0, x: FW / 2, y: FH / 2, label: 'Mild' },
  aggressive: { agg: 1, x: FW / 2, y: FH / 2, label: 'Aggressive' },
  corner: { agg: 1, x: 0, y: 0, label: 'Corner' },
} as const;

/** Colours (page tokens). */
export const C = {
  bg: '#04050a',
  phosphor: '#00ff99',
  blue: '#00b4ff',
  yellow: '#ffe135',
  rose: '#ff3c6e',
  violet: '#cc44ff',
  orange: '#ff7a00',
  white: '#f0f4ff',
  text: '#d8e4ff',
  dim: '#6a7fa8',
  dimmer: '#3a4a6a',
  line: '#1a2240',
};

/** Zone colours: fovea green, mid blue, edge soft white (as on the live page). */
export const ZONE_RGB: Record<'fovea' | 'mid' | 'edge', [number, number, number]> = {
  fovea: [0, 255, 153],
  mid: [0, 180, 255],
  edge: [216, 228, 255],
};
