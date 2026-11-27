/**
 * Act 8 · ray-tracer
 * Light leaves the phosphor on the concave dome faceplate as diverging cones, passes E1
 * (the faceplate's eye-facing surface) and the four Gaze-Cone elements, and converges on
 * the pupil. Core rays (±50°, the eye's rotation cone) come from a real Snell trace, so
 * the convergence is true. Past that, the Periphery Ring carries the field out to 80°.
 * FOV slider 100°–160° per eye. ≈160° per eye is the stretch goal for one relay; both
 * eyes together give 200°+. Illustrative, not to scale.
 */
import { useId, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { useTier, ICE, WARN } from './wraparound/shared';
import { GAZE_CONE } from './wraparound/gazecone-data';
import { GazeConeDefs, GazeConeOptics, Eye, VIEW, lightPts, pts, ringRay } from './wraparound/GazeCone';
import './wraparound/wraparound.css';

const MIN = 100, MAX = 160, STRETCH = 160, CORE = 50;

export default function RayTracer(props: Partial<VfxSlotProps>) {
  const tier = useTier(props.tier ?? 'full');
  const uid = useId().replace(/:/g, '');
  const [fov, setFov] = useState(140);
  const half = fov / 2;
  const flow = tier === 'full';
  const step = tier === 'full' ? 10 : 20;
  const core = Object.entries(GAZE_CONE.fields).filter(([k]) => +k % step === 0);
  const ringFields: number[] = [];
  for (let a = 55; a <= Math.min(80, half); a += 5) ringFields.push(a, -a);

  return (
    <figure className="wo" data-tier={tier} aria-label="Ray tracer: phosphor dome through the Gaze-Cone optics into the eye">
      <p className="wo__eyebrow">Interactive · Ray tracer · Gaze-Cone optics</p>
      <svg className="wo__svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`Rays from the dome faceplate through the Gaze-Cone elements into the eye, ${fov} degrees per eye`}>
        <GazeConeDefs uid={uid} />
        <GazeConeOptics uid={uid} glow={tier === 'full'} electrons>
          {core.map(([k, rays]) => (
            <g key={k} fill="none" stroke={ICE} strokeLinejoin="round">
              {rays.map((r, i) => (
                <polyline key={i} points={lightPts(r)} strokeOpacity={i === 2 ? 0.95 : 0.4} strokeWidth={i === 2 ? 1.3 : 0.8}
                  strokeDasharray={flow && i === 2 ? '6 6' : undefined} data-flow={flow && i === 2 ? '' : undefined} />
              ))}
            </g>
          ))}
          {ringFields.map((a) => (
            <polyline key={a} points={pts(ringRay(a))} fill="none" stroke={Math.abs(a) * 2 >= STRETCH ? WARN : ICE} strokeOpacity=".75" strokeWidth="1.1"
              strokeDasharray={flow ? '6 6' : '3 4'} data-flow={flow ? '' : undefined} />
          ))}
        </GazeConeOptics>
        <Eye />
        <text x="16" y={VIEW.h - 10} fontSize="10.5" fill="#6a7fa8">Illustrative, not to scale. Core rays are traced; depth is compressed.</text>
      </svg>
      <div className="wo__controls">
        <div className="wo__range">
          <label htmlFor={`${uid}-fov`}>Field of view · per eye</label>
          <input id={`${uid}-fov`} type="range" min={MIN} max={MAX} step={10} value={fov} onChange={(e) => setFov(+e.target.value)} />
          <output htmlFor={`${uid}-fov`}>{fov}°</output>
        </div>
      </div>
      <div className="wo__readouts">
        <div className="wo__readout"><span>Gaze-Cone core</span><b>Everywhere your eye can turn</b></div>
        <div className="wo__readout"><span>Periphery Ring</span><b>{half > CORE ? 'Carries the edge of vision' : 'Off'}</b></div>
        <div className="wo__readout"><span>Per eye</span><b className={fov >= STRETCH ? 'is-warn' : undefined}>{fov}°{fov >= STRETCH ? ' · stretch goal' : ''}</b></div>
        <div className="wo__readout"><span>Both eyes together</span><b>200°+</b></div>
      </div>
      <p className="wo__note">Light leaves each phosphor point as a diverging cone, and the relay turns it into a cone converging on your eye. About {STRETCH}° per eye is the stretch goal for one relay. With both eyes the field is 200°+, so per-eye and binocular figures are stated separately.</p>
    </figure>
  );
}
