/**
 * motion-adaptive-timeline · Act 3 · Motion-Adaptive Foveated Rendering.
 * Foveation adapts to motion. Resolution matters less in fast motion, so during a
 * fast pan or head turn the ENTIRE screen, fovea included, drops to stage-3
 * foveation (the low-res, never-interlaced edge tier). Refresh jumps to 2,400+ Hz at
 * minimum aggressiveness and 3,000+ Hz at maximum (illustrative design targets, see
 * stage3Count in lib/model.ts). When motion settles, it returns to normal three-zone
 * foveation (≈227–836 Hz).
 * Numbers from the shared, illustrative model (lib/model.ts).
 */
import { useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { CELL, FH, FW, countFrame, stage3Count } from './lib/model';
import { drawField } from './lib/field';
import { useStage } from './lib/hooks';
import { Frame, Readout, Slider, fmt } from './lib/ui';

const W = 1000, H = 470;
const MS = 0.6, MX = (1000 - 720 * 0.6) / 2, MY = 14;
const FWs = FW * MS, FHs = FH * MS;
const TX0 = 20, TX1 = 980, TY0 = 290, TY1 = 440;
const T_TOTAL = 4000;                 // ms of simulated time on the timeline
const M0 = 1100, M1 = 2500;           // fast pan / head turn window
const SLOWMO = 1.6;                   // real ms per simulated ms
const GAZE = { x: FW / 2, y: FH / 2 };
/** Motion speed (0..1) above which the whole screen switches to stage 3. Illustrative. */
const STAGE3_AT = 0.3;

/** Content motion speed, 0..1: still, a fast pan that peaks mid-window, then settles. */
const speed = (t: number) => {
  if (t <= M0 || t >= M1) return 0;
  const u = (t - M0) / (M1 - M0);
  return Math.sin(Math.PI * u) ** 2;
};
type Phase = 'still' | 'moving' | 'settled';
const phaseOf = (t: number): Phase => (t < M0 ? 'still' : speed(t) > STAGE3_AT ? 'moving' : t < M1 ? (t < (M0 + M1) / 2 ? 'still' : 'settled') : 'settled');
const stage3 = (t: number) => speed(t) > STAGE3_AT;

export default function MotionAdaptiveTimeline(_: Partial<VfxSlotProps>) {
  const [fovAgg, setFovAgg] = useState(50);
  const a = fovAgg / 100;
  const still = countFrame(GAZE.x, GAZE.y, a);                 // three-zone foveation
  const peak = stage3Count(a);                                 // whole screen at stage 3 (illustrative design target)
  const hzAt = (t: number) => (stage3(t) ? peak.hz : still.hz);
  const trace = useRef<{ k: number; pts: number[] }>({ k: -1, pts: [] });
  if (trace.current.k !== fovAgg) {
    const pts: number[] = [];
    for (let m = 0; m <= T_TOTAL; m += 5) pts.push(hzAt(m));
    trace.current = { k: fovAgg, pts };
  }
  const simT = useRef(0);
  const pan = useRef(0);
  const [phase, setPhase] = useState<Phase>('still');
  const [nowHz, setNowHz] = useState(still.hz);
  const [nowStage3, setNowStage3] = useState(false);

  const yMax = 3700;
  const ty = (hz: number) => TY1 - (hz / yMax) * (TY1 - TY0 - 18);
  const tx = (t: number) => TX0 + (t / T_TOTAL) * (TX1 - TX0);

  const { canvasRef, wrapRef } = useStage(W, H, ({ ctx, dt, tier, frame }) => {
    if (tier === 'static') simT.current = T_TOTAL;
    else {
      simT.current += dt / SLOWMO;
      if (simT.current > T_TOTAL + 400) simT.current = 0;
    }
    const t = Math.min(T_TOTAL, simT.current);
    const v = speed(t);
    const s3 = stage3(t);
    const ph = phaseOf(t);

    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);

    // field view: content pans across the screen; the foveated scan adapts to its speed
    ctx.save();
    ctx.strokeStyle = '#1a2240'; ctx.strokeRect(MX - 0.5, MY - 0.5, FWs + 1, FHs + 1);
    ctx.beginPath(); ctx.rect(MX, MY, FWs, FHs); ctx.clip();
    if (tier !== 'static') pan.current = (pan.current + v * dt * 0.9) % (CELL * 12 * MS);
    // moving content: vertical bars sweeping left, streaked by speed
    for (let x = -CELL * 12 * MS + pan.current * -1; x < FWs + CELL * 12 * MS; x += CELL * 12 * MS) {
      const g = ctx.createLinearGradient(MX + x, 0, MX + x + 8 + v * 40, 0);
      g.addColorStop(0, 'rgba(204,68,255,0)'); g.addColorStop(1, `rgba(204,68,255,${0.05 + v * 0.1})`);
      ctx.fillStyle = g; ctx.fillRect(MX + x, MY, 8 + v * 40, FHs);
    }
    const fcount = Math.floor(t / (1000 / hzAt(t)));
    drawField(ctx, { gazeX: GAZE.x, gazeY: GAZE.y, agg: a, frame: fcount, tier, s: MS, ox: MX, oy: MY, rings: !s3, stage3: s3 });
    // motion arrow
    if (v > 0.05) {
      ctx.strokeStyle = `rgba(255,225,53,${0.3 + 0.6 * v})`; ctx.lineWidth = 2;
      const ax = MX + FWs - 30, ay = MY + 22, len = 30 + 80 * v;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - len, ay); ctx.lineTo(ax - len + 8, ay - 5); ctx.moveTo(ax - len, ay); ctx.lineTo(ax - len + 8, ay + 5); ctx.stroke(); ctx.lineWidth = 1;
    }
    ctx.restore();

    ctx.font = '500 10px "DM Mono", monospace'; ctx.textAlign = 'left';
    const lab = ph === 'still' ? 'STILL · THREE-ZONE FOVEATION' : ph === 'moving' ? 'FAST PAN / HEAD TURN · WHOLE SCREEN AT STAGE 3' : 'SETTLED · BACK TO THREE-ZONE FOVEATION';
    ctx.fillStyle = ph === 'moving' ? '#ffe135' : '#00ff99';
    ctx.fillText(lab, MX + 10, MY + FHs - 10);

    // timeline bands
    const band = (t0: number, t1: number, c: string, l: string) => {
      ctx.fillStyle = c; ctx.fillRect(tx(t0), TY0, tx(t1) - tx(t0), TY1 - TY0);
      ctx.fillStyle = '#6a7fa8'; ctx.textAlign = 'left'; ctx.fillText(l, tx(t0) + 6, TY0 + 14);
    };
    band(0, M0, 'rgba(0,255,153,.04)', 'STILL');
    band(M0, M1, 'rgba(255,225,53,.07)', 'FAST PAN / HEAD TURN');
    band(M1, T_TOTAL, 'rgba(0,255,153,.04)', 'SETTLED');
    ctx.strokeStyle = '#1a2240'; ctx.strokeRect(TX0, TY0, TX1 - TX0, TY1 - TY0);
    ctx.fillStyle = '#3a4a6a'; ctx.textAlign = 'center';
    for (let m = 0; m <= T_TOTAL; m += 500) { ctx.fillRect(tx(m), TY1, 1, 5); ctx.fillText(`${(m / 1000).toFixed(1)} s`, tx(m), TY1 + 18); }
    // motion speed trace
    ctx.strokeStyle = 'rgba(255,225,53,.55)'; ctx.beginPath();
    for (let m = 0; m <= T_TOTAL; m += 10) { const y = TY1 - 6 - speed(m) * 70; if (m === 0) ctx.moveTo(tx(m), y); else ctx.lineTo(tx(m), y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,225,53,.8)'; ctx.textAlign = 'right'; ctx.fillText('MOTION SPEED', TX1 - 8, TY1 - 10);
    // refresh trace, drawn up to the playhead
    const pts = trace.current.pts;
    ctx.strokeStyle = '#00ff99'; ctx.lineWidth = 2;
    if (tier === 'full') { ctx.shadowColor = '#00ff99'; ctx.shadowBlur = 10; }
    ctx.beginPath();
    for (let i = 0; i * 5 <= t; i++) { const x = tx(i * 5), y = ty(pts[i]); if (i === 0) ctx.moveTo(x, y); else { ctx.lineTo(x, ty(pts[i - 1])); ctx.lineTo(x, y); } }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
    ctx.fillStyle = '#00ff99'; ctx.textAlign = 'left';
    ctx.fillText(`${fmt(still.hz)} Hz`, tx(20), ty(still.hz) - 6);
    if (t > (M0 + M1) / 2) { ctx.textAlign = 'center'; ctx.fillText(`${fmt(peak.hz)} Hz · WHOLE SCREEN AT STAGE 3`, tx((M0 + M1) / 2), ty(peak.hz) + 16); }
    if (t > M1) { ctx.textAlign = 'left'; ctx.fillText(`${fmt(still.hz)} Hz`, tx(M1) + 6, ty(still.hz) - 6); }
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.moveTo(tx(t), TY0 - 4); ctx.lineTo(tx(t), TY1 + 2); ctx.stroke();

    if (frame % 4 === 0 || tier === 'static') { setPhase(ph); setNowHz(hzAt(t)); setNowStage3(s3); }
  }, [fovAgg]);

  return (
    <Frame
      id="motion-adaptive-timeline"
      eyebrow="Interactive · Motion-Adaptive Foveated Rendering"
      title="Fast motion, full-screen speed"
      controls={<Slider id="mat-agg" label="Foveation aggressiveness" value={fovAgg} onChange={setFovAgg} valueText={`${fovAgg}%`} />}
      readout={
        <>
          <Readout big k="Refresh right now" v={fmt(nowHz)} unit="Hz" color={phase === 'moving' ? 'var(--crtvr-yellow)' : 'var(--crtvr-phosphor)'} />
          <Readout k="Mode" v={nowStage3 ? 'Full-screen stage 3' : 'Three-zone'} color={nowStage3 ? 'var(--crtvr-yellow)' : 'var(--crtvr-text)'}
            note={nowStage3 ? 'Resolution matters less in fast motion, so the whole screen, fovea included, drops to stage 3.' : 'Fovea, interlaced mid-zone, low-res edge.'} />
          <Readout k="Peak" v={fmt(peak.hz)} unit="Hz" color="var(--crtvr-yellow)" note="Illustrative design target: whole screen at stage 3. 2,400+ Hz at minimum aggressiveness, 3,000+ Hz at maximum." />
        </>
      }
      hint="Loops automatically: still, a fast pan or head turn, then settled. With reduced motion, the whole timeline is shown at once."
      foot={<><b>Illustrative design targets.</b> Same refresh formula as the shared model (120 Hz full-field baseline × fixed-grid dots ÷ dots scanned). At rest: three-zone foveation, ≈{fmt(still.hz)} Hz at this setting. In fast motion: the whole screen at stage 3, ≈{fmt(peak.hz)} Hz. The stage-3 sampling is tuned to run from 2,400+ Hz to 3,000+ Hz across the aggressiveness range.</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} aria-label={`Motion-adaptive foveated rendering. Three-zone foveation at ${still.hz} hertz, the whole screen at stage 3 and ${peak.hz} hertz during a fast pan, then back to three-zone when motion settles.`} />
      </div>
    </Frame>
  );
}
