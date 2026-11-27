/**
 * eye-roam · Act 2 · Real eye freedom.
 * Top-down: the eye at the centre of a binocular 180°+ field. Gaze-Cone optics stay
 * uniformly sharp across the ±50° cone the eye rotates through (no center boost), and the full-res core
 * follows the gaze. Toggle a conventional sweet-spot lens for contrast (qualitative).
 */
import { useEffect, useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { CORE_DEG, MID_DEG } from './lib/model';
import { useInView, useTier } from './lib/hooks';
import { Frame, Readout, Seg, Slider } from './lib/ui';

const VW = 1000, VH = 520;
const CX = 500, CY = 400, RAD = 330;
const SPAN = 95; // ±95°: a 190° arc, "180°+"
type Mode = 'crt' | 'lens';

/** Qualitative sharpness: CRT-VR flat; a sweet-spot lens falls off away from straight-ahead. */
const GAZE_CONE = 50; // ±50°: the eye's rotation cone, uniformly sharp in Gaze-Cone optics
const sharp = (mode: Mode, deg: number) => (mode === 'crt' ? (Math.abs(deg) <= GAZE_CONE ? 1 : Math.max(0.6, 1 - (Math.abs(deg) - GAZE_CONE) / 60)) : Math.max(0.12, Math.cos((deg * Math.PI) / 180 * 1.25) ** 3));
const pt = (deg: number, r = RAD) => { const t = ((deg - 90) * Math.PI) / 180; return { x: CX + r * Math.cos(t), y: CY + r * Math.sin(t) }; };
const arc = (d0: number, d1: number, r = RAD) => { const a = pt(d0, r), b = pt(d1, r); return `M${a.x},${a.y} A${r},${r} 0 ${Math.abs(d1 - d0) > 180 ? 1 : 0} 1 ${b.x},${b.y}`; };

export default function EyeRoam(_: Partial<VfxSlotProps>) {
  const [deg, setDeg] = useState(-30);
  const [mode, setMode] = useState<Mode>('crt');
  const [user, setUser] = useState(false);
  const tier = useTier();
  const [ref, inView] = useInView<HTMLDivElement>();
  const raf = useRef(0);

  // idle auto-roam (full/reduced tiers only) until the visitor takes over
  useEffect(() => {
    if (user || tier === 'static' || !inView) return;
    const t0 = performance.now();
    let last = 0;
    const step = (now: number) => {
      if (tier === 'full' || now - last > 33) {
        last = now;
        const t = Math.max(0, now - t0) / 1000;
        // hold, then move smoothly to the next look direction
        const k = Math.floor(t / 1.6), f = (t / 1.6) % 1;
        const targets = [-30, 55, -80, 15, 85, -55, 0];
        const a = targets[k % targets.length], b = targets[(k + 1) % targets.length];
        const e = f < 0.8 ? 0 : (1 - Math.cos(((f - 0.8) / 0.2) * Math.PI)) / 2;
        setDeg(Math.round(a + (b - a) * e));
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [user, tier, inView]);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === 'pointermove' && e.pointerType !== 'mouse' && e.buttons === 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * VW, y = ((e.clientY - r.top) / r.height) * VH;
    const d = (Math.atan2(y - CY, x - CX) * 180) / Math.PI + 90;
    setUser(true);
    setDeg(Math.round(Math.max(-SPAN, Math.min(SPAN, d > 180 ? d - 360 : d))));
  };

  const s = sharp(mode, deg);
  const land = pt(deg);
  const eyeR = 46;
  const pupil = pt(deg, 30);
  const glow = tier === 'full';
  // sharpness ring segments
  const segs = [];
  for (let d = -SPAN; d < SPAN; d += 2.5) segs.push(d);
  const zoneCol = mode === 'crt' ? '#00ff99' : '#b9c8ff';

  return (
    <Frame
      id="eye-roam"
      eyebrow="Interactive · Eye roam"
      title="Look anywhere. It's sharp there."
      controls={
        <>
          <Seg label="Optics" value={mode} onChange={setMode} options={[{ v: 'crt', l: 'CRT-VR' }, { v: 'lens', l: 'Sweet-spot lens' }]} />
          <Slider id="er-deg" label="Gaze" min={-SPAN} max={SPAN} value={deg} onChange={(v) => { setUser(true); setDeg(v); }} valueText={`${deg > 0 ? '+' : ''}${deg}°`} />
        </>
      }
      readout={
        <>
          <Readout big k="Binocular field of view" v="180°+" color="var(--crtvr-phosphor)" note="One continuous wraparound field, no edge of a lens to look past." />
          <Readout k="Gaze angle" v={`${deg > 0 ? '+' : ''}${deg}°`} color="var(--crtvr-white)" />
          <Readout k="Optics where you look" v={mode === 'crt' ? (s >= 1 ? 'Uniform' : 'Softening') : s > 0.8 ? 'Sharp' : s > 0.4 ? 'Softening' : 'Blurred'}
            color={mode === 'crt' ? 'var(--crtvr-phosphor)' : s > 0.8 ? 'var(--crtvr-panel-cold)' : 'var(--crtvr-rose)'}
            note={mode === 'crt' ? 'No center boost. Uniformly sharp across the ±50° gaze cone.' : 'Conventional sweet spot, drawn qualitatively for contrast.'} />
          <Readout k="Full-res core" v={mode === 'crt' ? 'Follows gaze' : 'Fixed'} color="var(--crtvr-blue)" note={`±${CORE_DEG}° core, ±${MID_DEG}° mid-zone, carried by the beam to wherever the eye lands.`} />
        </>
      }
      hint="Move around the eye, or drag the slider, to aim the gaze."
      foot={<><b>Illustrative, top-down.</b> The sweet-spot curve is qualitative, not a measured lens. CRT-VR uses Gaze-Cone optics: a curved-field eyepiece per eye, uniformly sharp across the ±50° gaze cone, with a Periphery Ring out to 160° per eye.</>}
    >
      <div ref={ref}>
        <svg className="ix-svg" viewBox={`0 0 ${VW} ${VH}`} role="img" onPointerMove={onMove} onPointerDown={onMove}
          aria-label={`Eye looking ${deg} degrees across a 180 degree plus field. Optics ${mode === 'crt' ? 'uniform' : 'sweet spot'}.`}>
          <defs>
            <radialGradient id="er-iris" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#04050a" /><stop offset=".45" stopColor="#04050a" />
              <stop offset=".5" stopColor="#00b4ff" /><stop offset="1" stopColor="#00ff99" stopOpacity=".2" />
            </radialGradient>
            <filter id="er-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="er-cone" cx={CX} cy={CY} r={RAD} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={zoneCol} stopOpacity=".0" /><stop offset="1" stopColor={zoneCol} stopOpacity=".22" />
            </radialGradient>
          </defs>
          {/* angle ticks */}
          {[-90, -60, -30, 0, 30, 60, 90].map((d) => {
            const a = pt(d, RAD + 22), b = pt(d, RAD + 10);
            const l = pt(d, RAD + 44);
            return (
              <g key={d}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2a3860" />
                <text x={l.x} y={l.y + 4} textAnchor="middle" className="er__t">{d > 0 ? '+' : ''}{d}°</text>
              </g>
            );
          })}
          {/* the field: sharpness drawn as thickness + brightness */}
          {segs.map((d) => {
            const v = sharp(mode, d + 1.25);
            return <path key={d} d={arc(d, d + 2.6)} stroke={mode === 'crt' ? '#ffe135' : '#b9c8ff'} strokeOpacity={0.15 + 0.6 * v} strokeWidth={3 + 9 * v} fill="none" />;
          })}
          {/* zones carried with the gaze */}
          {mode === 'crt' && <path d={arc(deg - MID_DEG, deg + MID_DEG, RAD - 16)} stroke="#00b4ff" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".8" />}
          {mode === 'crt' && <path d={arc(deg - CORE_DEG, deg + CORE_DEG, RAD - 16)} stroke="#00ff99" strokeWidth="10" fill="none" strokeLinecap="round" filter={glow ? 'url(#er-glow)' : undefined} />}
          {mode === 'lens' && <path d={arc(-14, 14, RAD - 16)} stroke="#b9c8ff" strokeWidth="8" fill="none" strokeLinecap="round" opacity=".7" />}
          {/* gaze cone */}
          <path d={`M${CX},${CY} L${pt(deg - CORE_DEG).x},${pt(deg - CORE_DEG).y} A${RAD},${RAD} 0 0 1 ${pt(deg + CORE_DEG).x},${pt(deg + CORE_DEG).y} Z`} fill="url(#er-cone)" />
          <line x1={CX} y1={CY} x2={land.x} y2={land.y} stroke="#f0f4ff" strokeOpacity=".55" strokeDasharray="3 5" />
          <circle cx={land.x} cy={land.y} r={9 + 4 * s} fill="none" stroke={mode === 'crt' ? '#00ff99' : s > 0.6 ? '#b9c8ff' : '#ff3c6e'} strokeWidth="1.5" filter={glow ? 'url(#er-glow)' : undefined} />
          {/* landing spot sharpness preview */}
          <g transform={`translate(${land.x} ${land.y})`}>
            <circle r="3.5" fill="#f0f4ff" style={{ filter: mode === 'lens' ? `blur(${(1 - s) * 4}px)` : undefined }} />
          </g>
          {/* eye */}
          <circle cx={CX} cy={CY} r={eyeR} fill="#080b14" stroke="#2a3860" />
          <circle cx={pupil.x} cy={pupil.y} r="15" fill="url(#er-iris)" />
          <circle cx={pupil.x} cy={pupil.y} r="6" fill="#04050a" />
          <text x={CX} y={CY + eyeR + 22} textAnchor="middle" className="er__t er__t--lab">Eye at the centre of curvature</text>
          <text x={CX} y={VH - 12} textAnchor="middle" className="er__t er__t--lab" fill="#ffe135">{mode === 'crt' ? 'Gaze-Cone · uniform sharpness across ±50°' : 'Sweet-spot lens · sharp center, soft edges'}</text>
        </svg>
      </div>
      <style>{`
        .er__t { font: 400 11px var(--crtvr-font-mono); fill: var(--crtvr-text-dim); letter-spacing: .06em; }
        .er__t--lab { font-size: 10.5px; letter-spacing: .2em; text-transform: uppercase; }
        [data-ix='eye-roam'] svg { cursor: crosshair; }
      `}</style>
    </Frame>
  );
}
