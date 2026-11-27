/**
 * One RGBMCY hexagon pixel: six triangular subpixels around the centre.
 * RGB wedges form the upright triangle, MCY the inverted one, and complementary
 * pairs sit opposite each other (R↔C, Y↔B, G↔M). Kurocoat walls are the dark gaps.
 */
import { UI, NAMES, type Key } from './color';

/** Wedge centre angles (degrees, screen space, 0° = right, clockwise). */
export const WEDGE_ANGLE: Record<Key, number> = { R: -90, Y: -30, G: 30, C: 90, B: 150, M: 210 };
export const WEDGE_ORDER: Key[] = ['R', 'Y', 'G', 'C', 'B', 'M'];

export function wedgePoints(k: Key, r: number, cx = 0, cy = 0, inset = 0): string {
  const a = (WEDGE_ANGLE[k] * Math.PI) / 180;
  const a1 = a - Math.PI / 6, a2 = a + Math.PI / 6;
  // inset the triangle toward its own centroid to leave a wall
  const P = [[cx, cy], [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], [cx + r * Math.cos(a2), cy + r * Math.sin(a2)]];
  const gx = (P[0][0] + P[1][0] + P[2][0]) / 3, gy = (P[0][1] + P[1][1] + P[2][1]) / 3;
  return P.map(([x, y]) => {
    const dx = x - gx, dy = y - gy, d = Math.hypot(dx, dy) || 1;
    const f = Math.max(0, (d - inset) / d);
    return `${(gx + dx * f).toFixed(2)},${(gy + dy * f).toFixed(2)}`;
  }).join(' ');
}

export function hexPoints(r: number, cx = 0, cy = 0) {
  return [0, 1, 2, 3, 4, 5].map((i) => { const a = ((-120 + i * 60) * Math.PI) / 180; return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`; }).join(' ');
}

export function HexPixel({ drive, r = 120, glow = true, labels = true, recruited = [], pure = [], idPrefix = 'hp' }: {
  drive: Record<Key, number>; r?: number; glow?: boolean; labels?: boolean; recruited?: Key[]; pure?: Key[]; idPrefix?: string;
}) {
  const pad = r * 0.42;
  const vb = `${-r - pad} ${-r - pad} ${2 * (r + pad)} ${2 * (r + pad)}`;
  return (
    <svg className="x4-svg hexpx" viewBox={vb} role="img" aria-label={`Hexagon pixel. ${WEDGE_ORDER.map((k) => `${NAMES[k]} ${Math.round(drive[k] * 100)}%`).join(', ')}`}>
      <defs>
        <filter id={`${idPrefix}-bloom`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r * 0.09} />
        </filter>
      </defs>
      <polygon points={hexPoints(r * 1.04)} fill="#020306" stroke="var(--x4-line-b)" strokeWidth={r * 0.012} />
      {WEDGE_ORDER.map((k) => {
        const d = Math.max(0, Math.min(1, drive[k]));
        const vis = d === 0 ? 0 : 0.12 + 0.88 * Math.pow(d, 1 / 2.2);
        return (
          <g key={k} className="hexpx-w" data-k={k}>
            <polygon points={wedgePoints(k, r, 0, 0, r * 0.05)} fill="#0b0f1c" />
            {glow && <polygon points={wedgePoints(k, r, 0, 0, r * 0.05)} fill={UI[k]} opacity={vis * 0.9} filter={`url(#${idPrefix}-bloom)`} className="hexpx-fade" />}
            <polygon points={wedgePoints(k, r, 0, 0, r * 0.05)} fill={UI[k]} opacity={vis} className="hexpx-fade" />
          </g>
        );
      })}
      {labels && WEDGE_ORDER.map((k) => {
        const a = (WEDGE_ANGLE[k] * Math.PI) / 180;
        const rr = r * 0.6, lr = r * 1.22;
        const d = drive[k];
        const role = pure.includes(k) ? 'pure' : recruited.includes(k) ? 'joined' : '';
        return (
          <g key={k} fontFamily="var(--x4-mono)" textAnchor="middle">
            <text x={rr * Math.cos(a)} y={rr * Math.sin(a) + r * 0.06} fontSize={r * 0.15} fill={d > 0.55 ? '#05060c' : '#f0f4ff'} fontWeight="600" style={{ transition: 'fill .3s' }}>{k}</text>
            <text x={lr * Math.cos(a)} y={lr * Math.sin(a) + r * 0.045} fontSize={r * 0.12} fill={d > 0 ? 'var(--x4-white)' : 'var(--x4-dimmer)'} style={{ fontVariantNumeric: 'tabular-nums' }}>{(d * 100).toFixed(d > 0 && d < 0.1 ? 1 : 0)}%</text>
            {role && <text x={lr * Math.cos(a)} y={lr * Math.sin(a) + r * 0.19} fontSize={r * 0.075} letterSpacing="1.5" fill={role === 'pure' ? UI[k] : 'var(--x4-dim)'}>{role.toUpperCase()}</text>}
          </g>
        );
      })}
    </svg>
  );
}
