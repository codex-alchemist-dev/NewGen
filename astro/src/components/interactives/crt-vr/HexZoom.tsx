/**
 * Act 4 · "The Hexagon pixel" — hex-zoom.
 * One continuous zoom: the whole tube face → the hex lattice → one hexagon pixel
 * (RGB triangle + inverted MCY triangle, six triangular subpixels) → a cut through
 * its Kurocoat-walled wells. Canvas lattice, SVG overlays. Drag the zoom or let it fly.
 */
import { useEffect, useRef, useState } from 'react';
import './act4.css';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { UI, NAMES, type Key } from './lib/color';
import { WEDGE_ANGLE, WEDGE_ORDER, hexPoints } from './lib/HexPixel';
import { useAct4Tier, useInView, useVisible } from './lib/useTier';

const PANEL_R = 34;          // tube face radius, in hex-pixel radii (illustrative, not to scale)
const S3 = Math.sqrt(3);
const HUE_OF: Record<Key, number> = { R: 0, Y: 60, G: 120, C: 180, B: 240, M: 300 };

const STAGES = [
  { at: 0, label: 'The tube face', sub: 'A dome faceplate, painted with hexagons' },
  { at: 0.38, label: 'The hex lattice', sub: 'No square grid, no screen door' },
  { at: 0.68, label: 'One pixel', sub: 'RGB triangle + inverted MCY triangle' },
  { at: 0.9, label: 'Inside the wells', sub: 'Kurocoat walls between every subpixel' },
];

/** Picture on the panel: a slow six-colour field, expressed as per-subpixel drive. */
function driveAt(x: number, y: number, t: number): Record<Key, number> {
  const r = Math.hypot(x, y) / PANEL_R;
  const hue = ((Math.atan2(y, x) * 180) / Math.PI + 360 + r * 140 + t * 12) % 360;
  const v = Math.max(0, 1 - Math.pow(r, 6)) * (0.55 + 0.45 * Math.sin(r * 9 - t * 0.6) ** 2);
  const out = {} as Record<Key, number>;
  for (const k of WEDGE_ORDER) {
    let d = Math.abs(hue - HUE_OF[k]); d = Math.min(d, 360 - d);
    out[k] = v * Math.max(0, 1 - d / 75) ** 1.6;
  }
  return out;
}
/** Drive shown on the hero pixel once the zoom settles: all six lit, so every wedge reads. */
const SHOW: Record<Key, number> = { R: 0.9, Y: 0.8, G: 0.85, C: 0.85, B: 0.95, M: 0.85 };
const hex2rgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const RGB = Object.fromEntries(WEDGE_ORDER.map((k) => [k, hex2rgb(UI[k])])) as Record<Key, number[]>;

export default function HexZoom(props: Partial<VfxSlotProps>) {
  const tier = useAct4Tier(props.tier, props.reducedMotion);
  const [inRef, seen] = useInView<HTMLDivElement>();
  const [visRef, visible] = useVisible<HTMLDivElement>();
  const setRefs = (el: HTMLDivElement | null) => { inRef.current = el; visRef.current = el; };
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [z, setZ] = useState(tier === 'static' ? 0.72 : 0);
  const zRef = useRef(z); zRef.current = z;
  const flown = useRef(false);
  const userTouched = useRef(false);

  // fly-in once on first view
  useEffect(() => {
    if (!seen || flown.current) return;
    flown.current = true;
    if (tier === 'static') { setZ(0.72); return; }
    const t0 = performance.now(); let id = 0;
    const step = (t: number) => {
      if (userTouched.current) return;
      const k = Math.min(1, (t - t0) / 6500);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setZ(0.72 * e);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [seen, tier]);

  // draw loop
  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const g = c.getContext('2d')!;
    let raf = 0; let last = -1;
    const draw = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = c.clientWidth, H = c.clientHeight;
      if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      const zz = Math.min(zRef.current, 0.86);
      const t = tier === 'full' ? now / 1000 : 0;
      if (tier !== 'full' && last === zz) { raf = requestAnimationFrame(draw); return; }
      last = zz;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#020309'; g.fillRect(0, 0, W, H);
      // scale: px per hex radius, log interpolation from whole face to one pixel
      const s0 = (Math.min(W, H) * 0.46) / PANEL_R, s1 = (Math.min(W, H) * 0.92 * 136) / 400; // matches the SVG overlay hex
      const s = s0 * Math.pow(s1 / s0, Math.min(1, zz / 0.7));
      const cx = W / 2, cy = H / 2;
      // tube face disc
      g.save();
      g.beginPath(); g.arc(cx, cy, PANEL_R * s * 1.02, 0, Math.PI * 2); g.clip();
      const cols = Math.ceil(W / 2 / (1.5 * s)) + 2, rows = Math.ceil(H / 2 / (S3 * s)) + 2;
      const tri = s > 9;
      const focusK = Math.max(0, Math.min(1, (zz - 0.5) / 0.2));
      for (let i = -cols; i <= cols; i++) for (let j = -rows; j <= rows; j++) {
        const hx = i * 1.5, hy = j * S3 + (i & 1 ? S3 / 2 : 0);
        if (Math.hypot(hx, hy) > PANEL_R) continue;
        const px = cx + hx * s, py = cy + hy * s;
        if (px < -s * 2 || px > W + s * 2 || py < -s * 2 || py > H + s * 2) continue;
        const d = driveAt(hx, hy, t);
        if (focusK > 0) {
          const far = Math.min(1, Math.hypot(hx, hy) / 1.6);
          const dim = 1 - focusK * far * 0.78;
          for (const k of WEDGE_ORDER) d[k] = (far === 0 ? d[k] * (1 - focusK) + SHOW[k] * focusK : d[k]) * dim;
        }
        if (!tri) {
          let r = 0, gg = 0, b = 0; for (const k of WEDGE_ORDER) { r += RGB[k][0] * d[k]; gg += RGB[k][1] * d[k]; b += RGB[k][2] * d[k]; }
          g.fillStyle = `rgb(${Math.min(255, r * 0.75)},${Math.min(255, gg * 0.75)},${Math.min(255, b * 0.75)})`;
          g.beginPath();
          for (let v = 0; v < 6; v++) { const a = ((-120 + v * 60) * Math.PI) / 180; const R = s * 0.94; v ? g.lineTo(px + R * Math.cos(a), py + R * Math.sin(a)) : g.moveTo(px + R * Math.cos(a), py + R * Math.sin(a)); }
          g.fill();
        } else {
          const wall = Math.min(0.09, 0.02 + s / 4000);
          for (const k of WEDGE_ORDER) {
            const a = (WEDGE_ANGLE[k] * Math.PI) / 180; const a1 = a - Math.PI / 6, a2 = a + Math.PI / 6;
            const R = s * (1 - wall) * 0.9; // wider gap between pixels than between subpixels
            const ox = Math.cos(a) * s * wall * 0.9, oy = Math.sin(a) * s * wall * 0.9;
            const lv = 0.1 + 0.9 * Math.pow(d[k], 1 / 2.2);
            g.fillStyle = `rgba(${RGB[k][0]},${RGB[k][1]},${RGB[k][2]},${lv})`;
            g.beginPath(); g.moveTo(px + ox, py + oy); g.lineTo(px + ox + R * Math.cos(a1), py + oy + R * Math.sin(a1)); g.lineTo(px + ox + R * Math.cos(a2), py + oy + R * Math.sin(a2)); g.closePath(); g.fill();
          }
        }
      }
      g.restore();
      // dome sheen + rim
      const rg = g.createRadialGradient(cx - PANEL_R * s * 0.35, cy - PANEL_R * s * 0.45, 0, cx, cy, PANEL_R * s * 1.05);
      rg.addColorStop(0, 'rgba(255,255,255,.10)'); rg.addColorStop(0.5, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, PANEL_R * s * 1.02, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(160,180,230,.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, PANEL_R * s * 1.02, 0, Math.PI * 2); g.stroke();
      if (tier === 'full' && visible) raf = requestAnimationFrame(draw);
      else if (tier !== 'full') raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [tier, visible]);

  const stage = [...STAGES].reverse().find((st) => z >= st.at - 0.001) ?? STAGES[0];
  const pixelOn = Math.max(0, Math.min(1, (z - 0.6) / 0.1)) * (1 - Math.max(0, Math.min(1, (z - 0.84) / 0.06)));
  const wellsOn = Math.max(0, Math.min(1, (z - 0.84) / 0.08));

  return (
    <div className="x4 hz" data-tier={tier} ref={setRefs}>
      <div className="x4-head">
        <div>
          <p className="x4-eyebrow">NewGen × Sony · <b>The Hexagon pixel</b> · zoom</p>
          <h4 className="x4-title">{stage.label}. <span className="x4-six">{stage.sub}</span></h4>
        </div>
        <div className="x4-toggles" role="group" aria-label="Zoom stages">
          {STAGES.map((st) => (
            <button key={st.label} type="button" className="x4-chip" aria-pressed={stage === st} onClick={() => { userTouched.current = true; setZ(st.at === 0 ? 0 : st.at + 0.04); }}>{st.label}</button>
          ))}
        </div>
      </div>
      <div className="hz-stage">
        <canvas ref={canvas} aria-hidden="true" style={{ opacity: 1 - wellsOn }} />
        {/* one-pixel annotation */}
        <svg className="hz-pixel" viewBox="-217 -217 434 434" style={{ opacity: pixelOn }} aria-hidden={pixelOn < 0.5}>
          <polygon points={[-90, 30, 150].map((d) => { const a = (d * Math.PI) / 180; return `${150 * Math.cos(a)},${150 * Math.sin(a)}`; }).join(' ')} fill="none" stroke="#fff" strokeOpacity=".7" strokeDasharray="4 5" />
          <polygon points={[90, 210, -30].map((d) => { const a = (d * Math.PI) / 180; return `${150 * Math.cos(a)},${150 * Math.sin(a)}`; }).join(' ')} fill="none" stroke="#fff" strokeOpacity=".35" strokeDasharray="1 5" />
          <polygon points={hexPoints(136)} fill="none" stroke="#f0f4ff" strokeOpacity=".5" />
          {WEDGE_ORDER.map((k) => {
            const a = (WEDGE_ANGLE[k] * Math.PI) / 180; const r = 172;
            return <text key={k} x={r * Math.cos(a)} y={r * Math.sin(a) + 4} textAnchor="middle" fontSize="13" fill={UI[k]} fontFamily="var(--x4-mono)">{NAMES[k]}</text>;
          })}
          <text x="-210" y="196" fontSize="11" fill="var(--x4-white)" fontFamily="var(--x4-mono)">— — RGB triangle</text>
          <text x="-210" y="211" fontSize="11" fill="var(--x4-dim)" fontFamily="var(--x4-mono)">· · · inverted MCY triangle</text>
          <text x="210" y="-200" fontSize="10" textAnchor="end" fill="var(--x4-dim)" fontFamily="var(--x4-mono)">complements face each other: R↔C · Y↔B · G↔M</text>
        </svg>
        {/* well cross-section */}
        <svg className="hz-wells" viewBox="0 0 640 400" style={{ opacity: wellsOn }} aria-hidden={wellsOn < 0.5} role="img" aria-label="Cross-section through three subpixel wells">
          <defs>
            <linearGradient id="hz-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fb6ff" stopOpacity=".28" /><stop offset="1" stopColor="#9fb6ff" stopOpacity=".08" /></linearGradient>
            <linearGradient id="hz-kuro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" /><stop offset=".5" stopColor="#11131c" /><stop offset="1" stopColor="#000" /></linearGradient>
            {(['R', 'Y', 'G'] as Key[]).map((k) => (
              <linearGradient key={k} id={`hz-ray-${k}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={UI[k]} stopOpacity=".9" /><stop offset="1" stopColor={UI[k]} stopOpacity="0" /></linearGradient>
            ))}
          </defs>
          <text x="20" y="28" fontSize="11" fill="var(--x4-dim)" fontFamily="var(--x4-mono)" letterSpacing="2">VIEWER ↑</text>
          <rect x="0" y="40" width="640" height="54" fill="url(#hz-glass)" />
          <text x="626" y="72" fontSize="11" textAnchor="end" fill="var(--x4-text)" fontFamily="var(--x4-mono)">dome faceplate · the first lens</text>
          {(['R', 'Y', 'G'] as Key[]).map((k, i) => {
            const x = 60 + i * 190;
            return (
              <g key={k}>
                {/* light leaving through the glass */}
                <path d={`M${x + 20} 94 L${x + 50} 10 L${x + 110} 10 L${x + 140} 94 Z`} fill={`url(#hz-ray-${k})`} opacity=".55" className="hz-ray" style={{ animationDelay: `${i * 0.4}s` }} />
                {/* QD emitter on the glass */}
                <rect x={x} y="94" width="160" height="16" fill={UI[k]} />
                <rect x={x} y="94" width="160" height="16" fill="#fff" opacity=".25" className="hz-hit" style={{ animationDelay: `${i * 0.4}s` }} />
                <text x={x + 80} y="132" textAnchor="middle" fontSize="11" fill={UI[k]} fontFamily="var(--x4-mono)">{NAMES[k]} QD layer</text>
                {/* incoming beam from the gun side */}
                <line x1={x + 80} y1="390" x2={x + 80} y2="112" stroke={UI[k]} strokeWidth="2.5" strokeDasharray="6 10" className="hz-beam" style={{ animationDelay: `${i * 0.4}s` }} />
              </g>
            );
          })}
          {[40, 230, 420, 610].map((x, i) => (
            <g key={x}>
              <rect x={x - 10 + (i === 0 ? 10 : 0)} y="94" width={i === 0 || i === 3 ? 10 : 20} height="210" fill="url(#hz-kuro)" stroke="#2a3860" strokeWidth=".8" />
            </g>
          ))}
          <path d="M240 260 C 300 250, 330 230, 352 196" stroke="var(--x4-text)" fill="none" strokeWidth=".8" />
          <text x="236" y="276" fontSize="11" textAnchor="end" fill="var(--x4-text)" fontFamily="var(--x4-mono)">Kurocoat wall</text>
          <text x="236" y="290" fontSize="10" textAnchor="end" fill="var(--x4-dim)" fontFamily="var(--x4-mono)">ultra-black, absorbs stray light</text>
          <text x="20" y="390" fontSize="11" fill="var(--x4-dim)" fontFamily="var(--x4-mono)" letterSpacing="2">ELECTRON BEAMS FROM THE GUN ↑</text>
        </svg>
      </div>
      <div className="x4-range">
        <label htmlFor="hz-z">Zoom <output>{stage.label}</output></label>
        <input id="hz-z" type="range" min="0" max="1" step="0.001" value={z}
          onChange={(e) => { userTouched.current = true; setZ(+e.target.value); }}
          style={{ ['--track' as string]: 'linear-gradient(90deg,#1a2240,var(--R),var(--Y),var(--G),var(--C),var(--B),var(--M))' }} />
      </div>
      <p className="x4-note">Illustrative, not to scale. Lattice density and image are schematic; well depth and wall thickness are not drawn to dimension.</p>
      <style>{`
        .hz-stage { position: relative; aspect-ratio: 16 / 10; border-radius: 10px; overflow: hidden; background: #020309; border: 1px solid var(--x4-line); margin-bottom: 14px; }
        @media (max-width: 620px) { .hz-stage { aspect-ratio: 1; } }
        .hz-stage canvas, .hz-stage svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .hz-stage svg { pointer-events: none; transition: opacity .25s; }
        .hz[data-tier='full'] .hz-beam { animation: hz-beam 1.2s linear infinite; }
        .hz[data-tier='full'] .hz-hit { animation: hz-hit 1.2s ease-out infinite; }
        .hz[data-tier='full'] .hz-ray { animation: hz-ray 1.2s ease-out infinite; }
        @keyframes hz-beam { to { stroke-dashoffset: -32; } }
        @keyframes hz-hit { 0%,100% { opacity: .05 } 20% { opacity: .55 } }
        @keyframes hz-ray { 0%,100% { opacity: .35 } 25% { opacity: .8 } }
      `}</style>
    </div>
  );
}
