/**
 * gaze-scan-density · Act 2 · Hardware foveation.
 * Upgrade of the live page's "Gaze-Following Scan Density" demo. Same math (lib/model.ts),
 * same zones, same interlace rule. Drag or hover to move the gaze; the slider sets
 * foveation aggressiveness; presets jump to the three headline cases.
 */
import { useEffect, useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { FW, FH, FIXED_POINTS, PRESETS, countFrame, foveaVisibleFraction, type FrameCount } from './lib/model';
import { drawField, fadeBg } from './lib/field';
import { pointerToLogical, useEased, useStage, useTier } from './lib/hooks';
import { Frame, Legend, Readout, Seg, Slider, fmt } from './lib/ui';

type PresetKey = keyof typeof PRESETS | 'custom';

export default function GazeScanDensity(_: Partial<VfxSlotProps>) {
  const [agg, setAgg] = useState(60);
  const [preset, setPreset] = useState<PresetKey>('custom');
  const gaze = useRef({ x: FW / 2, y: FH / 2, tx: FW / 2, ty: FH / 2 });
  const [stats, setStats] = useState<FrameCount>(() => countFrame(FW / 2, FH / 2, 0.6));
  const [vis, setVis] = useState(1);
  const sweep = useRef(0);
  const [tick, setTick] = useState(0);
  const liveTier = useTier();
  const aggRef = useRef(agg / 100);
  aggRef.current = agg / 100;

  const { canvasRef, wrapRef, tier } = useStage(FW, FH, ({ ctx, w, h, frame, dt, tier }) => {
    const g = gaze.current;
    if (tier === 'static') { g.x = g.tx; g.y = g.ty; }
    else { g.x += (g.tx - g.x) * 0.18; g.y += (g.ty - g.y) * 0.18; }
    const a = aggRef.current;
    fadeBg(ctx, w, h, tier, tier === 'full' ? 0.5 : 1);
    drawField(ctx, { gazeX: g.x, gazeY: g.y, agg: a, frame, tier, rings: true });

    // the single whole-screen raster pass (shown in slow motion)
    if (tier !== 'static') {
      sweep.current = (sweep.current + dt * 0.25) % h;
      const y = sweep.current;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createLinearGradient(0, y - 18, 0, y + 1);
      grad.addColorStop(0, 'rgba(0,255,153,0)');
      grad.addColorStop(1, 'rgba(0,255,153,.06)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 18, w, 19);
      ctx.fillStyle = 'rgba(200,255,230,.22)';
      ctx.fillRect(0, y, w, 1);
      ctx.restore();
    }
    if (frame % 6 === 0 || tier === 'static') {
      setStats(countFrame(g.x, g.y, a));
      setVis(foveaVisibleFraction(g.x, g.y));
    }
  }, [agg, liveTier === 'static' ? tick : 0]);

  // static tier: re-render readouts on input changes
  useEffect(() => { setStats(countFrame(gaze.current.tx, gaze.current.ty, agg / 100)); }, [agg]);

  const setGaze = (x: number, y: number) => {
    gaze.current.tx = Math.max(0, Math.min(FW, x));
    gaze.current.ty = Math.max(0, Math.min(FH, y));
    setPreset('custom');
    setTick((t) => t + 1);
  };
  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'mouse' && e.buttons === 0) return;
    const p = pointerToLogical(e, e.currentTarget, FW, FH);
    setGaze(p.x, p.y);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.shiftKey ? 60 : 20;
    const k: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
    if (!k[e.key]) return;
    e.preventDefault();
    setGaze(gaze.current.tx + k[e.key][0], gaze.current.ty + k[e.key][1]);
  };
  const applyPreset = (p: PresetKey) => {
    if (p === 'custom') return;
    const v = PRESETS[p];
    setAgg(v.agg * 100);
    gaze.current.tx = v.x; gaze.current.ty = v.y;
    setPreset(p);
    setTick((t) => t + 1);
  };

  const hz = useEased(stats.hz, tier);
  const visLabel = vis > 0.97 ? 'Whole' : vis > 0.45 ? '≈ 1/2' : vis > 0.2 ? '≈ 1/4' : fmt(vis * 100) + '%';

  return (
    <Frame
      id="gaze-scan-density"
      eyebrow="Interactive · Gaze-following scan density"
      title="The beam goes where you look"
      controls={
        <>
          <Seg label="Preset" value={preset} onChange={applyPreset} options={[
            { v: 'mild', l: 'Mild' }, { v: 'aggressive', l: 'Aggressive' }, { v: 'corner', l: 'Corner' }, { v: 'custom', l: 'Free' },
          ]} />
          <Slider id="gsd-agg" label="Foveation aggressiveness" value={agg} onChange={(v) => { setAgg(v); setPreset('custom'); }} valueText={`${agg}%`} />
        </>
      }
      readout={
        <>
          <Readout big k="Whole-screen refresh" v={fmt(hz)} unit="Hz" color="var(--crtvr-phosphor)"
            note="One raster pass over the whole screen. Fewer dots to visit, shorter frame, higher refresh." />
          <Readout k="Dots scanned this frame" v={fmt(stats.drawn)} note={<>of {fmt(FIXED_POINTS)}. A grid panel must refresh all of them, every frame.</>} />
          <Readout k="Beam time reclaimed" v={`${Math.round(stats.saved * 100)}%`} color="var(--crtvr-blue)" />
          <Readout k="Fovea on screen" v={visLabel} color="var(--crtvr-yellow)" note="Look into a corner and the fovea is clipped to about 1/4, so the frame is shorter still." />
        </>
      }
      hint={<>Move or drag across the screen: the cursor is your gaze. Arrow keys work too.</>}
      foot={<><b>Illustrative.</b> Refresh = 120 Hz full-field baseline × (fixed-grid dots ÷ dots scanned). Same model as the original page demo. TRL 2–3, not a measured spec.</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label={`Foveated scan field. Gaze-following. Whole-screen refresh ${stats.hz} hertz, ${stats.drawn} of ${FIXED_POINTS} dots scanned.`}
          onPointerMove={onPointer}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); const p = pointerToLogical(e, e.currentTarget, FW, FH); setGaze(p.x, p.y); }}
          onKeyDown={onKey}
        />
      </div>
      <Legend items={[
        { c: '#00ff99', l: 'Fovea · full res, progressive' },
        { c: '#00b4ff', l: 'Mid-zone · reduced, interlaced' },
        { c: '#d8e4ff', l: 'Edge · low res, never interlaced' },
      ]} />
    </Frame>
  );
}
