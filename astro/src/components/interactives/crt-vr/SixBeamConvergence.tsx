/**
 * Act 4 · "Six beams, one gun" — six-beam-convergence.
 * Animatic: one gun assembly per eye fires six converged beams (one per RGBMCY
 * primary). They cross at the grille aperture, and each beam's arrival angle
 * carries it onto its own triangular subpixel only. Same colour-selection
 * geometry the tube has used since the 1950s; Trinitron did it with one gun.
 * Emitters sit point-inverted to their wedges (a beam from below lands above).
 */
import { useState } from 'react';
import './act4.css';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { UI, NAMES, type Key } from './lib/color';
import { WEDGE_ANGLE, WEDGE_ORDER, hexPoints, wedgePoints } from './lib/HexPixel';
import { useAct4Tier, useVisible } from './lib/useTier';

const CY = 220;            // tube axis
const EM_X = 150;          // cathode plane
const AP_X = 640;          // grille aperture (crossover)
const SC_X = 700;          // faceplate
const RHO = 42;            // emitter ring radius (projected)
const rad = (d: number) => (d * Math.PI) / 180;

/** Side-view y of a key's emitter: the ring position opposite its wedge. */
const emY = (k: Key) => CY + RHO * Math.sin(rad(WEDGE_ANGLE[k] + 180)) + 0.42 * RHO * Math.cos(rad(WEDGE_ANGLE[k] + 180)); // tilted-ring projection
const emDepth = (k: Key) => Math.cos(rad(WEDGE_ANGLE[k] + 180)); // + toward viewer
/** Landing y on the faceplate: straight line through the aperture. */
const landY = (k: Key) => CY + (CY - emY(k)) * ((SC_X - AP_X) / (AP_X - EM_X)) * 6; // ×6 drawn exaggeration

export default function SixBeamConvergence(props: Partial<VfxSlotProps>) {
  const tier = useAct4Tier(props.tier, props.reducedMotion);
  const [ref, visible] = useVisible<HTMLDivElement>();
  const [solo, setSolo] = useState<Key | null>(null);
  const on = (k: Key) => !solo || solo === k;
  const anim = tier !== 'static' && visible;

  return (
    <div className="x4 sb" data-tier={tier} data-anim={anim ? '1' : '0'} ref={ref}>
      <div className="x4-head">
        <div>
          <p className="x4-eyebrow">NewGen × Sony · <b>Six beams, one gun</b> · Trinitron lineage</p>
          <h4 className="x4-title">One gun per eye. Six converged beams. <span className="x4-six">Each lands only on its own primary.</span></h4>
        </div>
        <div className="x4-toggles" role="group" aria-label="Fire beams">
          <button type="button" className="x4-chip" aria-pressed={!solo} onClick={() => setSolo(null)} style={{ ['--k' as string]: '#f0f4ff' }}>All six</button>
          {WEDGE_ORDER.map((k) => (
            <button key={k} type="button" className="x4-chip" aria-pressed={solo === k} style={{ ['--k' as string]: UI[k] }} onClick={() => setSolo(solo === k ? null : k)}>
              <span className="sw" />{k}
            </button>
          ))}
        </div>
      </div>

      <div className="sb-grid">
        <svg className="x4-svg" viewBox="0 0 760 440" role="img" aria-label={`Side view of one gun assembly firing ${solo ? `only the ${NAMES[solo]} beam` : 'all six beams'} through the grille aperture onto the hexagon pixel`}>
          <defs>
            <linearGradient id="sb-neck" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1b2444" /><stop offset=".5" stopColor="#0a0f1f" /><stop offset="1" stopColor="#1b2444" />
            </linearGradient>
            <linearGradient id="sb-funnel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0d1324" /><stop offset="1" stopColor="#141c36" />
            </linearGradient>
            <filter id="sb-glow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
          </defs>

          {/* envelope: neck → funnel → faceplate */}
          <path d={`M40 ${CY - 70} L330 ${CY - 70} L${SC_X - 20} ${CY - 200} L${SC_X} ${CY - 200} L${SC_X} ${CY + 200} L${SC_X - 20} ${CY + 200} L330 ${CY + 70} L40 ${CY + 70} Z`}
            fill="url(#sb-funnel)" stroke="var(--x4-line-b)" />
          <rect x="40" y={CY - 70} width="290" height="140" fill="url(#sb-neck)" stroke="var(--x4-line-b)" />
          <path d={`M${SC_X} ${CY - 200} Q ${SC_X + 34} ${CY} ${SC_X} ${CY + 200}`} fill="#9fb6ff" fillOpacity=".1" stroke="#9fb6ff" strokeOpacity=".5" />

          {/* gun electrodes */}
          <rect x={EM_X - 22} y={CY - 56} width="14" height="112" rx="2" fill="#2a3450" />
          {[205, 250].map((x) => <rect key={x} x={x} y={CY - 58} width="8" height="116" fill="#3a4768" />)}
          <rect x="285" y={CY - 62} width="30" height="124" rx="4" fill="none" stroke="#56658c" />
          {/* MEMS deflection plates */}
          <path d={`M350 ${CY - 96} L470 ${CY - 140} L470 ${CY - 118} L350 ${CY - 74} Z M350 ${CY + 96} L470 ${CY + 140} L470 ${CY + 118} L350 ${CY + 74} Z`} fill="#c87533" opacity=".55" />

          {/* grille / mask with the aperture */}
          <line x1={AP_X} y1={CY - 186} x2={AP_X} y2={CY - 9} stroke="#8a97b8" strokeWidth="4" />
          <line x1={AP_X} y1={CY + 9} x2={AP_X} y2={CY + 186} stroke="#8a97b8" strokeWidth="4" />

          {/* beams: emitter → aperture → own wedge */}
          {WEDGE_ORDER.map((k) => {
            const y0 = emY(k), y1 = landY(k);
            const depth = emDepth(k);
            const op = on(k) ? 0.65 + 0.35 * (depth + 1) / 2 : 0.06;
            const d = `M${EM_X} ${y0} L${AP_X} ${CY} L${SC_X - 2} ${y1}`;
            return (
              <g key={k} style={{ opacity: op, transition: 'opacity .4s' }}>
                {tier === 'full' && <path d={d} stroke={UI[k]} strokeWidth="5" fill="none" filter="url(#sb-glow)" opacity=".7" />}
                <path d={d} stroke={UI[k]} strokeWidth="1.6" fill="none" />
                <path d={d} stroke="#fff" strokeWidth="1.6" fill="none" className="sb-pulse" strokeDasharray="10 70" style={{ animationDelay: `${WEDGE_ORDER.indexOf(k) * -0.17}s` }} />
                <circle cx={EM_X} cy={y0} r="4" fill={UI[k]} />
                <circle cx={SC_X - 2} cy={y1} r="4.5" fill={UI[k]} className="sb-land" />
              </g>
            );
          })}

          <g fontFamily="var(--x4-mono)" fontSize="10.5" fill="var(--x4-dim)">
            <text x={EM_X - 26} y={CY + 92} textAnchor="middle">6-emitter cathode ring</text>
            <text x="265" y={CY - 82} textAnchor="middle">G1 / G2 · focus</text>
            <text x="410" y={CY - 152} textAnchor="middle">MEMS deflection plates</text>
            <text x={AP_X} y={CY + 206} textAnchor="middle">grille aperture: beams cross</text>
            <text x={SC_X - 6} y={CY - 210} textAnchor="end">faceplate · landing ×6 exaggerated</text>
          </g>
        </svg>

        <div className="sb-front">
          <svg className="x4-svg" viewBox="-170 -170 340 340" role="img" aria-label="Front view of the hexagon pixel showing where each beam lands">
            <polygon points={hexPoints(128)} fill="#020306" stroke="var(--x4-line-b)" />
            {WEDGE_ORDER.map((k) => (
              <polygon key={k} points={wedgePoints(k, 124, 0, 0, 7)} fill={UI[k]} opacity={on(k) ? 0.85 : 0.08} style={{ transition: 'opacity .4s' }} className={on(k) ? 'sb-wedge' : ''} />
            ))}
            {WEDGE_ORDER.map((k) => {
              const a = rad(WEDGE_ANGLE[k]); const r = 72;
              return on(k) ? (
                <g key={k}>
                  <circle cx={r * Math.cos(a)} cy={r * Math.sin(a)} r="13" fill="#fff" opacity=".35" className="sb-spot" />
                  <circle cx={r * Math.cos(a)} cy={r * Math.sin(a)} r="5" fill="#fff" />
                </g>
              ) : null;
            })}
            <g fontFamily="var(--x4-mono)" fontSize="11" textAnchor="middle">
              {WEDGE_ORDER.map((k) => { const a = rad(WEDGE_ANGLE[k]); return <text key={k} x={150 * Math.cos(a)} y={150 * Math.sin(a) + 4} fill={on(k) ? UI[k] : 'var(--x4-dimmer)'}>{k}</text>; })}
            </g>
          </svg>
          <p className="x4-note">Front view of one hexagon. A landing spot appears only on the beam’s own triangle; the Kurocoat walls keep the gaps dark.</p>
        </div>
      </div>
      <p className="x4-note">
        <em>How it selects colour:</em> all six beams converge and cross at the grille aperture. Because each arrives at its own angle, a straight line carries it onto its own subpixel and no other, so the emitter ring is a point-inverted map of the hexagon. Sony’s Trinitron did this with one gun and three in-line beams through an aperture grille; CRT-VR does it with one gun and six. Schematic, not to scale.
      </p>
      <style>{`
        .sb-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(200px, 1fr); gap: clamp(14px, 2.4vw, 28px); align-items: center; }
        @media (max-width: 760px) { .sb-grid { grid-template-columns: 1fr; } .sb-front { max-width: 320px; margin: 0 auto; } }
        .sb[data-anim='1'] .sb-pulse { animation: sb-pulse 1.1s linear infinite; }
        .sb[data-anim='0'] .sb-pulse { display: none; }
        .sb[data-anim='1'][data-tier='full'] .sb-spot { animation: sb-spot 1.1s ease-out infinite; transform-box: fill-box; transform-origin: center; }
        .sb[data-anim='1'] .sb-land { animation: sb-land 1.1s ease-out infinite; }
        @keyframes sb-pulse { from { stroke-dashoffset: 80; } to { stroke-dashoffset: 0; } }
        @keyframes sb-spot { 0% { transform: scale(.4); opacity: .6 } 100% { transform: scale(1.6); opacity: 0 } }
        @keyframes sb-land { 0%,100% { opacity: .7 } 30% { opacity: 1 } }
      `}</style>
    </div>
  );
}
