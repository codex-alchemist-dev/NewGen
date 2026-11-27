/**
 * CRT-VR Act 4 colour science. Real CIE 1931 2° colorimetry, no lookup fakes.
 *
 * Physics inputs (coordinator-approved, Nov 27 2026) live in PRIMARY_SPEC and
 * DEFAULT_FWHM. Everything else is derived:
 *  - each single-peak primary is a Gaussian emission line (QD, ~20 nm FWHM),
 *  - M is a true two-peak magenta (B + R peaks) on the purple line, blended so it
 *    is exactly complementary to G through D65 (B↔Y and R↔C are already complements),
 *  - subpixel peak luminances balance RGB → D65 (Y=1) and MCY → D65 (Y=1).
 */
import { CMF, CMF_START, CMF_END } from './cie1931';

export type Key = 'R' | 'Y' | 'G' | 'C' | 'B' | 'M';
export type XY = [number, number];
export type XYZ = [number, number, number];

/** Hull order (counter-clockwise in xy, starting at red). */
export const HULL_ORDER: Key[] = ['R', 'Y', 'G', 'C', 'B', 'M'];
/** Hexagon pixel order: RGB triangle + inverted MCY triangle. */
export const PIXEL_ORDER: Key[] = ['R', 'G', 'B', 'M', 'C', 'Y'];

export const PRIMARY_SPEC: Record<Exclude<Key, 'M'>, number> = { B: 450, C: 490, G: 520, Y: 575, R: 635 };
export const DEFAULT_FWHM = 20;
/** Moonshot set: the best 5-line pentagon found by grid search (≈200% P3 at ≤10 nm FWHM). */
export const MOONSHOT_SPEC: Record<Exclude<Key, 'M'>, number> = { B: 430, C: 496, G: 516, Y: 550, R: 680 };
export const MOONSHOT_FWHM = 8;

export const NAMES: Record<Key, string> = { R: 'Red', G: 'Green', B: 'Blue', C: 'Cyan', M: 'Magenta', Y: 'Yellow' };
/** UI swatches (display colours, not colorimetric). */
export const UI: Record<Key, string> = {
  R: '#ff3b2f', G: '#19ff74', B: '#4a5dff', C: '#00e1ff', M: '#ff2fd2', Y: '#ffe135',
};

export const D65: XY = [0.3127, 0.329];
export const SRGB: XY[] = [[0.64, 0.33], [0.3, 0.6], [0.15, 0.06]];
export const P3: XY[] = [[0.68, 0.32], [0.265, 0.69], [0.15, 0.06]];
export const REC2020: XY[] = [[0.708, 0.292], [0.17, 0.797], [0.131, 0.046]];

/* ---------- spectra ---------- */

export function cmfAt(nm: number): XYZ {
  const i = Math.round(nm) - CMF_START;
  if (i < 0 || nm > CMF_END) return [0, 0, 0];
  return [CMF[i * 3], CMF[i * 3 + 1], CMF[i * 3 + 2]];
}

export type Spectrum = (nm: number) => number;
export const gaussian = (center: number, fwhm: number): Spectrum => {
  const s = fwhm / 2.3548;
  return (nm) => Math.exp(-0.5 * ((nm - center) / s) ** 2);
};

export function spectrumXYZ(sp: Spectrum): XYZ {
  let X = 0, Y = 0, Z = 0;
  for (let nm = CMF_START; nm <= CMF_END; nm++) {
    const v = sp(nm); const i = (nm - CMF_START) * 3;
    X += CMF[i] * v; Y += CMF[i + 1] * v; Z += CMF[i + 2] * v;
  }
  return [X, Y, Z];
}

export const xyOf = (c: XYZ): XY => { const s = c[0] + c[1] + c[2] || 1; return [c[0] / s, c[1] / s]; };
export const xyToXYZ = ([x, y]: XY, Y = 1): XYZ => [(x * Y) / y, Y, ((1 - x - y) * Y) / y];
const unitY = (c: XYZ): XYZ => [c[0] / c[1], 1, c[2] / c[1]];

/** Spectral locus, 380–700 nm, 1 nm. */
export const LOCUS: { nm: number; xy: XY }[] = (() => {
  const out: { nm: number; xy: XY }[] = [];
  for (let nm = 380; nm <= 700; nm++) { const c = cmfAt(nm); out.push({ nm, xy: xyOf(c) }); }
  return out;
})();

/* ---------- geometry ---------- */

export const cross2 = (a: XY, b: XY) => a[0] * b[1] - a[1] * b[0];
const sub = (a: XY, b: XY): XY => [a[0] - b[0], a[1] - b[1]];
export const dist = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function polyArea(p: XY[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const j = (i + 1) % p.length; a += p[i][0] * p[j][1] - p[j][0] * p[i][1]; }
  return Math.abs(a) / 2;
}
export const LOCUS_AREA = polyArea(LOCUS.map((l) => l.xy));
export const P3_AREA = polyArea(P3);

/* ---------- the six primaries ---------- */

export interface Primary { key: Key; xy: XY; unit: XYZ; Ymax: number; peaks: number[]; spectrum: Spectrum }
export interface PrimarySet { list: Primary[]; by: Record<Key, Primary>; mBlend: number; fwhm: number }

function solve3(A: number[][], b: number[]): number[] | null {
  const m = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-12) return null;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < 3; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k];
    }
  }
  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
}
const cols = (cs: XYZ[]) => [0, 1, 2].map((r) => cs.map((c) => c[r]));

export function buildPrimaries(spec = PRIMARY_SPEC, fwhm = DEFAULT_FWHM): PrimarySet {
  const sp: Partial<Record<Key, Spectrum>> = {};
  const unit: Partial<Record<Key, XYZ>> = {};
  (Object.keys(spec) as Exclude<Key, 'M'>[]).forEach((k) => {
    sp[k] = gaussian(spec[k], fwhm);
    unit[k] = unitY(spectrumXYZ(sp[k]!));
  });
  // Two-peak M: t·B̂ + (1−t)·R̂ (unit-luminance mix), collinear with G and D65.
  const g = xyOf(unit.G!);
  const side = (t: number) => {
    const c: XYZ = [0, 1, 2].map((i) => t * unit.B![i] + (1 - t) * unit.R![i]) as XYZ;
    return cross2(sub(xyOf(c), D65), sub(g, D65));
  };
  let lo = 0, hi = 1; const s0 = Math.sign(side(lo));
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (Math.sign(side(mid)) === s0) lo = mid; else hi = mid; }
  const t = (lo + hi) / 2;
  unit.M = [0, 1, 2].map((i) => t * unit.B![i] + (1 - t) * unit.R![i]) as XYZ;
  // Spectral weights so that the M spectrum integrates to the same unit mix.
  const yB = spectrumXYZ(sp.B!)[1], yR = spectrumXYZ(sp.R!)[1];
  const bS = sp.B!, rS = sp.R!;
  sp.M = (nm) => (t / yB) * bS(nm) + ((1 - t) / yR) * rS(nm);

  const W = xyToXYZ(D65, 1);
  const bal = (ks: Key[]) => solve3(cols(ks.map((k) => unit[k]!)), W)!;
  const [yr, yg, yb] = bal(['R', 'G', 'B']);
  const [ym, yc, yy] = bal(['M', 'C', 'Y']);
  const Ymax: Record<Key, number> = { R: yr, G: yg, B: yb, M: ym, C: yc, Y: yy };
  const peaks: Record<Key, number[]> = {
    R: [spec.R], G: [spec.G], B: [spec.B], C: [spec.C], Y: [spec.Y], M: [spec.B, spec.R],
  };
  const list = HULL_ORDER.map((key) => ({ key, xy: xyOf(unit[key]!), unit: unit[key]!, Ymax: Ymax[key], peaks: peaks[key], spectrum: sp[key]! }));
  const by = Object.fromEntries(list.map((p) => [p.key, p])) as Record<Key, Primary>;
  return { list, by, mBlend: t, fwhm };
}

/** Convex hull area of the primary set (M sits on the B–R line, so it adds nothing). */
export const gamutArea = (ps: PrimarySet) => polyArea(ps.list.map((p) => p.xy));

/* ---------- display ---------- */

const M_XYZ_SRGB = [
  [3.2406, -1.5372, -0.4986],
  [-0.9689, 1.8758, 0.0415],
  [0.0557, -0.204, 1.057],
];
const enc = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

/** XYZ → sRGB 0..1 (linear clip, then optional normalise so the brightest channel is 1). */
export function xyzToSrgb(c: XYZ, normalise = false): [number, number, number] {
  let rgb = M_XYZ_SRGB.map((r) => r[0] * c[0] + r[1] * c[1] + r[2] * c[2]);
  const mn = Math.min(...rgb);
  if (mn < 0) rgb = rgb.map((v) => v - mn); // desaturate toward white (screen can't show it)
  if (normalise) { const mx = Math.max(...rgb) || 1; rgb = rgb.map((v) => v / mx); }
  return rgb.map((v) => Math.max(0, Math.min(1, enc(Math.max(0, v))))) as [number, number, number];
}
export const css = (rgb: [number, number, number]) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(' ')})`;
export const xyCss = (xy: XY) => css(xyzToSrgb(xyToXYZ(xy, 1), true));

/** Wavelength → display colour for spectral labels. */
export const nmCss = (nm: number) => css(xyzToSrgb(cmfAt(nm), true));

/* ---------- hue × saturation over the panel gamut ---------- */

/** Distance from D65 to the hull boundary along angle θ (radians, xy-plane). */
export function boundaryAt(ps: PrimarySet, theta: number): XY {
  const d: XY = [Math.cos(theta), Math.sin(theta)];
  const pts = ps.list.map((p) => p.xy);
  let best = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const e = sub(b, a), w = sub(a, D65);
    const den = cross2(d, e);
    if (Math.abs(den) < 1e-12) continue;
    const t = cross2(w, e) / den, u = cross2(w, d) / den;
    if (t > 0 && u >= -1e-9 && u <= 1 + 1e-9 && t < best) best = t;
  }
  return [D65[0] + d[0] * best, D65[1] + d[1] * best];
}
export const hueOf = (xy: XY) => Math.atan2(xy[1] - D65[1], xy[0] - D65[0]);
export function hueSatToXy(ps: PrimarySet, theta: number, sat: number): XY {
  const b = boundaryAt(ps, theta);
  return [D65[0] + (b[0] - D65[0]) * sat, D65[1] + (b[1] - D65[1]) * sat];
}

/* ---------- Puretone solver ---------- */

/** Chromaticity tolerance for rendering a colour "pure" from 1 or 2 tones (≈ below a MacAdam step). */
export const PURE_TOL = 0.0025;
/** Full-field white: all six at 100% (RGB white + MCY white). */
export const PEAK_Y = 2;

export interface PuretoneResult {
  /** Drive fraction 0..1 per subpixel. */
  drive: Record<Key, number>;
  /** Primaries in the pure (fewest-tone) set. */
  pure: Key[];
  /** Primaries recruited because the pure set ran out of brightness. */
  recruited: Key[];
  /** Rendered chromaticity (equals the target, or the snapped pure point). */
  xy: XY;
  /** Luminance actually produced (Y, white = PEAK_Y). */
  Y: number;
  /** Highest Y the pure set alone can reach at this chromaticity. */
  pureBudget: number;
  /** Highest Y all six can reach at this chromaticity. */
  maxY: number;
  clipped: boolean;
  snapped: boolean;
}

const zeroDrive = (): Record<Key, number> => ({ R: 0, G: 0, B: 0, M: 0, C: 0, Y: 0 });

function segDist(p: XY, a: XY, b: XY): { d: number; t: number; q: XY } {
  const e = sub(b, a); const l2 = e[0] * e[0] + e[1] * e[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / l2));
  const q: XY = [a[0] + e[0] * t, a[1] + e[1] * t];
  return { d: dist(p, q), t, q };
}

/** Unit-luminance weights for a mix of `keys` hitting chromaticity xy (least squares in XYZ for 1–2 keys). */
function weights(ps: PrimarySet, keys: Key[], xy: XY): number[] | null {
  const T = xyToXYZ(xy, 1);
  if (keys.length === 1) return [1];
  if (keys.length === 2) {
    const [a, b] = keys.map((k) => ps.by[k].unit);
    // Solve wa·a + wb·b = T in the least-squares sense, then renormalise Y.
    const ata = [[dot(a, a), dot(a, b)], [dot(a, b), dot(b, b)]];
    const atb = [dot(a, T), dot(b, T)];
    const det = ata[0][0] * ata[1][1] - ata[0][1] * ata[1][0];
    if (Math.abs(det) < 1e-12) return null;
    const wa = (atb[0] * ata[1][1] - ata[0][1] * atb[1]) / det;
    const wb = (ata[0][0] * atb[1] - ata[1][0] * atb[0]) / det;
    if (wa < -1e-9 || wb < -1e-9) return null;
    const s = wa + wb; return [Math.max(0, wa) / s, Math.max(0, wb) / s];
  }
  const w = solve3(cols(keys.map((k) => ps.by[k].unit)), T);
  if (!w || w.some((v) => v < -1e-9)) return null;
  return w.map((v) => Math.max(0, v));
}
const dot = (a: XYZ, b: XYZ) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Luminance-weighted chromatic spread: how far the emitted light strays from the target hue. */
const spread = (ps: PrimarySet, keys: Key[], w: number[], xy: XY) => keys.reduce((s, k, i) => s + w[i] * dist(ps.by[k].xy, xy), 0);

/** Fewest-tone decomposition. Returns the chosen keys, unit-luminance weights and the rendered xy. */
export function pureSet(ps: PrimarySet, xy: XY): { keys: Key[]; w: number[]; xy: XY; snapped: boolean } {
  const keys = ps.list.map((p) => p.key);
  // 1 tone
  let best1: { k: Key; d: number } | null = null;
  for (const k of keys) { const d = dist(ps.by[k].xy, xy); if (d < PURE_TOL && (!best1 || d < best1.d)) best1 = { k, d }; }
  if (best1) return { keys: [best1.k], w: [1], xy: ps.by[best1.k].xy, snapped: best1.d > 1e-6 };
  // 2 tones
  let best2: { keys: Key[]; w: number[]; q: XY; score: number; d: number } | null = null;
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = keys[i], b = keys[j];
    const sd = segDist(xy, ps.by[a].xy, ps.by[b].xy);
    if (sd.d >= PURE_TOL || sd.t <= 0 || sd.t >= 1) continue;
    const w = weights(ps, [a, b], sd.q); if (!w) continue;
    const score = spread(ps, [a, b], w, sd.q) + sd.d * 4;
    if (!best2 || score < best2.score) best2 = { keys: [a, b], w, q: sd.q, score, d: sd.d };
  }
  if (best2) return { keys: best2.keys, w: best2.w, xy: best2.q, snapped: best2.d > 1e-6 };
  // 3 tones: every triangle that contains the point, pick the tightest spread
  let best3: { keys: Key[]; w: number[]; score: number } | null = null;
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) for (let k = j + 1; k < 6; k++) {
    const ks = [keys[i], keys[j], keys[k]];
    const w = weights(ps, ks, xy); if (!w) continue;
    const score = spread(ps, ks, w, xy);
    if (!best3 || score < best3.score) best3 = { keys: ks, w, score };
  }
  if (best3) {
    // drop a vanishing tone (point on an edge within numeric noise)
    const keep = best3.keys.map((k, i) => [k, best3!.w[i]] as const).filter(([, v]) => v > 1e-6);
    return { keys: keep.map(([k]) => k), w: keep.map(([, v]) => v), xy, snapped: false };
  }
  // outside the gamut: project onto the nearest hull edge
  let nearest: { q: XY; d: number } | null = null;
  const pts = ps.list.map((p) => p.xy);
  for (let i = 0; i < pts.length; i++) { const s = segDist(xy, pts[i], pts[(i + 1) % pts.length]); if (!nearest || s.d < nearest.d) nearest = { q: s.q, d: s.d }; }
  return pureSet(ps, nearest!.q);
}

/**
 * Bounded recruitment LP: minimise Σ cost_i·f_i  s.t.  Σ f_i·Ymax_i·unit_i = T,  0 ≤ f_i ≤ 1.
 * 6 variables, 3 equalities: enumerate every basis (20) × nonbasic bound pattern (8).
 */
function recruitLP(ps: PrimarySet, T: XYZ, cost: number[]): number[] | null {
  const P = ps.list.map((p) => p.unit.map((v) => v * p.Ymax) as XYZ);
  let best: { f: number[]; c: number } | null = null;
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) for (let k = j + 1; k < 6; k++) {
    const basis = [i, j, k]; const non = [0, 1, 2, 3, 4, 5].filter((n) => !basis.includes(n));
    for (let mask = 0; mask < 8; mask++) {
      const f = new Array(6).fill(0);
      non.forEach((n, b) => { f[n] = (mask >> b) & 1; });
      const rhs = [0, 1, 2].map((r) => T[r] - non.reduce((s, n) => s + f[n] * P[n][r], 0));
      const x = solve3(cols(basis.map((b) => P[b])), rhs);
      if (!x || x.some((v) => v < -1e-9 || v > 1 + 1e-9)) continue;
      basis.forEach((b, n) => { f[b] = Math.max(0, Math.min(1, x[n])); });
      const c = f.reduce((s, v, n) => s + v * cost[n], 0);
      if (!best || c < best.c - 1e-12) best = { f, c };
    }
  }
  return best?.f ?? null;
}

/** Highest Y the full panel can reach at chromaticity xy (bisection on LP feasibility). */
export function maxYAt(ps: PrimarySet, xy: XY): number {
  const zero = new Array(6).fill(0);
  let lo = 0, hi = PEAK_Y * 1.05;
  for (let i = 0; i < 28; i++) { const mid = (lo + hi) / 2; if (recruitLP(ps, xyToXYZ(xy, mid), zero)) lo = mid; else hi = mid; }
  return lo;
}

export function puretone(ps: PrimarySet, target: XY, Yreq: number): PuretoneResult {
  const ps0 = pureSet(ps, target);
  const xy = ps0.xy;
  const pure = ps0.keys;
  // luminance each pure tone must give per unit target Y → drive fraction per unit Y
  const perY = pure.map((k, i) => ps0.w[i] / ps.by[k].Ymax);
  const pureBudget = 1 / Math.max(...perY);
  const maxY = Math.max(pureBudget, maxYAt(ps, xy));
  const clipped = Yreq > maxY + 1e-9;
  const Y = Math.min(Yreq, maxY);
  const drive = zeroDrive();
  if (Y <= pureBudget) {
    pure.forEach((k, i) => { drive[k] = perY[i] * Y; });
    return { drive, pure, recruited: [], xy, Y, pureBudget, maxY, clipped, snapped: ps0.snapped };
  }
  // Past the purity budget: keep pure tones free, recruit others by chromatic distance.
  const cost = ps.list.map((p) => (pure.includes(p.key) ? 1e-4 : 0.05 + dist(p.xy, xy)));
  const f = recruitLP(ps, xyToXYZ(xy, Y), cost);
  if (!f) { pure.forEach((k, i) => { drive[k] = Math.min(1, perY[i] * Y); }); }
  else ps.list.forEach((p, n) => { drive[p.key] = f[n] < 1e-6 ? 0 : f[n]; });
  const recruited = ps.list.map((p) => p.key).filter((k) => !pure.includes(k) && drive[k] > 0);
  return { drive, pure, recruited, xy, Y, pureBudget, maxY, clipped, snapped: ps0.snapped };
}
