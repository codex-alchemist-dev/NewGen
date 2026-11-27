/**
 * Act 4 · "Six Primaries: why three isn't enough" — gamut-explorer.
 * Colorimetric CIE 1931 2° xy diagram. Toggle sRGB, DCI-P3, Rec.2020 and the
 * RGBMCY hexagon. Primaries are computed from 20 nm QD emission lines; M is a
 * true two-peak magenta on the purple line.
 */
import { useMemo, useState } from 'react';
import './act4.css';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { buildPrimaries, gamutArea, polyArea, P3, P3_AREA, REC2020, SRGB, LOCUS_AREA, UI, NAMES, D65, type XY, type Key } from './lib/color';
import { XYChart, sx, sy, poly } from './lib/XYChart';
import { useAct4Tier, useInView } from './lib/useTier';

type Layer = 'srgb' | 'p3' | 'rec2020' | 'rgbmcy';
const LAYERS: { id: Layer; label: string; color: string; pts?: XY[] }[] = [
  { id: 'srgb', label: 'sRGB', color: '#8fa3c8', pts: SRGB },
  { id: 'p3', label: 'DCI-P3', color: '#ffb547', pts: P3 },
  { id: 'rec2020', label: 'Rec.2020', color: '#9a7dff', pts: REC2020 },
  { id: 'rgbmcy', label: 'RGBMCY', color: '#f0f4ff' },
];

const perim = (p: XY[]) => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + Math.hypot(sx(b[0]) - sx(a[0]), sy(b[1]) - sy(a[1])); }, 0);

export default function GamutExplorer(props: Partial<VfxSlotProps>) {
  const tier = useAct4Tier(props.tier, props.reducedMotion);
  const [ref, seen] = useInView<HTMLDivElement>();
  const ps = useMemo(() => buildPrimaries(), []);
  const hex = ps.list.map((p) => p.xy);
  const [on, setOn] = useState<Record<Layer, boolean>>({ srgb: true, p3: true, rec2020: false, rgbmcy: true });
  const [focus, setFocus] = useState<Key | null>(null);
  const pct = (a: number) => `${Math.round((a / P3_AREA) * 100)}%`;
  const areas: Record<Layer, number> = { srgb: polyArea(SRGB), p3: P3_AREA, rec2020: polyArea(REC2020), rgbmcy: gamutArea(ps) };
  const draw = (layer: Layer) => (on[layer] && (seen || tier === 'static') ? '' : 'off');

  // RGB triangle (from the same QD primaries) for the "three isn't enough" contrast
  const rgbTri: XY[] = [ps.by.R.xy, ps.by.G.xy, ps.by.B.xy];

  return (
    <div className="x4 gx" data-tier={tier} ref={ref}>
      <div className="x4-head">
        <div>
          <p className="x4-eyebrow">NewGen × Sony · <b>Gamut explorer</b> · CIE 1931 2° xy</p>
          <h4 className="x4-title">Three primaries draw a triangle. <span className="x4-six">Six draw the eye.</span></h4>
        </div>
        <div className="x4-toggles" role="group" aria-label="Gamut overlays">
          {LAYERS.map((l) => (
            <button key={l.id} type="button" className="x4-chip" aria-pressed={on[l.id]} style={{ ['--k' as string]: l.color }}
              onClick={() => setOn((o) => ({ ...o, [l.id]: !o[l.id] }))}>
              <span className={l.id === 'rgbmcy' ? 'sw x4-six-sw' : 'sw ring'} />{l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="x4-grid">
        <XYChart ariaLabel="CIE 1931 chromaticity diagram with sRGB, DCI-P3, Rec.2020 and the RGBMCY six-primary gamut">
          <defs>
            <filter id="gx-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <linearGradient id="gx-six" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor={UI.B} /><stop offset=".25" stopColor={UI.C} /><stop offset=".5" stopColor={UI.G} /><stop offset=".75" stopColor={UI.Y} /><stop offset="1" stopColor={UI.R} />
            </linearGradient>
          </defs>
          {LAYERS.filter((l) => l.pts).map((l) => (
            <polygon key={l.id} points={poly(l.pts!)} fill="none" stroke={l.color} strokeWidth="1.6" strokeDasharray={l.id === 'srgb' ? '5 4' : undefined}
              data-draw className={draw(l.id)} style={{ ['--len' as string]: perim(l.pts!), opacity: on[l.id] ? 1 : 0 }} />
          ))}
          {on.rgbmcy && (
            <g>
              <polygon points={poly(rgbTri)} fill="none" stroke="#fff" strokeOpacity=".22" strokeDasharray="2 4" />
              <polygon points={poly(hex)} fill="url(#gx-six)" fillOpacity=".09" stroke="none" />
              <g filter={tier === 'full' ? 'url(#gx-glow)' : undefined}>
                {ps.list.map((p, i) => {
                  const q = ps.list[(i + 1) % ps.list.length];
                  const gid = `gx-e-${p.key}${q.key}`;
                  return (
                    <g key={gid}>
                      <defs><linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={sx(p.xy[0])} y1={sy(p.xy[1])} x2={sx(q.xy[0])} y2={sy(q.xy[1])}><stop offset="0" stopColor={UI[p.key]} /><stop offset="1" stopColor={UI[q.key]} /></linearGradient></defs>
                      <line x1={sx(p.xy[0])} y1={sy(p.xy[1])} x2={sx(q.xy[0])} y2={sy(q.xy[1])} stroke={`url(#${gid})`} strokeWidth="2.6" strokeLinecap="round"
                        data-draw className={draw('rgbmcy')} style={{ ['--len' as string]: Math.hypot(sx(q.xy[0]) - sx(p.xy[0]), sy(q.xy[1]) - sy(p.xy[1])) }} />
                    </g>
                  );
                })}
              </g>
              {/* complementary axes through D65: R–C, Y–B, G–M */}
              {([['R', 'C'], ['Y', 'B'], ['G', 'M']] as [Key, Key][]).map(([a, b]) => (
                <line key={a} x1={sx(ps.by[a].xy[0])} y1={sy(ps.by[a].xy[1])} x2={sx(ps.by[b].xy[0])} y2={sy(ps.by[b].xy[1])}
                  stroke="#fff" strokeOpacity={focus === a || focus === b ? 0.55 : 0.12} strokeDasharray="1 5" />
              ))}
              {ps.list.map((p) => {
                const [x, y] = [sx(p.xy[0]), sy(p.xy[1])];
                const lbl = p.key === 'M' ? `M ${p.peaks[0]}+${p.peaks[1]} nm` : `${p.key} ${p.peaks[0]} nm`;
                const off: Record<Key, [number, number, 'start' | 'end' | 'middle']> = {
                  R: [10, 4, 'start'], Y: [10, -6, 'start'], G: [12, -4, 'start'], C: [-10, 4, 'end'], B: [-8, 16, 'end'], M: [0, 22, 'middle'],
                };
                const [ox, oy, an] = off[p.key];
                return (
                  <g key={p.key} tabIndex={0} role="button" aria-label={`${NAMES[p.key]} primary, x ${p.xy[0].toFixed(3)}, y ${p.xy[1].toFixed(3)}`}
                    onMouseEnter={() => setFocus(p.key)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(p.key)} onBlur={() => setFocus(null)} style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r={focus === p.key ? 9 : 6} fill={UI[p.key]} stroke="#04050a" strokeWidth="2" style={{ transition: 'r .3s' }} />
                    {tier === 'full' && <circle cx={x} cy={y} r="14" fill={UI[p.key]} opacity=".18" className="gx-pulse" />}
                    <text x={x + ox} y={y + oy} textAnchor={an} fontSize="11" fill="var(--x4-white)" fontWeight="500">{lbl}</text>
                  </g>
                );
              })}
              <text x={sx(0.56)} y={sy(0.19)} fontSize="9.5" fill="var(--x4-dim)" textAnchor="middle" transform={`rotate(${(Math.atan2(sy(ps.by.R.xy[1]) - sy(ps.by.B.xy[1]), sx(ps.by.R.xy[0]) - sx(ps.by.B.xy[0])) * 180) / Math.PI} ${sx(0.56)} ${sy(0.19)})`}>purple line · M adds no area here</text>
            </g>
          )}
          <circle cx={sx(D65[0])} cy={sy(D65[1])} r="1.5" fill="#fff" />
        </XYChart>

        <div className="gx-side">
          <div className="x4-readouts">
            {LAYERS.map((l) => (
              <div className="x4-ro" key={l.id} style={{ opacity: on[l.id] ? 1 : 0.45, borderColor: l.id === 'rgbmcy' ? 'var(--x4-line-b)' : undefined }}>
                <span>{l.label}</span>
                <strong className={l.id === 'rgbmcy' ? 'x4-six' : undefined}>{pct(areas[l.id])}</strong>
                <small>of DCI-P3 · {Math.round((areas[l.id] / LOCUS_AREA) * 100)}% of vision</small>
              </div>
            ))}
          </div>
          <dl className="gx-prims">
            {ps.list.map((p) => (
              <div key={p.key} className={focus === p.key ? 'is-on' : ''} onMouseEnter={() => setFocus(p.key)} onMouseLeave={() => setFocus(null)}>
                <dt><i style={{ background: UI[p.key] }} />{NAMES[p.key]}</dt>
                <dd>{p.key === 'M' ? `${p.peaks[0]} + ${p.peaks[1]} nm` : `${p.peaks[0]} nm`}</dd>
                <dd className="xy">{p.xy[0].toFixed(3)}, {p.xy[1].toFixed(3)}</dd>
              </div>
            ))}
          </dl>
          <p className="x4-note">
            <em>C and Y push the boundary out</em> into the cyan-greens and golds no RGB triangle reaches. <em>M sits on the purple line</em>, the straight edge between the blue and red peaks, so it adds no xy area. Its job is Puretone: magentas from one subpixel. Complementary pairs face each other through white: R↔C, Y↔B, G↔M.
          </p>
        </div>
      </div>
      <p className="x4-note">
        Colorimetric: spectral locus and primaries computed from the CIE 1931 2° observer (1 nm). Each primary is modeled as a 20 nm FWHM QD emission line; M is a two-peak B+R blend. Areas are in xy. Your screen cannot show colors outside its own gamut, so the fill is a desaturated preview.
      </p>
      <style>{`
        .gx-side { display: grid; gap: 14px; }
        .gx .x4-six-sw { background: conic-gradient(var(--R), var(--Y), var(--G), var(--C), var(--B), var(--M), var(--R)) !important; border-radius: 50% !important; }
        .gx-prims { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0; }
        .gx-prims > div { display: grid; grid-template-columns: 1fr auto; gap: 0 8px; padding: 8px 10px; border: 1px solid var(--x4-line); border-radius: 8px; transition: border-color .25s, background .25s; }
        .gx-prims > div.is-on { border-color: var(--x4-line-b); background: rgba(240,244,255,.04); }
        .gx-prims dt { font: 500 11px/1.3 var(--x4-mono); color: var(--x4-white); display: flex; gap: 7px; align-items: center; letter-spacing: .06em; }
        .gx-prims dt i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; box-shadow: 0 0 8px currentColor; }
        .gx-prims dd { margin: 0; font: 400 10.5px/1.3 var(--x4-mono); color: var(--x4-dim); text-align: right; }
        .gx-prims dd.xy { grid-column: 1 / -1; text-align: left; color: var(--x4-dimmer); }
        .gx[data-tier='full'] .gx-pulse { animation: gx-pulse 3.2s var(--x4-ease) infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes gx-pulse { 0%,100% { opacity: .05; transform: scale(.7) } 50% { opacity: .25; transform: scale(1.2) } }
      `}</style>
    </div>
  );
}
