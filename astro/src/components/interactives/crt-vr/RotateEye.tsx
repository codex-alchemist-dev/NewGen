/**
 * Act 8 · rotate-eye
 * Turn the eye through its rotation cone (±50°). Gaze-Cone optics is designed around the
 * eye's centre of rotation, so wherever the pupil points, the traced bundle still converges
 * sharply. The highlighted bundle for each gaze angle is a real Snell trace.
 * Auto-sweeps in the full tier; static tier shows three gaze angles at once.
 */
import { useId, useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { useTier, useLoop, ICE, CYAN } from './wraparound/shared';
import { GAZE_CONE } from './wraparound/gazecone-data';
import { GazeConeDefs, GazeConeOptics, Eye, VIEW, lightPts, tx } from './wraparound/GazeCone';
import './wraparound/wraparound.css';

const keyFor = (g: number) => String(Math.max(-50, Math.min(50, Math.round(g / 5) * 5)));

export default function RotateEye(props: Partial<VfxSlotProps>) {
  const tier = useTier(props.tier ?? 'full');
  const uid = useId().replace(/:/g, '');
  const [gaze, setGaze] = useState(0);
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const sweeping = auto && tier === 'full';
  useLoop(ref, sweeping, (_dt, t) => setGaze(Math.round(Math.sin(t * 0.55) * 50)));

  const shown = tier === 'static' ? ['-40', '0', '40'] : [keyFor(gaze)];
  const sharp = shown.every((k) => GAZE_CONE.gazes[k]?.sharp);
  const [ex, ey] = tx([0, 0]);
  const coneR = 150;
  const arc = (a: number) => [ex + coneR * Math.sin((a * Math.PI) / 180), ey - coneR * Math.cos((a * Math.PI) / 180)];
  const [ax, ay] = arc(-50), [bx, by] = arc(50);

  return (
    <figure className="wo" data-tier={tier} ref={ref} aria-label="Rotate the eye: sharp everywhere the eye can turn">
      <p className="wo__eyebrow">Interactive · Rotate the eye</p>
      <svg className="wo__svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label="The eye rotates; the traced light bundle into the pupil stays converged at every gaze angle">
        <GazeConeDefs uid={uid} />
        {/* the eye's rotation cone */}
        <path d={`M${ex},${ey} L${ax},${ay} A${coneR},${coneR} 0 0 1 ${bx},${by} Z`} fill={CYAN} fillOpacity=".05" stroke={CYAN} strokeOpacity=".25" strokeDasharray="3 5" />
        <GazeConeOptics uid={uid} glow={tier === 'full'} labels={false}>
          {shown.map((k) => (
            <g key={k} fill="none" stroke={ICE} strokeLinejoin="round" filter={tier === 'full' ? `url(#${uid}-glow)` : undefined}>
              {GAZE_CONE.gazes[k].rays.map((r, i) => (
                <polyline key={i} points={lightPts(r)} strokeWidth={i === 2 ? 1.6 : 1} strokeOpacity={i === 2 ? 1 : 0.6} />
              ))}
            </g>
          ))}
        </GazeConeOptics>
        {tier === 'static'
          ? [-40, 0, 40].map((g) => <g key={g} opacity={g === 0 ? 1 : 0.45}><Eye gaze={g} /></g>)
          : <Eye gaze={+keyFor(gaze)} />}
        <text x="16" y={VIEW.h - 10} fontSize="10.5" fill="#6a7fa8">Illustrative, not to scale. Bundles are traced for each gaze angle.</text>
      </svg>
      <div className="wo__controls">
        <div className="wo__range">
          <label htmlFor={`${uid}-g`}>Gaze</label>
          <input id={`${uid}-g`} type="range" min={-50} max={50} step={5} value={+keyFor(gaze)} disabled={tier === 'static'}
            onChange={(e) => { setAuto(false); setGaze(+e.target.value); }} />
          <output htmlFor={`${uid}-g`}>{tier === 'static' ? '−40°, 0°, +40°' : `${keyFor(gaze)}°`}</output>
        </div>
        {tier === 'full' && (
          <button type="button" className="wo__btn" aria-pressed={auto} onClick={() => setAuto((a) => !a)}>{auto ? 'Pause sweep' : 'Auto sweep'}</button>
        )}
      </div>
      <div className="wo__readouts">
        <div className="wo__readout"><span>Focus at the pupil</span><b>{sharp ? 'Converged' : 'Softening'}</b></div>
        <div className="wo__readout"><span>Sweet spot</span><b>Follows your eye</b></div>
        <div className="wo__readout"><span>Center boost</span><b>None</b></div>
      </div>
    </figure>
  );
}
