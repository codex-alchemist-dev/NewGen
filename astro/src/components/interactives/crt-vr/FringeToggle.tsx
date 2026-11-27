/**
 * Act 8 · fringe-toggle
 * Per-beam chromatic-aberration pre-warp. The relay magnifies each primary slightly
 * differently (lateral colour), so off-axis detail fringes into six coloured copies.
 * With pre-warp on, each of the six beams pre-distorts its own primary by the inverse
 * amount at the faceplate, so the six copies land on top of each other at the eye.
 * Offsets are schematic (exaggerated so the effect reads).
 */
import { useEffect, useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { PRIMARIES, useTier } from './wraparound/shared';
import './wraparound/wraparound.css';

// Lateral-colour coefficient per primary, ordered by wavelength-ish. Schematic.
const K: Record<string, number> = { B: 1, C: 0.6, G: 0, Y: -0.45, R: -0.9, M: 0.15 };
const W = 340, H = 220, CX = W / 2, CY = H / 2;
const STRENGTH = 9; // px of fringe at the field edge

/** Test pattern: crosses on a grid, brighter toward the edge where lateral colour grows. */
const TARGETS: Array<[number, number]> = [];
for (let gy = -2; gy <= 2; gy++) for (let gx = -3; gx <= 3; gx++) TARGETS.push([CX + gx * 48, CY + gy * 40]);

function Pattern({ shift, label }: { shift: (k: number) => number; label: string }) {
  return (
    <svg className="wo__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <rect width={W} height={H} fill="#020306" />
      <g style={{ isolation: 'isolate' }}>
        {PRIMARIES.map((p) => {
          const s = shift(K[p.key]);
          return (
            <g key={p.key} style={{ mixBlendMode: 'screen' }}>
              {TARGETS.map(([x, y], i) => {
                const dx = (x - CX) / (W / 2), dy = (y - CY) / (H / 2);
                const ox = dx * s, oy = dy * s;
                return (
                  <g key={i} transform={`translate(${(x + ox).toFixed(2)},${(y + oy).toFixed(2)})`} stroke={p.color} strokeWidth="2.2" strokeLinecap="round">
                    <line x1="-9" y1="0" x2="9" y2="0" />
                    <line x1="0" y1="-9" x2="0" y2="9" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default function FringeToggle(props: Partial<VfxSlotProps>) {
  const tier = useTier(props.tier ?? 'full');
  const [on, setOn] = useState(true);
  // animated 0 (off) .. 1 (on)
  const [mix, setMix] = useState(1);
  const raf = useRef(0);
  useEffect(() => {
    const target = on ? 1 : 0;
    if (tier === 'static') { setMix(target); return; }
    let cur = mix;
    const step = () => {
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.004) cur = target;
      setMix(cur);
      if (cur !== target) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, tier]);

  // At the faceplate: pre-warp is the inverse of the relay's lateral colour.
  const atFace = (k: number) => -k * STRENGTH * mix;
  // At the eye: relay adds +k; pre-warp cancels it.
  const atEye = (k: number) => k * STRENGTH * (1 - mix);

  return (
    <figure className="wo" data-tier={tier} aria-label="Per-beam chromatic-aberration pre-warp">
      <p className="wo__eyebrow">Interactive · Per-beam pre-warp</p>
      <div className="wo__controls" style={{ marginTop: 0 }}>
        <div className="wo__seg" role="group" aria-label="Pre-warp">
          <button type="button" aria-pressed={!on} onClick={() => setOn(false)}>Pre-warp off</button>
          <button type="button" aria-pressed={on} onClick={() => setOn(true)}>Pre-warp on</button>
        </div>
        <span className="wo__tag">6 beams · 6 independent warps</span>
      </div>
      <div className="wo__grid2" style={{ marginTop: 12 }}>
        <div className="wo__panel">
          <h4>Drawn on the faceplate</h4>
          <Pattern shift={atFace} label={on ? 'Faceplate: each primary pre-distorted by its own inverse warp' : 'Faceplate: all primaries drawn in register'} />
        </div>
        <div className="wo__panel">
          <h4>Seen at your eye · <b>{on ? 'fringing cancelled' : 'colour fringing'}</b></h4>
          <Pattern shift={atEye} label={on ? 'At the eye: clean white crosses edge to edge' : 'At the eye: crosses split into six coloured copies toward the edge'} />
        </div>
      </div>
      <div className="wo__readouts" aria-hidden="true">
        {PRIMARIES.map((p) => (
          <div key={p.key} className="wo__readout">
            <span style={{ color: p.color }}>{p.name}</span>
            <b>{on ? 'own warp' : 'unwarped'}</b>
          </div>
        ))}
      </div>
      <p className="wo__note">Each of the six beams steers its own primary, so the relay's colour fringing is cancelled before the light leaves the tube. Fringe sizes are exaggerated for clarity.</p>
    </figure>
  );
}
