/**
 * Gaze-Cone optics, drawn from the traced design in gazecone-data.ts.
 * Top-down, one eye. Concave wraparound dome faceplate (phosphor on the vacuum side,
 * radial ribs outside the active area), the Gaze-Cone eyepiece (four aspheric elements,
 * drawn from the traced surfaces) and the Periphery Ring beside it.
 * The drawing compresses depth so the package reads at headset scale: illustrative,
 * not to scale. Core rays are the traced rays, so their convergence is real.
 */
import type { ReactNode } from 'react';
import { GAZE_CONE, type Pt } from './gazecone-data';
import { ICE, CYAN } from './shared';

export const VIEW = { w: 720, h: 430, cx: 360, cy: 392, s: 3.1, k: 0.64 };
/** mm (eye centre at origin, +y forward) → SVG. */
export const tx = ([x, y]: Pt): Pt => [VIEW.cx + x * VIEW.s, VIEW.cy - y * VIEW.s * VIEW.k];
export const pts = (line: Pt[]) => line.map((p) => tx(p).map((v) => v.toFixed(1)).join(',')).join(' ');

const S = GAZE_CONE.surfaces; // [L1a, L1b, L2a, L2b, phosphor]
const mid = (a: Pt[], b: Pt[]) => a.map((p, i) => [p[0], (p[1] + b[i][1]) / 2] as Pt);
const ELEMENTS: Array<{ id: string; a: Pt[]; b: Pt[] }> = [
  { id: 'E5', a: S[0], b: mid(S[0], S[1]) },
  { id: 'E4', a: mid(S[0], S[1]), b: S[1] },
  { id: 'E3', a: S[2], b: mid(S[2], S[3]) },
  { id: 'E2', a: mid(S[2], S[3]), b: S[3] },
];
export const ELEMENT_IDS = ELEMENTS.map((e) => e.id);
/** Explode offset (mm) per element index (E5 nearest the eye ... E2) and for the faceplate. */
const elShift = (i: number, explode: number) => explode * (i - 1);
const FACE_SHIFT = 3;

const PHOS_Y = 151.7;
/** Faceplate (phosphor) centre-line in mm: traced field in the middle, wrapping round the sides. */
function faceplateLine(): Pt[] {
  const out: Pt[] = [];
  const side = (sgn: number): Pt[] => {
    const arr: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      // from (62, 154) curve back toward the eye, ending beside it at (74, 6)
      const x = 62 + 12 * Math.sin((t * Math.PI) / 2);
      const y = 154 - 148 * (1 - Math.cos((t * Math.PI) / 2)) * 0.55 - 148 * t * 0.45;
      arr.push([sgn * x, y]);
    }
    return arr;
  };
  out.push(...side(-1).reverse());
  for (let i = 0; i <= 24; i++) {
    const x = -62 + (124 * i) / 24;
    out.push([x, PHOS_Y + 3.2 * (x / 62) ** 2]);
  }
  out.push(...side(1));
  return out;
}
export const FACEPLATE = faceplateLine();
const offsetOut = (line: Pt[], d: number): Pt[] => line.map(([x, y], i) => {
  const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
  let nx = b[1] - a[1], ny = -(b[0] - a[0]);
  const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
  // outward = away from the eye centre
  if (nx * x + ny * y < 0) { nx = -nx; ny = -ny; }
  return [x + nx * d, y + ny * d];
});

/** Periphery Ring: thin band beside the eyepiece's clear aperture. */
export const RING_X = 46;
export function ringRay(field: number): Pt[] {
  const a = (field * Math.PI) / 180, sgn = Math.sign(field) || 1;
  const p0: Pt = [0, 10];
  const t1 = (RING_X - 0) / Math.abs(Math.sin(a));
  const p1: Pt = [sgn * RING_X, 10 + t1 * Math.cos(a)];
  // after the ring the ray continues (light runs the other way) to the faceplate wrap
  const xw = 66 + 6 * ((Math.abs(field) - 55) / 25);
  const a2 = a * 0.97;
  const t2 = (xw - RING_X) / Math.abs(Math.sin(a2));
  const p2: Pt = [sgn * xw, p1[1] + t2 * Math.cos(a2)];
  return [p2, p1, p0];
}

export function GazeConeDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.6" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ICE} stopOpacity=".26" />
        <stop offset="1" stopColor={CYAN} stopOpacity=".1" />
      </linearGradient>
    </defs>
  );
}

export interface GazeConeProps {
  uid: string;
  glow?: boolean;
  labels?: boolean;
  highlight?: string | null;
  /** Explode offset in mm per element (exploded-relay). */
  explode?: number;
  electrons?: boolean;
  children?: ReactNode;
}

export function GazeConeOptics({ uid, glow, labels = true, highlight, explode = 0, electrons, children }: GazeConeProps) {
  const f = glow ? `url(#${uid}-glow)` : undefined;
  const op = (id: string) => (highlight && highlight !== id ? 0.3 : 1);
  const shift = (line: Pt[], dy: number) => line.map(([x, y]) => [x, y + dy] as Pt);
  const fpOuter = offsetOut(FACEPLATE, 7);
  const fpShift = explode * FACE_SHIFT;
  const face = shift(FACEPLATE, fpShift), faceOut = shift(fpOuter, fpShift);
  const ribs = [0, FACEPLATE.length - 1].flatMap((i) => [i, i + (i === 0 ? 1 : -1)]);
  return (
    <g>
      {/* faceplate glass (concave wraparound dome) */}
      <polygon points={pts([...face, ...faceOut.slice().reverse()])} fill={`url(#${uid}-glass)`} stroke={ICE} strokeOpacity=".45" opacity={op('E1')} />
      {/* phosphor on the vacuum side */}
      <polyline points={pts(faceOut)} fill="none" stroke="#e8fbff" strokeWidth="2.6" filter={f} opacity={op('E1')} />
      {/* E1: the faceplate's eye-facing surface */}
      <polyline points={pts(face)} fill="none" stroke={CYAN} strokeWidth="1.5" opacity={op('E1')} />
      {/* radial ribs on the vacuum side, outside the active area */}
      {ribs.map((i, k) => {
        const p = faceOut[i], q = face[i];
        const dx = p[0] - q[0], dy = p[1] - q[1];
        return <polyline key={k} points={pts([p, [p[0] + dx * 1.8, p[1] + dy * 1.8]])} stroke={ICE} strokeOpacity=".6" strokeWidth="4" strokeLinecap="round" opacity={op('E1')} />;
      })}
      {electrons && Array.from({ length: 16 }, (_, i) => {
        const p = faceOut[4 + Math.round((i * (faceOut.length - 9)) / 15)];
        const [x, y] = tx([p[0] * 1.06, p[1] + 9 + (i % 3) * 3]);
        return <circle key={i} cx={x} cy={y} r="1.1" fill={CYAN} opacity=".25" />;
      })}
      {/* Gaze-Cone eyepiece: four aspheric elements */}
      {ELEMENTS.map((e, i) => {
        const dy = elShift(i, explode);
        return (
          <polygon key={e.id} points={pts([...shift(e.a, dy), ...shift(e.b, dy).slice().reverse()])}
            fill={`url(#${uid}-glass)`} stroke={ICE} strokeOpacity=".55" strokeWidth="1" opacity={op(e.id)} />
        );
      })}
      {/* Periphery Ring (both sides) */}
      {[-1, 1].map((sgn) => (
        <polygon key={sgn} points={pts([[sgn * RING_X, 12], [sgn * (RING_X + 2.5), 12], [sgn * (RING_X + 3.5), 50 + explode], [sgn * (RING_X + 1), 50 + explode]])}
          fill={`url(#${uid}-glass)`} stroke={ICE} strokeOpacity=".6" opacity={op('ring')} />
      ))}
      {children}
      {labels && (
        <g fontSize="11" fill="#9fb4d8">
          {(() => { const [x, y] = tx([0, PHOS_Y + 16 + fpShift]); return <text x={x} y={y} textAnchor="middle">phosphor · vacuum side</text>; })()}
          {(() => { const [x, y] = tx([-78, 120 + fpShift]); return <text x={x} y={y} textAnchor="end">E1 · faceplate</text>; })()}
          {ELEMENTS.map((e, i) => {
            const yy = (e.a[0][1] + e.b[0][1]) / 2 + elShift(i, explode);
            const [x0, y0] = tx([-40, yy]);
            const [x1, y1] = tx([-96, 40 + i * 14 + explode * 1.5 * (i - 1)]);
            return (
              <g key={e.id}>
                <polyline points={`${x0},${y0} ${x1 + 22},${y1 - 4}`} fill="none" stroke="#2a3860" />
                <text x={x1 + 18} y={y1} textAnchor="end">{e.id} · XA</text>
              </g>
            );
          })}
          {(() => { const [x, y] = tx([RING_X + 2, 4]); return <text x={x} y={y} textAnchor="middle">Periphery Ring</text>; })()}
        </g>
      )}
    </g>
  );
}

/** Eye seen from above, at the origin. `gaze` in degrees (0 = forward). */
export function Eye({ gaze = 0 }: { gaze?: number }) {
  const [cx, cy] = tx([0, 0]);
  const r = 12 * VIEW.s;
  return (
    <g transform={`rotate(${gaze} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="#0b1018" stroke={ICE} strokeOpacity=".7" strokeWidth="1.3" />
      <path d={`M${cx - 15},${cy - r + 4} Q${cx},${cy - r - 9} ${cx + 15},${cy - r + 4}`} fill="none" stroke={ICE} strokeOpacity=".7" strokeWidth="1.3" />
      <rect x={cx - 11} y={cy - r + 1} width="22" height="3" rx="1.5" fill="#123a4a" stroke={CYAN} strokeOpacity=".7" />
      <rect x={cx - 5} y={cy - r + 1} width="10" height="3" fill="#000" />
      <path d={`M${cx - r * 0.7},${cy + r * 0.62} A${r - 3},${r - 3} 0 0 0 ${cx + r * 0.7},${cy + r * 0.62}`} fill="none" stroke="#ff3c6e" strokeOpacity=".4" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="2.2" fill={CYAN} />
    </g>
  );
}

/** Light-direction polyline (phosphor → pupil) for a traced ray stored pupil → phosphor. */
export const lightPts = (ray: Pt[]) => pts(ray.slice().reverse());
