/**
 * motion-adaptive-timeline · Act 3 · Motion-Adaptive Foveated Rendering.
 * Foveation adapts to motion. Resolution matters less in fast motion, so during a
 * head whip the ENTIRE screen, fovea included, drops to stage-3 foveation (the
 * low-res, never-interlaced edge tier) for maximum refresh: 2,400+ Hz at minimum
 * aggressiveness, 3,000+ Hz at maximum (illustrative design targets, stage3Count in
 * lib/model.ts). As the motion slows and natural motion blur fades, the fovea snaps
 * back to full res first, then the screen returns to normal three-zone foveation.
 * It all happens within a fraction of a second, so the switch is unnoticeable.
 */
import { useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { CELL, FW, FH, countFrame, stage3Count, stage3FoveaCount } from './lib/model';
import { drawField } from './lib/field';
import { useStage } from './lib/hooks';
import { Frame, Readout, Slider, fmt } from './lib/ui';

const W = 1000, H = 470;
const MS = 0.6, MX = (1000 - 720 * 0.6) / 2, MY = 14;
const FWs = FW * MS, FHs = FH * MS;
const TX0 = 20, TX1 = 980, TY0 = 290, TY1 = 440;
const T_TOTAL = 2000;                 // ms of simulated time on the timeline
const M0 = 400;                       // whip starts
const RISE = 90, HOLD = 260, DECAY = 800; // fast attack, short hold, slowing down
const SLOWMO = 3;                     // real ms per simulated ms
const GAZE = { x: FW / 2, y: FH / 2 };
/** Illustrative motion-speed thresholds (0..1). */
const WHIP_AT = 0.55;    // above: whole screen at stage 3
const SHARP_AT = 0.12;   // between: fovea back at full res, rest still stage 3

/** Head/content motion speed, 0..1: still, a fast whip, a slowing tail, then still. */
const speed = (t: number) => {
  const u = t - M0;
  if (u <= 0) return 0;
  if (u < RISE) return Math.sin((u / RISE) * Math.PI / 2) ** 2;
  if (u < RISE + HOLD) return 1;
  const d = (u - RISE - HOLD) / DECAY;
  return d >= 1 ? 0 : (0.5 + 0.5 * Math.cos(d * Math.PI));
};
type Mode = 'three' | 'stage3' | 'sharpen';
const modeAt = (t: number): Mode => { const v = speed(t); return v > WHIP_AT ? 'stage3' : v > SHARP_AT ? 'sharpen' : 'three'; };
const MODE_LABEL: Record<Mode, string> = { three: 'Three-zone', stage3: 'Full-screen stage 3', sharpen: 'Fovea re-sharpening' };

export default function MotionAdaptiveTimeline(_: Partial<VfxSlotProps>) {
  const [fovAgg, setFovAgg] = useState(50);
  const a = fovAgg / 100;
  const three = countFrame(GAZE.x, GAZE.y, a);                 // three-zone foveation (shared model)
  const peak = stage3Count(a);                                 // whole screen at stage 3
  const sharp = stage3FoveaCount(GAZE.x, GAZE.y, a);           // fovea back, rest stage 3
  const hzOf = (m: Mode) => (m === 'stage3' ? peak.hz : m === 'sharpen' ? sharp.hz : three.hz);
  const hzAt = (t: number) => hzOf(modeAt(t));
  const trace = useRef<{ k: number; pts: number[] }>({ k: -1, pts: [] });
  if (trace.current.k !== fovAgg) {
    const pts: number[] = [];
    for (let m = 0; m <= T_TOTAL; m += 2) pts.push(hzAt(m));
    trace.current = { k: fovAgg, pts };
  }
  const simT = useRef(0);
  const pan = useRef(0);
  const [mode, setMode] = useState<Mode>('three');
  const [nowHz, setNowHz] = useState(three.hz);

  const yMax = 3800;
  const ty = (hz: number) => TY1 - (hz / yMax) * (TY1 - TY0 - 18);
  const tx = (t: number) => TX0 + (t / T_TOTAL) * (TX1 - TX0);
  // phase edges on the timeline
  const edges = (() => {
    let tW0 = 0, tW1 = 0, tS1 = 0;
    for (let m = 0; m <= T_TOTAL; m += 1) {
      const md = modeAt(m);
      if (md === 'stage3' && !tW0) tW0 = m;
      if (md === 'stage3') tW1 = m;
      if (md === 'sharpen' && m > tW1 && tW1) tS1 = m;
    }
    return { tW0, tW1, tS1 };
  })();

  const { canvasRef, wrapRef } = useStage(W, H, ({ ctx, dt, tier, frame }) => {
    if (tier === 'static') simT.current = T_TOTAL;
    else {
      simT.current += dt / SLOWMO;
      if (simT.current > T_TOTAL + 200) simT.current = 0;
    }
    const t = Math.min(T_TOTAL, simT.current);
    const v = tier === 'static' ? 0 : speed(t);
    const md = tier === 'static' ? 'three' : modeAt(t);

    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);

    // field view: the scene whips past; the scan follows the motion
    ctx.save();
    ctx.strokeStyle = '#1a2240'; ctx.strokeRect(MX - 0.5, MY - 0.5, FWs + 1, FHs + 1);
    ctx.beginPath(); ctx.rect(MX, MY, FWs, FHs); ctx.clip();
    const period = CELL * 12 * MS;
    if (tier !== 'static') pan.current = (pan.current + v * dt * 0.6) % period;
    for (let x = -period - pan.current; x < FWs + period; x += period) {
      const wdt = 8 + v * 46;
      const g = ctx.createLinearGradient(MX + x, 0, MX + x + wdt, 0);
      g.addColorStop(0, 'rgba(204,68,255,0)'); g.addColorStop(1, `rgba(204,68,255,${0.05 + v * 0.12})`);
      ctx.fillStyle = g; ctx.fillRect(MX + x, MY, wdt, FHs);
    }
    const fcount = Math.floor(t / (1000 / hzOf(md)));
    drawField(ctx, { gazeX: GAZE.x, gazeY: GAZE.y, agg: a, frame: fcount, tier, s: MS, ox: MX, oy: MY, rings: md !== 'stage3', stage3: md !== 'three', stage3Fovea: md === 'sharpen' });
    if (v > 0.05) {
      ctx.strokeStyle = `rgba(255,225,53,${0.3 + 0.6 * v})`; ctx.lineWidth = 2;
      const ax = MX + FWs - 30, ay = MY + 22, len = 30 + 90 * v;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - len, ay); ctx.lineTo(ax - len + 8, ay - 5); ctx.moveTo(ax - len, ay); ctx.lineTo(ax - len + 8, ay + 5); ctx.stroke(); ctx.lineWidth = 1;
    }
    ctx.restore();

    ctx.font = '500 10px "DM Mono", monospace'; ctx.textAlign = 'left';
    const lab = md === 'stage3' ? 'HEAD WHIP · WHOLE SCREEN AT STAGE 3 · MAXIMUM REFRESH'
      : md === 'sharpen' ? 'SLOWING · MOTION BLUR FADES · FOVEA BACK AT FULL RES'
      : t > M0 ? 'STILL · FULL DETAIL · THREE-ZONE FOVEATION' : 'STILL · THREE-ZONE FOVEATION';
    ctx.fillStyle = md === 'stage3' ? '#ffe135' : '#00ff99';
    ctx.fillText(lab, MX + 10, MY + FHs - 10);

    // timeline bands
    const band = (t0: number, t1: number, c: string, l: string, ly = 14) => {
      if (t1 <= t0) return;
      ctx.fillStyle = c; ctx.fillRect(tx(t0), TY0, tx(t1) - tx(t0), TY1 - TY0);
      ctx.fillStyle = '#6a7fa8'; ctx.textAlign = 'left'; ctx.fillText(l, tx(t0) + 6, TY0 + ly);
    };
    band(0, edges.tW0, 'rgba(0,255,153,.03)', 'STILL');
    band(edges.tW0, edges.tW1, 'rgba(255,225,53,.10)', 'WHIP');
    band(edges.tW1, edges.tS1, 'rgba(0,180,255,.08)', 'SLOWING');
    band(edges.tS1, T_TOTAL, 'rgba(0,255,153,.03)', 'STILL · FULL DETAIL');
    ctx.strokeStyle = '#1a2240'; ctx.strokeRect(TX0, TY0, TX1 - TX0, TY1 - TY0);
    ctx.fillStyle = '#3a4a6a'; ctx.textAlign = 'center';
    for (let m = 0; m <= T_TOTAL; m += 250) { ctx.fillRect(tx(m), TY1, 1, 5); ctx.fillText(`${(m / 1000).toFixed(2)} s`, tx(m), TY1 + 18); }
    // motion speed
    ctx.strokeStyle = 'rgba(255,225,53,.55)'; ctx.beginPath();
    for (let m = 0; m <= T_TOTAL; m += 4) { const y = TY1 - 6 - speed(m) * 70; if (m === 0) ctx.moveTo(tx(m), y); else ctx.lineTo(tx(m), y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,225,53,.8)'; ctx.textAlign = 'right'; ctx.fillText('MOTION SPEED', TX1 - 8, TY1 - 10);
    // refresh trace up to the playhead
    const pts = trace.current.pts;
    ctx.strokeStyle = '#00ff99'; ctx.lineWidth = 2;
    if (tier === 'full') { ctx.shadowColor = '#00ff99'; ctx.shadowBlur = 10; }
    ctx.beginPath();
    for (let i = 0; i * 2 <= t; i++) { const x = tx(i * 2), y = ty(pts[i]); if (i === 0) ctx.moveTo(x, y); else { ctx.lineTo(x, ty(pts[i - 1])); ctx.lineTo(x, y); } }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
    ctx.fillStyle = '#00ff99'; ctx.textAlign = 'left';
    ctx.fillText(`${fmt(three.hz)} Hz`, tx(8), ty(three.hz) - 6);
    if (t > edges.tW0) ctx.fillText(`${fmt(peak.hz)} Hz · WHOLE SCREEN AT STAGE 3`, tx(edges.tW0) + 4, ty(peak.hz) + 16);
    if (t > edges.tW1) ctx.fillText(`${fmt(sharp.hz)} Hz`, tx(edges.tW1) + 4, ty(sharp.hz) - 6);
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.moveTo(tx(t), TY0 - 4); ctx.lineTo(tx(t), TY1 + 2); ctx.stroke();

    if (frame % 3 === 0 || tier === 'static') { setMode(md); setNowHz(hzOf(md)); }
  }, [fovAgg]);

  const modeColor = mode === 'stage3' ? 'var(--crtvr-yellow)' : mode === 'sharpen' ? 'var(--crtvr-blue)' : 'var(--crtvr-text)';

  return (
    <Frame
      id="motion-adaptive-timeline"
      eyebrow="Interactive · Motion-Adaptive Foveated Rendering"
      title="Fast motion, full-screen speed"
      controls={<Slider id="mat-agg" label="Foveation aggressiveness" value={fovAgg} onChange={setFovAgg} valueText={`${fovAgg}%`} />}
      readout={
        <>
          <Readout big k="Refresh right now" v={fmt(nowHz)} unit="Hz" color={mode === 'stage3' ? 'var(--crtvr-yellow)' : 'var(--crtvr-phosphor)'} />
          <Readout k="Mode" v={MODE_LABEL[mode]} color={modeColor}
            note={mode === 'stage3' ? 'Resolution matters less in fast motion, so the whole screen, fovea included, drops to stage 3.'
              : mode === 'sharpen' ? 'Motion blur fades as the whip slows, so the fovea snaps back to full res first.'
              : 'Fovea, interlaced mid-zone, low-res edge.'} />
          <Readout k="Peak" v={fmt(peak.hz)} unit="Hz" color="var(--crtvr-yellow)" note="Illustrative design target: whole screen at stage 3. 2,400+ Hz at minimum aggressiveness, 3,000+ Hz at maximum." />
        </>
      }
      hint={<><b style={{ color: 'var(--crtvr-phosphor)', fontWeight: 500 }}>Unnoticeable: detail returns as fast as your eye can see it again.</b> Loops automatically: still, a head whip, slowing, still. Shown {SLOWMO}× slower than real time. With reduced motion, the whole timeline is shown at once.</>}
      foot={<><b>Illustrative design targets.</b> Same refresh formula as the shared model (120 Hz full-field baseline × fixed-grid dots ÷ dots scanned). At rest: three-zone foveation, ≈{fmt(three.hz)} Hz at this setting. Whip: the whole screen at stage 3, ≈{fmt(peak.hz)} Hz. Slowing: fovea at full res, the rest at stage 3, ≈{fmt(sharp.hz)} Hz. The stage-3 sampling is tuned to run from 2,400+ Hz to 3,000+ Hz across the aggressiveness range.</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} aria-label={`Motion-adaptive foveated rendering. Still: three-zone foveation at ${three.hz} hertz. Head whip: the whole screen at stage 3, ${peak.hz} hertz. Slowing: the fovea returns to full resolution at ${sharp.hz} hertz, then three-zone again.`} />
      </div>
    </Frame>
  );
}
