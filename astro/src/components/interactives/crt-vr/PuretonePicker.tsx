/**
 * Act 4 · Puretone™ — puretone-picker (headline interactive).
 *
 * A real hue × saturation picker over the panel's own gamut, plus a luminance
 * slider, drives a live hexagon pixel. The Puretone solver (lib/color.ts) picks the
 * fewest pure tones that hit the colour exactly; only when the requested luminance
 * passes that set's brightness budget do other tones join, each fading in at the
 * drive level a bounded LP assigns it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './act4.css';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { buildPrimaries, puretone, hueSatToXy, hueOf, boundaryAt, dist, D65, PEAK_Y, UI, NAMES, xyzToSrgb, xyToXYZ, css, type Key, type XY } from './lib/color';
import { HexPixel, WEDGE_ORDER } from './lib/HexPixel';
import { useAct4Tier, useVisible } from './lib/useTier';

/** Proposed full-field peak at the faceplate (coordinator: label as proposed). */
const PEAK_NITS = 1500;
const WHEEL = 300;

export default function PuretonePicker(props: Partial<VfxSlotProps>) {
  const tier = useAct4Tier(props.tier, props.reducedMotion);
  const ps = useMemo(() => buildPrimaries(), []);
  const [hue, setHue] = useState(() => hueOf(ps.by.C.xy));
  const [sat, setSat] = useState(1);
  const [lum, setLum] = useState(0.35); // fraction of this colour's own peak
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rootRef, visible] = useVisible<HTMLDivElement>();
  const demo = useRef<number | null>(null);

  const target: XY = useMemo(() => hueSatToXy(ps, hue, sat), [ps, hue, sat]);
  // the solver needs absolute Y; we ask it for the colour's ceiling first
  const ceiling = useMemo(() => puretone(ps, target, PEAK_Y * 2).maxY, [ps, target]);
  const res = useMemo(() => puretone(ps, target, Math.max(1e-6, lum * ceiling)), [ps, target, lum, ceiling]);
  const budgetFrac = Math.min(1, res.pureBudget / ceiling);
  const tones = WEDGE_ORDER.filter((k) => res.drive[k] > 0);

  /* wheel raster: hue = angle around D65 in xy (same orientation as the xy chart), radius = saturation */
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const n = WHEEL; c.width = n; c.height = n;
    const g = c.getContext('2d')!; const img = g.createImageData(n, n);
    const bcache = new Map<number, XY>();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const dx = (i - n / 2) / (n / 2), dy = (j - n / 2) / (n / 2);
      const r = Math.hypot(dx, dy); const o = (j * n + i) * 4;
      if (r > 1) { img.data[o + 3] = 0; continue; }
      const th = Math.atan2(-dy, dx);
      const key = Math.round(th * 400);
      let b = bcache.get(key); if (!b) { b = boundaryAt(ps, key / 400); bcache.set(key, b); }
      const xy: XY = [D65[0] + (b[0] - D65[0]) * r, D65[1] + (b[1] - D65[1]) * r];
      const rgb = xyzToSrgb(xyToXYZ(xy, 1), true);
      const edge = Math.min(1, (1 - r) * n * 0.5);
      img.data[o] = rgb[0] * 255; img.data[o + 1] = rgb[1] * 255; img.data[o + 2] = rgb[2] * 255; img.data[o + 3] = 255 * edge;
    }
    g.putImageData(img, 0, 0);
  }, [ps]);

  const pick = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - el.left - el.width / 2) / (el.width / 2);
    const dy = (e.clientY - el.top - el.height / 2) / (el.height / 2);
    setHue(Math.atan2(-dy, dx)); setSat(Math.min(1, Math.hypot(dx, dy)));
  }, []);

  const preset = (xy: XY, l: number) => {
    stopDemo();
    const b = boundaryAt(ps, hueOf(xy));
    setHue(hueOf(xy)); setSat(Math.min(1, dist(xy, D65) / Math.max(1e-9, dist(b, D65)))); setLum(l);
  };
  const stopDemo = () => { if (demo.current) cancelAnimationFrame(demo.current); demo.current = null; };
  const runDemo = () => {
    stopDemo();
    if (tier === 'static') { setLum(1); return; }
    const t0 = performance.now(); const from = 0.08;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 4200); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setLum(from + (1 - from) * e);
      if (k < 1) demo.current = requestAnimationFrame(step); else demo.current = null;
    };
    demo.current = requestAnimationFrame(step);
  };
  useEffect(() => () => stopDemo(), []);
  useEffect(() => { if (!visible) stopDemo(); }, [visible]);

  const mx = 0.5 + 0.5 * sat * Math.cos(hue), my = 0.5 - 0.5 * sat * Math.sin(hue);
  const swatch = css(xyzToSrgb(xyToXYZ(res.xy, 1), true));
  const shown = xyzToSrgb(xyToXYZ(res.xy, Math.max(0.04, Math.pow(lum, 0.6))), false);
  const nits = (res.Y / PEAK_Y) * PEAK_NITS;

  const PRESETS: { label: string; xy: XY; l: number; k?: Key }[] = [
    { label: 'Pure cyan', xy: ps.by.C.xy, l: 0.6, k: 'C' },
    { label: 'Pure magenta', xy: ps.by.M.xy, l: 0.6, k: 'M' },
    { label: 'Pure yellow', xy: ps.by.Y.xy, l: 0.6, k: 'Y' },
    { label: 'Skin', xy: [0.42, 0.37], l: 0.35 },
    { label: 'Sky', xy: [0.24, 0.27], l: 0.4 },
    { label: 'White', xy: D65, l: 0.15 },
  ];

  return (
    <div className="x4 pt" data-tier={tier} ref={rootRef}>
      <div className="x4-head">
        <div>
          <p className="x4-eyebrow">NewGen × Sony · <b>Puretone™</b> · live solver</p>
          <h4 className="x4-title">Every subpixel can run alone. <span className="x4-six">Pure cyan lights only C.</span></h4>
        </div>
        <div className="x4-toggles" role="group" aria-label="Preset colours">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="x4-chip" aria-pressed="false" style={{ ['--k' as string]: p.k ? UI[p.k] : css(xyzToSrgb(xyToXYZ(p.xy, 1), true)) }} onClick={() => preset(p.xy, p.l)}>
              <span className="sw" />{p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-grid">
        <div className="pt-pick">
          <div className="pt-wheel" role="slider" aria-label="Hue and saturation" aria-valuetext={`hue ${Math.round(((hue * 180) / Math.PI + 360) % 360)} degrees, saturation ${Math.round(sat * 100)}%`} tabIndex={0}
            onPointerDown={(e) => { stopDemo(); e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
            onPointerMove={(e) => { if (e.buttons) pick(e); }}
            onKeyDown={(e) => {
              const d = e.shiftKey ? 0.1 : 0.025;
              if (e.key === 'ArrowLeft') setHue((h) => h + d * 2); else if (e.key === 'ArrowRight') setHue((h) => h - d * 2);
              else if (e.key === 'ArrowUp') setSat((s) => Math.min(1, s + d)); else if (e.key === 'ArrowDown') setSat((s) => Math.max(0, s - d)); else return;
              e.preventDefault();
            }}>
            <canvas ref={canvasRef} aria-hidden="true" />
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="49.6" fill="none" stroke="rgba(240,244,255,.25)" strokeWidth=".4" />
              {ps.list.map((p) => {
                const a = hueOf(p.xy);
                return <g key={p.key}>
                  <line x1={50 + 46 * Math.cos(a)} y1={50 - 46 * Math.sin(a)} x2={50 + 51.5 * Math.cos(a)} y2={50 - 51.5 * Math.sin(a)} stroke={UI[p.key]} strokeWidth="1" />
                  <text x={50 + 56 * Math.cos(a)} y={50 - 56 * Math.sin(a) + 1.6} fontSize="4.4" textAnchor="middle" fill={UI[p.key]} fontFamily="var(--x4-mono)">{p.key}</text>
                </g>;
              })}
              <circle cx={mx * 100} cy={my * 100} r="3.4" fill={swatch} stroke="#fff" strokeWidth="1" />
              <circle cx={mx * 100} cy={my * 100} r="5.2" fill="none" stroke="#04050a" strokeWidth=".8" />
            </svg>
          </div>

          <div className="x4-range pt-lum">
            <label htmlFor="pt-lum">Luminance <output>{Math.round(lum * 100)}% of this colour’s peak</output></label>
            <div className="pt-track">
              <input id="pt-lum" type="range" min="0" max="1" step="0.002" value={lum}
                onChange={(e) => { stopDemo(); setLum(+e.target.value); }}
                style={{ ['--track' as string]: `linear-gradient(90deg, #0b0f1c, ${swatch} ${budgetFrac * 100}%, #f0f4ff)`, ['--thumb' as string]: swatch }} />
              <span className="pt-budget" style={{ left: `calc(9px + (100% - 18px) * ${budgetFrac})`, transform: `translateX(${budgetFrac > 0.8 ? -100 : budgetFrac < 0.2 ? 0 : -50}%)` }} aria-hidden="true"><i />purity budget</span>
            </div>
            <button type="button" className="x4-chip pt-demo" onClick={runDemo}>▶ Push past the budget</button>
          </div>
        </div>

        <div className="pt-hex">
          <HexPixel drive={res.drive} r={120} glow={tier !== 'static'} pure={res.pure} recruited={res.recruited} idPrefix="pt" />
        </div>

        <div className="pt-side">
          <div className="pt-swatch" style={{ background: css(shown) }}>
            <span>{tones.length === 0 ? 'off' : `${tones.length} tone${tones.length > 1 ? 's' : ''}`}</span>
          </div>
          <div className="x4-readouts">
            <div className="x4-ro"><span>Pure set</span><strong>{res.pure.join(' + ') || '—'}</strong><small>{res.pure.length === 1 ? 'single subpixel' : `fewest tones that hit it`}{res.snapped ? ' · within 1 JND' : ''}</small></div>
            <div className="x4-ro"><span>Joined</span><strong style={{ color: res.recruited.length ? 'var(--x4-white)' : 'var(--x4-dimmer)' }}>{res.recruited.join(' + ') || 'none'}</strong><small>{res.recruited.length ? 'past the purity budget' : 'still pure'}</small></div>
            <div className="x4-ro"><span>Luminance <i className="x4-tag">proposed</i></span><strong>{Math.round(nits).toLocaleString()}</strong><small>nits at the faceplate</small></div>
            <div className="x4-ro"><span>xy</span><strong style={{ fontSize: 22 }}>{res.xy[0].toFixed(3)}, {res.xy[1].toFixed(3)}</strong><small>CIE 1931</small></div>
          </div>
          <ul className="pt-ledger" aria-label="Subpixel drive levels">
            {WEDGE_ORDER.map((k) => {
              const d = res.drive[k]; const isPure = res.pure.includes(k); const joined = res.recruited.includes(k);
              return (
                <li key={k} className={joined ? 'joined' : isPure ? 'pure' : d > 0 ? '' : 'idle'}>
                  <b style={{ color: UI[k] }}>{k}</b><span className="nm">{NAMES[k]}</span>
                  <span className="bar"><i style={{ width: `${d * 100}%`, background: UI[k] }} /></span>
                  <output>{(d * 100).toFixed(1)}%</output>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="x4-note">
        <em>The rule:</em> each colour is rendered with the closest pure tone, or the fewest tones that hit it exactly. Other tones join in only when luminance passes the pure set’s budget, and then only as much as needed (a bounded least-recruitment solve over all six, cost = distance from the target hue). Subpixel peaks are balanced so RGB and MCY each make D65 white. Nits use the proposed 1,500-nit full-field peak.
      </p>

      <style>{`
        .pt-grid { display: grid; gap: clamp(14px, 2.4vw, 28px); grid-template-columns: minmax(220px, .9fr) minmax(240px, 1fr) minmax(240px, 1fr); align-items: center; }
        @media (max-width: 980px) { .pt-grid { grid-template-columns: 1fr 1fr; } .pt-side { grid-column: 1 / -1; } }
        @media (max-width: 620px) { .pt-grid { grid-template-columns: 1fr; } }
        .pt-pick { display: grid; gap: 18px; }
        .pt-wheel { position: relative; aspect-ratio: 1; width: min(100%, 320px); margin: 10px auto 0; touch-action: none; cursor: crosshair; border-radius: 50%; }
        .pt-wheel canvas, .pt-wheel svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .pt-wheel canvas { border-radius: 50%; box-shadow: 0 0 60px -10px rgba(120,160,255,.25), inset 0 0 0 1px rgba(255,255,255,.06); }
        .pt-track { position: relative; padding-bottom: 18px; }
        .pt-budget { position: absolute; top: 22px; font: 500 9px/1 var(--x4-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--x4-white); white-space: nowrap; transition: left .35s var(--x4-ease); }
        .pt-budget i { position: absolute; left: var(--tick, 50%); top: -14px; width: 1px; height: 12px; background: var(--x4-white); }
        .pt-demo { justify-self: start; }
        .pt-hex { max-width: 380px; width: 100%; margin: 0 auto; }
        .pt .hexpx-fade { transition: opacity .55s var(--x4-ease); }
        .pt-side { display: grid; gap: 12px; }
        .pt-swatch { height: 56px; border-radius: 10px; border: 1px solid var(--x4-line-b); display: flex; align-items: flex-end; justify-content: flex-end; padding: 6px 9px; transition: background .3s; }
        .pt-swatch span { font: 500 10px/1 var(--x4-mono); letter-spacing: .14em; text-transform: uppercase; color: #fff; mix-blend-mode: difference; }
        .pt-ledger { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
        .pt-ledger li { display: grid; grid-template-columns: 16px 112px 1fr 52px; align-items: center; gap: 8px; font: 400 11px/1 var(--x4-mono); color: var(--x4-dim); transition: opacity .5s var(--x4-ease); }
        .pt-ledger li.idle { opacity: .35; }
        .pt-ledger li.joined .nm::after { content: ' · joined'; color: var(--x4-white); }
        .pt-ledger li.pure .nm { color: var(--x4-white); }
        .pt-ledger .bar { height: 6px; background: #0b0f1c; border-radius: 3px; overflow: hidden; border: 1px solid var(--x4-line); }
        .pt-ledger .bar i { display: block; height: 100%; transition: width .18s linear; box-shadow: 0 0 10px currentColor; }
        .pt-ledger output { text-align: right; color: var(--x4-white); font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
}
