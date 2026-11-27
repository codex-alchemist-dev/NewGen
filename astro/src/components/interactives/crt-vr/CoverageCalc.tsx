/**
 * Act 4 · "The gamut" — coverage-calc.
 * Live xy area comparison. The panel set (B450 C490 G520 Y575 R635, 20 nm) lands at
 * ≈176% of DCI-P3 and ≈80% of human vision. Narrow the lines, or switch to the
 * moonshot set, and watch the 200% target. Every figure is computed, not typed.
 */
import { useMemo, useState } from 'react';
import './act4.css';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { buildPrimaries, gamutArea, polyArea, P3, P3_AREA, REC2020, SRGB, LOCUS_AREA, PRIMARY_SPEC, MOONSHOT_SPEC, DEFAULT_FWHM, MOONSHOT_FWHM, UI } from './lib/color';
import { XYChart, poly, sx, sy, LOCUS_PATH } from './lib/XYChart';
import { useAct4Tier, useInView } from './lib/useTier';

type Mode = 'panel' | 'moonshot';

export default function CoverageCalc(props: Partial<VfxSlotProps>) {
  const tier = useAct4Tier(props.tier, props.reducedMotion);
  const [ref, seen] = useInView<HTMLDivElement>();
  const [mode, setMode] = useState<Mode>('panel');
  const [fwhm, setFwhm] = useState(DEFAULT_FWHM);
  const spec = mode === 'panel' ? PRIMARY_SPEC : MOONSHOT_SPEC;
  const ps = useMemo(() => buildPrimaries(spec, fwhm), [spec, fwhm]);
  const rgbOnly = useMemo(() => polyArea([ps.by.R.xy, ps.by.G.xy, ps.by.B.xy]), [ps]);
  const hexA = gamutArea(ps);
  const hex = ps.list.map((p) => p.xy);
  const p3pct = (hexA / P3_AREA) * 100;

  const rows = [
    { id: 'srgb', label: 'sRGB', a: polyArea(SRGB), color: '#8fa3c8' },
    { id: 'p3', label: 'DCI-P3', a: P3_AREA, color: '#ffb547' },
    { id: 'rec2020', label: 'Rec.2020', a: polyArea(REC2020), color: '#9a7dff' },
    { id: 'rgb', label: 'Same QDs, RGB only', a: rgbOnly, color: '#c8d4f0' },
    { id: 'hex', label: mode === 'panel' ? 'CRT-VR RGBMCY' : 'RGBMCY moonshot', a: hexA, color: 'six' },
    { id: 'vision', label: 'Human vision', a: LOCUS_AREA, color: '#f0f4ff' },
  ];
  const maxPct = (LOCUS_AREA / P3_AREA) * 100;

  return (
    <div className="x4 cc" data-tier={tier} ref={ref}>
      <div className="x4-head">
        <div>
          <p className="x4-eyebrow">NewGen × Sony · <b>Coverage calculator</b> · xy area</p>
          <h4 className="x4-title"><span className="x4-six">{Math.round(p3pct)}%</span> of DCI-P3. {Math.round((hexA / LOCUS_AREA) * 100)}% of everything you can see.</h4>
        </div>
        <div className="x4-toggles" role="group" aria-label="Primary set">
          <button type="button" className="x4-chip" aria-pressed={mode === 'panel'} style={{ ['--k' as string]: UI.G }} onClick={() => { setMode('panel'); setFwhm(DEFAULT_FWHM); }}>Panel target</button>
          <button type="button" className="x4-chip" aria-pressed={mode === 'moonshot'} style={{ ['--k' as string]: UI.M }} onClick={() => { setMode('moonshot'); setFwhm(MOONSHOT_FWHM); }}>200% moonshot</button>
        </div>
      </div>

      <div className="x4-grid">
        <div className="cc-bars">
          {rows.map((r) => {
            const pct = (r.a / P3_AREA) * 100;
            return (
              <div key={r.id} className={`cc-row ${r.id}`}>
                <span className="lbl">{r.label}</span>
                <span className="bar">
                  <i style={{ width: seen || tier === 'static' ? `${(pct / maxPct) * 100}%` : '0%', background: r.color === 'six' ? 'linear-gradient(90deg,var(--B),var(--C),var(--G),var(--Y),var(--R),var(--M))' : r.color }} />
                  {r.id === 'hex' && <b className="tick t170" style={{ left: `${(170 / maxPct) * 100}%` }} />}
                  {r.id === 'hex' && <b className="tick t185" style={{ left: `${(185 / maxPct) * 100}%` }} />}
                  {r.id === 'hex' && <b className="tick t200" style={{ left: `${(200 / maxPct) * 100}%` }}><em>200%</em></b>}
                </span>
                <output>{pct.toFixed(r.id === 'hex' ? 1 : 0)}%</output>
              </div>
            );
          })}
          <p className="x4-note" style={{ marginTop: 4 }}>Bars are xy area relative to DCI-P3 (P3 = 100%). Ticks on the RGBMCY bar mark the 170–185% target band and the 200% moonshot.</p>

          <div className="x4-range">
            <label htmlFor="cc-fwhm">Emission line width (FWHM) <output>{fwhm} nm</output></label>
            <input id="cc-fwhm" type="range" min="4" max="40" step="1" value={fwhm} onChange={(e) => setFwhm(+e.target.value)}
              style={{ ['--track' as string]: 'linear-gradient(90deg,#19ff74,#ffe135,#ff3b2f)', ['--thumb' as string]: '#fff' }} />
          </div>

          <div className="x4-readouts">
            <div className="x4-ro"><span>vs RGB alone</span><strong>+{Math.round(((hexA - rgbOnly) / rgbOnly) * 100)}%</strong><small>area from adding C and Y</small></div>
            <div className="x4-ro"><span>M adds</span><strong>0</strong><small>xy area · it lives on the purple line</small></div>
            <div className="x4-ro"><span>Lines</span><strong style={{ fontSize: 18, lineHeight: 1.5 }}>{spec.B}·{spec.C}·{spec.G}·{spec.Y}·{spec.R}</strong><small>nm, M = {spec.B}+{spec.R}</small></div>
          </div>
        </div>

        <XYChart ariaLabel="Chromaticity diagram comparing gamut areas" labels={false} dimFill={0.35}>
          <path d={LOCUS_PATH} fill="#f0f4ff" fillOpacity=".04" />
          <polygon points={poly(P3)} fill="#ffb547" fillOpacity=".12" stroke="#ffb547" strokeWidth="1.4" />
          <polygon points={poly(hex)} fill="#f0f4ff" fillOpacity=".1" stroke="#f0f4ff" strokeWidth="2.2" style={{ transition: tier === 'static' ? 'none' : 'all .4s' }} />
          {ps.list.map((p) => <circle key={p.key} cx={0} cy={0} r="5" fill={UI[p.key]} stroke="#04050a" strokeWidth="1.5"
            style={{ transform: `translate(${sx(p.xy[0])}px, ${sy(p.xy[1])}px)`, transition: tier === 'static' ? 'none' : 'transform .4s' }} />)}
        </XYChart>
      </div>
      <p className="x4-note">
        Panel target: B 450, C 490, G 520, Y 575, R 635 nm at 20 nm FWHM, the narrow lines of nanoplatelet and perovskite QDs. Moonshot: line positions found by a grid search for the largest pentagon (B 430, C 496, G 516, Y 550, R 680 nm), which crosses 200% only at very narrow lines. The theoretical ceiling for any display is the whole locus, {Math.round(maxPct)}% of P3.
      </p>
      <style>{`
        .cc-bars { display: grid; gap: 12px; }
        .cc-row { display: grid; grid-template-columns: minmax(110px, 150px) 1fr 58px; gap: 10px; align-items: center; font: 400 11px/1.2 var(--x4-mono); color: var(--x4-dim); }
        .cc-row.hex .lbl { color: var(--x4-white); }
        .cc-row .bar { position: relative; height: 14px; background: #0a0e1b; border: 1px solid var(--x4-line); border-radius: 3px; }
        .cc-row.hex .bar { height: 22px; }
        .cc-row .bar i { position: absolute; inset: 0 auto 0 0; border-radius: 2px; transition: width 1.4s var(--x4-ease); }
        .cc-row.vision .bar i { opacity: .25; }
        .cc-row .tick { position: absolute; top: -5px; bottom: -5px; width: 1px; background: #fff; opacity: .55; }
        .cc-row .tick.t200 { opacity: 1; background: var(--M); box-shadow: 0 0 6px var(--M); }
        .cc-row .tick em { position: absolute; top: -12px; left: 3px; font: 500 9px/1 var(--x4-mono); color: var(--M); font-style: normal; }
        .cc-row output { color: var(--x4-white); text-align: right; font-variant-numeric: tabular-nums; }
        .cc-row.hex output { font: 400 22px/1 var(--x4-display); }
      `}</style>
    </div>
  );
}
