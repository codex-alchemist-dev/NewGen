/**
 * acuity-curve · Act 2 · Built for how eyes actually see.
 * The eye's acuity falls off fast from a ~2° fovea. Overlaid: the CRT-VR resolution
 * map (full-res core ±5°, interlaced mid-zone to ±20°, low-res edge) and the optics,
 * which stay uniformly sharp across 180°+ (no center boost). Drag to move the gaze.
 */
import { useMemo, useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { CORE_DEG, MID_DEG, FOV_DEG, ACUITY_E2, acuity, edgeKeep, midKeep } from './lib/model';
import { useInView, useTier } from './lib/hooks';
import { Frame, Legend, Readout, Slider } from './lib/ui';

const VW = 1000, VH = 420;
const L = 64, R = 24, T = 28, B = 56;
const PW = VW - L - R, PH = VH - T - B;
const HALF = FOV_DEG / 2 + 5; // plot ±95° (180°+)
const xOf = (deg: number) => L + ((deg + HALF) / (2 * HALF)) * PW;
const yOf = (v: number) => T + (1 - v / 1.08) * PH;

/** Linear resolution of each zone relative to the core (spatial keep k → 1/√k for the checkerboard, 1/k for the edge grid). */
function crtRes(e: number, agg: number) {
  const a = Math.abs(e);
  if (a < CORE_DEG) return 1;
  if (a < MID_DEG) return 1 / Math.sqrt(midKeep(agg));
  return 1 / edgeKeep(agg);
}

export default function AcuityCurve(_: Partial<VfxSlotProps>) {
  const [gaze, setGaze] = useState(0);
  const [agg, setAgg] = useState(100);
  const tier = useTier();
  const [ref, inView] = useInView<HTMLDivElement>('-10% 0px');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const a = agg / 100;

  const { eyePath, crtPath, headroom, minMargin } = useMemo(() => {
    let eye = '', crt = '', fill = '';
    let minM = Infinity;
    const pts: [number, number, number][] = [];
    for (let d = -HALF; d <= HALF + 1e-6; d += 0.25) {
      const e = d - gaze;
      const ae = acuity(e), cr = crtRes(e, a);
      pts.push([d, ae, cr]);
      if (Math.abs(e) >= CORE_DEG) minM = Math.min(minM, cr / ae);
      eye += `${eye ? 'L' : 'M'}${xOf(d).toFixed(1)},${yOf(ae).toFixed(1)}`;
      crt += `${crt ? 'L' : 'M'}${xOf(d).toFixed(1)},${yOf(cr).toFixed(1)}`;
    }
    fill = pts.map(([d, , cr], i) => `${i ? 'L' : 'M'}${xOf(d).toFixed(1)},${yOf(cr).toFixed(1)}`).join('') +
      pts.slice().reverse().map(([d, ae]) => `L${xOf(d).toFixed(1)},${yOf(ae).toFixed(1)}`).join('') + 'Z';
    return { eyePath: eye, crtPath: crt, headroom: fill, minMargin: minM };
  }, [gaze, a]);

  const onDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * VW;
    const d = ((x - L) / PW) * 2 * HALF - HALF;
    setGaze(Math.round(Math.max(-60, Math.min(60, d))));
  };

  const animate = tier !== 'static';
  const drawn = !animate || inView;
  const ticks = [-90, -60, -30, -20, -5, 0, 5, 20, 30, 60, 90];

  return (
    <Frame
      id="acuity-curve"
      eyebrow="Interactive · Acuity vs resolution map"
      title="Sharp where the eye is sharp. Nowhere it isn't."
      controls={
        <>
          <Slider id="ac-gaze" label="Gaze" min={-60} max={60} value={gaze} onChange={setGaze} valueText={`${gaze > 0 ? '+' : ''}${gaze}°`} />
          <Slider id="ac-agg" label="Foveation aggressiveness" value={agg} onChange={setAgg} valueText={`${agg}%`} />
        </>
      }
      readout={
        <>
          <Readout k="Fovea (eye)" v="≈2" unit="°" color="var(--crtvr-white)" note={`Acuity halves by about ${ACUITY_E2}° out.`} />
          <Readout k="Full-res core" v={`±${CORE_DEG}`} unit="°" color="var(--crtvr-phosphor)" note="Covers the fovea plus eye-tracking margin." />
          <Readout k="Interlaced mid-zone" v={`±${MID_DEG}`} unit="°" color="var(--crtvr-blue)" />
          <Readout big k="Lowest headroom outside the core" v={`${minMargin.toFixed(2)}×`} color={minMargin >= 1 ? 'var(--crtvr-phosphor)' : 'var(--crtvr-rose)'}
            note="Lowest ratio of CRT-VR resolution to eye acuity beyond ±5°. Above 1× means the eye never out-resolves the scan." />
        </>
      }
      hint="Drag on the chart, or use the sliders. The resolution map follows the gaze."
      foot={<><b>Illustrative.</b> Relative acuity = 1 / (1 + e / {ACUITY_E2}°). Zone resolution is linear: mid-zone 1/√k (checkerboard keep k = 1–4), edge 1/k (grid keep k = 2–8), from the shared model.</>}
    >
      <div ref={ref} className={`ac${drawn ? ' is-drawn' : ''}${animate ? ' is-anim' : ''}`}>
        <svg ref={svgRef} className="ix-svg" viewBox={`0 0 ${VW} ${VH}`} role="img"
          aria-label={`Eye acuity versus CRT-VR resolution. Gaze ${gaze} degrees. Worst-case headroom ${minMargin.toFixed(2)} times.`}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onDrag(e); }} onPointerMove={onDrag}>
          <defs>
            <linearGradient id="ac-head" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00ff99" stopOpacity=".22" />
              <stop offset="1" stopColor="#00ff99" stopOpacity=".03" />
            </linearGradient>
            <filter id="ac-glow" x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* zone bands */}
          <rect x={xOf(gaze - MID_DEG)} y={T} width={xOf(gaze + MID_DEG) - xOf(gaze - MID_DEG)} height={PH} fill="#00b4ff" opacity=".05" />
          <rect x={xOf(gaze - CORE_DEG)} y={T} width={xOf(gaze + CORE_DEG) - xOf(gaze - CORE_DEG)} height={PH} fill="#00ff99" opacity=".08" />
          {/* grid */}
          {[0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={L} x2={L + PW} y1={yOf(v)} y2={yOf(v)} stroke="#1a2240" />
              <text x={L - 10} y={yOf(v) + 4} textAnchor="end" className="ac__t">{Math.round(v * 100)}%</text>
            </g>
          ))}
          <line x1={L} x2={L + PW} y1={yOf(0)} y2={yOf(0)} stroke="#2a3860" />
          {ticks.map((d) => (
            <g key={d}>
              <line x1={xOf(d)} x2={xOf(d)} y1={yOf(0)} y2={yOf(0) + 5} stroke="#2a3860" />
              <text x={xOf(d)} y={yOf(0) + 20} textAnchor="middle" className="ac__t">{d > 0 ? '+' : ''}{d}°</text>
            </g>
          ))}
          <text x={L + PW / 2} y={VH - 8} textAnchor="middle" className="ac__t ac__t--axis">Angle across the 180°+ field</text>
          <text x={16} y={T + PH / 2} textAnchor="middle" className="ac__t ac__t--axis" transform={`rotate(-90 16 ${T + PH / 2})`}>Relative resolution</text>

          {/* headroom fill */}
          <path d={headroom} fill="url(#ac-head)" className="ac__fill" />
          {/* optics: uniform, no center boost */}
          <line x1={xOf(-90)} x2={xOf(90)} y1={yOf(1.04)} y2={yOf(1.04)} stroke="#ffe135" strokeDasharray="2 6" strokeWidth="1.5" className="ac__optics" />
          <text x={xOf(90)} y={yOf(1.04) - 8} textAnchor="end" className="ac__t" fill="#ffe135">Optics · uniform to ±90°, no center boost</text>
          {/* CRT-VR map */}
          <path d={crtPath} fill="none" stroke="#00ff99" strokeWidth="2.5" filter={tier === 'full' ? 'url(#ac-glow)' : undefined} className="ac__line" pathLength={1} />
          {/* eye acuity */}
          <path d={eyePath} fill="none" stroke="#f0f4ff" strokeWidth="2" className="ac__line ac__line--eye" pathLength={1} />
          {/* gaze marker */}
          <line x1={xOf(gaze)} x2={xOf(gaze)} y1={T - 6} y2={yOf(0)} stroke="#f0f4ff" strokeOpacity=".35" strokeDasharray="3 4" />
          <g transform={`translate(${xOf(gaze)} ${T - 10})`}>
            <circle r="6" fill="none" stroke="#f0f4ff" />
            <circle r="2" fill="#f0f4ff" />
          </g>
        </svg>
      </div>
      <Legend items={[
        { c: '#f0f4ff', l: 'Eye acuity' }, { c: '#00ff99', l: 'CRT-VR scan resolution' }, { c: '#ffe135', l: 'Optics sharpness' },
      ]} />
      <style>{`
        .ac__t { font: 400 11px var(--crtvr-font-mono); fill: var(--crtvr-text-dim); letter-spacing: .06em; }
        .ac__t--axis { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; fill: var(--crtvr-text-dimmer); }
        .ac svg { cursor: ew-resize; }
        .ac.is-anim .ac__line { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.8s var(--crtvr-ease-out); }
        .ac.is-anim .ac__line--eye { transition-delay: .35s; }
        .ac.is-anim .ac__fill, .ac.is-anim .ac__optics { opacity: 0; transition: opacity 1s .9s; }
        .ac.is-anim.is-drawn .ac__line { stroke-dashoffset: 0; }
        .ac.is-anim.is-drawn .ac__fill, .ac.is-anim.is-drawn .ac__optics { opacity: 1; }
      `}</style>
    </Frame>
  );
}
