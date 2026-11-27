/**
 * Act 8 · flat-vs-cone
 * Left: a flat panel pushed through a pancake lens onto a curved field of view. The
 * rectangle has to be stretched (distortion), sharpness falls off toward the edge, and the
 * view sits inside a frame ("screen in a box").
 * Right: CRT-VR. The dome already emits a cone; the relay turns the diverging cone into a
 * converging cone wrapped around the eye, so the view is uniform out to the edge.
 * A gaze slider moves a loupe across both views. Illustrative.
 */
import { useId, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { useTier, ICE, CYAN } from './wraparound/shared';
import { GAZE_CONE } from './wraparound/gazecone-data';
import { GazeConeDefs, GazeConeOptics, Eye, VIEW, lightPts, pts, ringRay } from './wraparound/GazeCone';
import './wraparound/wraparound.css';

const VW = 360, VH = 170;

/** Grid lines for the "what you see" view. warp(x,y) maps normalised coords (-1..1). */
function gridLines(warp: (x: number, y: number) => [number, number], nx = 12, ny = 6) {
  const lines: string[] = [];
  const P = (x: number, y: number) => { const [u, v] = warp(x, y); return `${(VW / 2 + u * VW * 0.47).toFixed(1)},${(VH / 2 + v * VH * 0.44).toFixed(1)}`; };
  for (let i = 0; i <= nx; i++) { const x = -1 + (2 * i) / nx; lines.push(Array.from({ length: 21 }, (_, k) => P(x, -1 + k / 10)).join(' ')); }
  for (let j = 0; j <= ny; j++) { const y = -1 + (2 * j) / ny; lines.push(Array.from({ length: 41 }, (_, k) => P(-1 + k / 20, y)).join(' ')); }
  return lines;
}
// flat panel stretched onto a curved field: pincushion, inside a box
const flatLines = gridLines((x, y) => { const r2 = x * x * 0.8 + y * y * 0.6; const s = 0.62 * (1 + 0.32 * r2); return [x * s, y * s * 0.95]; });
// CRT-VR: uniform wrap to the edges
const coneLines = gridLines((x, y) => [x * 0.98, y * 0.86]);

function View({ lines, uid, boxed, gaze, edgeBlur }: { lines: string[]; uid: string; boxed: boolean; gaze: number; edgeBlur: boolean }) {
  const gx = VW / 2 + gaze * VW * 0.4;
  const blurAmt = edgeBlur ? 0.15 + 2.4 * Math.abs(gaze) ** 1.6 : 0;
  const box = boxed && <rect x={VW * 0.13 - VW * 0.13} y={VH * 0.1 - VH * 0.3} width={VW * 0.74 + VW * 0.26} height={VH * 0.8 + VH * 0.6} rx="40" fill="none" stroke="#000" strokeWidth={VW * 0.26} />;
  const grid = (sharpOnly: boolean) => (
    <g fill="none" stroke={ICE} strokeOpacity=".55" strokeWidth="1">
      {edgeBlur && !sharpOnly ? (
        <>
          <g filter={`url(#${uid}-eb)`}>{lines.map((l, i) => <polyline key={i} points={l} />)}</g>
          <g mask={`url(#${uid}-mk)`}>{lines.map((l, i) => <polyline key={i} points={l} />)}</g>
        </>
      ) : lines.map((l, i) => <polyline key={i} points={l} />)}
    </g>
  );
  return (
    <svg className="wo__svg" viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={boxed ? 'Flat panel view: stretched grid, soft edges, inside a box' : 'CRT-VR view: uniform grid to the edge of vision'}>
      <defs>
        <filter id={`${uid}-eb`}><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={`${uid}-lb`}><feGaussianBlur stdDeviation={blurAmt.toFixed(2)} /></filter>
        <radialGradient id={`${uid}-m`}><stop offset=".45" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
        <mask id={`${uid}-mk`}><rect width={VW} height={VH} fill={`url(#${uid}-m)`} /></mask>
        <clipPath id={`${uid}-lc`}><circle cx={gx} cy={VH / 2} r="30" /></clipPath>
      </defs>
      <rect width={VW} height={VH} fill="#020306" />
      {grid(false)}
      {box}
      <g clipPath={`url(#${uid}-lc)`}>
        <rect width={VW} height={VH} fill="#020306" />
        <g transform={`translate(${gx} ${VH / 2}) scale(1.8) translate(${-gx} ${-VH / 2})`}>
          <g filter={edgeBlur ? `url(#${uid}-lb)` : undefined}>{grid(true)}</g>
          {box}
        </g>
      </g>
      <circle cx={gx} cy={VH / 2} r="30" fill="none" stroke={CYAN} strokeWidth="1.4" />
    </svg>
  );
}

export default function FlatVsCone(props: Partial<VfxSlotProps>) {
  const tier = useTier(props.tier ?? 'full');
  const uid = useId().replace(/:/g, '');
  const [gaze, setGaze] = useState(0.7);
  const flow = tier === 'full';

  // pancake schematic: panel → (pass 1) → half mirror → (pass 2 back) → (pass 3) → eye
  const PW = 360, PH = 230;
  const yRows = [70, 95, 120, 145, 170];

  return (
    <figure className="wo" data-tier={tier} aria-label="Flat panel through a pancake lens versus the CRT-VR cone">
      <p className="wo__eyebrow">Interactive · Flat vs. cone</p>
      <div className="wo__grid2">
        <div className="wo__panel">
          <h4>Flat panel · <b>pancake lens</b></h4>
          <svg className="wo__svg" viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="A flat panel's light folds back and forth through a pancake lens before reaching the eye">
            <rect x="40" y="40" width="8" height="150" fill="#b9c8ff" opacity=".85" />
            <text x="44" y="30" fontSize="10" fill="#6a7fa8" textAnchor="middle">flat panel</text>
            <path d="M150,40 Q160,115 150,190" fill="none" stroke={ICE} strokeOpacity=".6" strokeWidth="5" />
            <path d="M200,40 Q210,115 200,190" fill="none" stroke={ICE} strokeOpacity=".6" strokeWidth="5" />
            <text x="175" y="30" fontSize="10" fill="#6a7fa8" textAnchor="middle">pancake fold</text>
            {yRows.map((y, i) => (
              <polyline key={i} points={`48,${y} 152,${y} 200,${y + 5} 152,${y + 10} 200,${y + 15} ${300},${115 + (y - 120) * 0.25}`} fill="none"
                stroke="#b9c8ff" strokeOpacity=".55" strokeWidth="1" strokeDasharray={flow ? '5 5' : undefined} data-flow={flow ? '' : undefined} />
            ))}
            <circle cx="318" cy="115" r="18" fill="#0b1018" stroke={ICE} strokeOpacity=".7" />
            <text x="12" y={PH - 8} fontSize="10" fill="#6a7fa8">A rectangle, folded and stretched onto a curved view</text>
          </svg>
          <View lines={flatLines} uid={`${uid}a`} boxed gaze={gaze} edgeBlur />
          <p className="wo__note">Distortion, edge blur, and a screen in a box.</p>
        </div>
        <div className="wo__panel">
          <h4>CRT-VR · <b>cone in, cone out</b></h4>
          <svg className="wo__svg" viewBox={`40 0 ${VIEW.w - 80} ${VIEW.h - 24}`} role="img" aria-label="The CRT dome emits a diverging cone; the relay turns it into a cone converging on the eye">
            <GazeConeDefs uid={uid} />
            <GazeConeOptics uid={uid} glow={tier === 'full'} labels={false}>
              {['-50', '-30', '-10', '10', '30', '50'].map((k) => (
                <g key={k} fill="none" stroke={ICE} strokeLinejoin="round">
                  {GAZE_CONE.fields[k].map((r, i) => (
                    <polyline key={i} points={lightPts(r)} strokeOpacity={i === 2 ? 0.9 : 0.4} strokeWidth={i === 2 ? 1.4 : 0.9}
                      strokeDasharray={flow && i === 2 ? '6 6' : undefined} data-flow={flow && i === 2 ? '' : undefined} />
                  ))}
                </g>
              ))}
              {[65, -65, 80, -80].map((a) => <polyline key={a} points={pts(ringRay(a))} fill="none" stroke={ICE} strokeOpacity=".6" />)}
            </GazeConeOptics>
            <Eye />
          </svg>
          <View lines={coneLines} uid={`${uid}b`} boxed={false} gaze={gaze} edgeBlur={false} />
          <p className="wo__note">The tube's output is already a cone. Wrapped around your eye, it stays sharp to the edge.</p>
        </div>
      </div>
      <div className="wo__controls">
        <div className="wo__range">
          <label htmlFor={`${uid}-g`}>Look toward the edge</label>
          <input id={`${uid}-g`} type="range" min={-1} max={1} step={0.01} value={gaze} onChange={(e) => setGaze(+e.target.value)} />
        </div>
      </div>
      <p className="wo__note">Illustrative, not to scale.</p>
    </figure>
  );
}
