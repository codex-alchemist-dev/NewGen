/**
 * Act 8 · exploded-relay
 * Element-by-element callouts for the relay: E1 is the dome faceplate's eye-facing surface,
 * then the Gaze-Cone XA elements with Nano AR Coating II at fixed spacing (no pancake folds,
 * so no ghosts and no sweet-spot loss), the Periphery Ring and the Kurocoat-lined barrel.
 * Element layout is illustrative.
 */
import { useId, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { useTier } from './wraparound/shared';
import { GazeConeDefs, GazeConeOptics, Eye, VIEW, tx } from './wraparound/GazeCone';
import './wraparound/wraparound.css';

const PARTS: Array<{ id: string; name: string; body: string }> = [
  { id: 'E1', name: 'E1 · Dome faceplate', body: 'The faceplate is the first lens. Its eye-facing surface is relay element 1, which saves an element and some weight. Phosphor sits on the vacuum side, with radial ribs outside the active area.' },
  { id: 'E2', name: 'E2 · XA element', body: 'Extreme-aspherical glass with Nano AR Coating II. Part of the Gaze-Cone eyepiece.' },
  { id: 'E3', name: 'E3 · XA element', body: 'Extreme-aspherical glass with Nano AR Coating II, paired with E2.' },
  { id: 'E4', name: 'E4 · XA element', body: 'Extreme-aspherical glass with Nano AR Coating II. Part of the Gaze-Cone eyepiece.' },
  { id: 'E5', name: 'E5 · XA element', body: 'The element nearest your eye. Extreme-aspherical glass with Nano AR Coating II, paired with E4.' },
  { id: 'ring', name: 'Periphery Ring', body: 'A thin ring beside the eyepiece that carries the far edge of your vision.' },
  { id: 'barrel', name: 'Kurocoat barrel', body: 'The relay barrel is lined with Kurocoat, so stray light is absorbed instead of lifting the black floor.' },
];

export default function ExplodedRelay(props: Partial<VfxSlotProps>) {
  const tier = useTier(props.tier ?? 'full');
  const uid = useId().replace(/:/g, '');
  const [explode, setExplode] = useState(tier === 'static' ? 1 : 0.6);
  const [sel, setSel] = useState<string>('E1');
  const part = PARTS.find((p) => p.id === sel)!;
  const e = explode * 10; // mm per step
  const top = Math.ceil(e * 3 * VIEW.s * VIEW.k) + 10;
  const [wl, wt] = tx([-54, 148 + e * 3]), [wr, wb] = tx([54, 6]);

  return (
    <figure className="wo" data-tier={tier} aria-label="Exploded relay with element callouts">
      <p className="wo__eyebrow">Interactive · Exploded relay</p>
      <div style={{ display: 'grid', gap: 12 }}>
        <svg className="wo__svg" viewBox={`0 ${-top} ${VIEW.w} ${VIEW.h + top}`} role="img" aria-label="Relay elements separated along the optical axis">
          <GazeConeDefs uid={uid} />
          {/* Kurocoat-lined barrel walls */}
          <g opacity={sel === 'barrel' ? 1 : 0.5}>
            <rect x={wl - 8} y={wt} width="8" height={wb - wt} fill="#05060a" stroke="#2a3860" />
            <rect x={wr} y={wt} width="8" height={wb - wt} fill="#05060a" stroke="#2a3860" />
            {sel === 'barrel' && <text x={wr + 14} y={(wt + wb) / 2} fontSize="11" fill="#9fb4d8">Kurocoat lining</text>}
          </g>
          <GazeConeOptics uid={uid} glow={tier === 'full'} labels highlight={sel === 'barrel' ? null : sel} explode={e} />
          <Eye />
          <text x="16" y={VIEW.h - 10} fontSize="10.5" fill="#6a7fa8">Illustrative element layout.</text>
        </svg>
        <div className="wo__panel" style={{ alignSelf: 'start' }}>
          <h4>Callout</h4>
          <p style={{ margin: '0 0 6px', color: 'var(--wo-ice)', fontSize: 14 }}>{part.name}</p>
          <p style={{ margin: 0, color: 'var(--wo-text)', lineHeight: 1.5 }}>{part.body}</p>
          <p className="wo__note">Fixed spacing, no pancake folds: <b>no ghosts, no sweet-spot loss.</b></p>
        </div>
      </div>
      <div className="wo__controls">
        <div className="wo__seg" role="group" aria-label="Select an element">
          {PARTS.map((p) => (
            <button key={p.id} type="button" aria-pressed={p.id === sel} onClick={() => setSel(p.id)}>{p.id === 'ring' ? 'Ring' : p.id === 'barrel' ? 'Barrel' : p.id}</button>
          ))}
        </div>
        <div className="wo__range">
          <label htmlFor={`${uid}-x`}>Explode</label>
          <input id={`${uid}-x`} type="range" min={0} max={1} step={0.01} value={explode} onChange={(ev) => setExplode(+ev.target.value)} />
        </div>
      </div>
    </figure>
  );
}
