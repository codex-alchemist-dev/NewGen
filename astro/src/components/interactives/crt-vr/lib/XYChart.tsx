/**
 * CIE 1931 xy chromaticity chart (SVG) with a rasterised colour fill clipped to the
 * true spectral locus. Children draw in xy units through the `sx`/`sy` helpers.
 */
import { useEffect, useId, useState, type ReactNode } from 'react';
import { LOCUS, xyToXYZ, xyzToSrgb, D65, type XY } from './color';

export const X_MAX = 0.8, Y_MAX = 0.9;
export const W = 560, H = 620, PAD = { l: 42, r: 14, t: 14, b: 38 };
export const sx = (x: number) => PAD.l + (x / X_MAX) * (W - PAD.l - PAD.r);
export const sy = (y: number) => H - PAD.b - (y / Y_MAX) * (H - PAD.t - PAD.b);
export const pt = (p: XY) => `${sx(p[0]).toFixed(2)},${sy(p[1]).toFixed(2)}`;
export const poly = (ps: XY[]) => ps.map(pt).join(' ');

export const LOCUS_PATH = 'M' + LOCUS.map((l) => pt(l.xy)).join('L') + 'Z';

let fillCache: string | null = null;
function makeFill(): string {
  if (fillCache) return fillCache;
  const cw = 280, ch = 310;
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d')!; const img = g.createImageData(cw, ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const x = (i / (cw - 1)) * X_MAX, y = Y_MAX - (j / (ch - 1)) * Y_MAX;
    const o = (j * cw + i) * 4;
    if (y < 0.005 || x + y > 1) { img.data[o + 3] = 0; continue; }
    const rgb = xyzToSrgb(xyToXYZ([x, y], 1), true);
    img.data[o] = rgb[0] * 255; img.data[o + 1] = rgb[1] * 255; img.data[o + 2] = rgb[2] * 255; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  fillCache = c.toDataURL();
  return fillCache;
}

const TICKS = [460, 470, 480, 490, 500, 510, 520, 530, 540, 550, 560, 570, 580, 590, 600, 620, 680];

export function XYChart({ children, dimFill = 0.55, labels = true, ariaLabel }: { children?: ReactNode; dimFill?: number; labels?: boolean; ariaLabel: string }) {
  const id = useId().replace(/:/g, '');
  const [fill, setFill] = useState<string | null>(null);
  useEffect(() => { setFill(makeFill()); }, []);
  const x0 = sx(0), y0 = sy(0);
  return (
    <svg className="x4-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <defs>
        <clipPath id={`lc${id}`}><path d={LOCUS_PATH} /></clipPath>
        <radialGradient id={`vg${id}`} cx={sx(D65[0]) / W} cy={sy(D65[1]) / H} r="0.7">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      {/* axes grid */}
      <g stroke="var(--x4-line)" strokeWidth="1">
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((v) => <line key={'x' + v} x1={sx(v)} x2={sx(v)} y1={sy(0)} y2={sy(Y_MAX)} />)}
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((v) => <line key={'y' + v} y1={sy(v)} y2={sy(v)} x1={sx(0)} x2={sx(X_MAX)} />)}
      </g>
      <g fill="var(--x4-dim)" fontSize="10">
        {[0, 0.2, 0.4, 0.6, 0.8].map((v) => <text key={v} x={sx(v)} y={y0 + 16} textAnchor="middle">{v.toFixed(1)}</text>)}
        {[0.2, 0.4, 0.6, 0.8].map((v) => <text key={v} x={x0 - 8} y={sy(v) + 3} textAnchor="end">{v.toFixed(1)}</text>)}
        <text x={sx(X_MAX)} y={y0 + 32} textAnchor="end" letterSpacing="2">x</text>
        <text x={x0 - 30} y={sy(Y_MAX) + 8} letterSpacing="2">y</text>
      </g>
      {/* chromaticity fill */}
      <g clipPath={`url(#lc${id})`}>
        {fill && <image href={fill} x={sx(0)} y={sy(Y_MAX)} width={sx(X_MAX) - sx(0)} height={sy(0) - sy(Y_MAX)} preserveAspectRatio="none" opacity={dimFill} />}
        <rect x="0" y="0" width={W} height={H} fill={`url(#vg${id})`} />
      </g>
      <path d={LOCUS_PATH} fill="none" stroke="var(--x4-white)" strokeOpacity=".7" strokeWidth="1.25" />
      {labels && (
        <g fontSize="9.5" fill="var(--x4-dim)">
          {TICKS.map((nm) => {
            const p = LOCUS.find((l) => l.nm === nm)!.xy;
            const q = LOCUS.find((l) => l.nm === nm + 1)!.xy;
            const dx = q[0] - p[0], dy = q[1] - p[1]; const L = Math.hypot(dx, dy) || 1;
            const nx = -dy / L, ny = dx / L; // outward normal (locus runs clockwise in xy)
            const a: XY = [p[0] + nx * 0.012, p[1] + ny * 0.012];
            const b: XY = [p[0] + nx * 0.028, p[1] + ny * 0.028];
            const anchor = nx < -0.3 ? 'end' : nx > 0.3 ? 'start' : 'middle';
            return (
              <g key={nm}>
                <line x1={sx(p[0])} y1={sy(p[1])} x2={sx(a[0])} y2={sy(a[1])} stroke="var(--x4-dim)" />
                <text x={sx(b[0])} y={sy(b[1]) + 3} textAnchor={anchor}>{nm}</text>
              </g>
            );
          })}
        </g>
      )}
      <g>
        <circle cx={sx(D65[0])} cy={sy(D65[1])} r="3" fill="none" stroke="var(--x4-white)" />
        <text x={sx(D65[0]) + 7} y={sy(D65[1]) + 13} fontSize="9" fill="var(--x4-text)">D65</text>
      </g>
      {children}
    </svg>
  );
}
