/**
 * motion-adaptive-timeline · Act 3 · Motion-Adaptive Foveated Rendering.
 * Refresh and foveation adapt to how fast the content (or the head) is moving.
 * Still content → mild foveation, ≈227 Hz. A fast pan or head turn → the skip-scan
 * coarsens outside the foveal region and refresh climbs toward the model's
 * max-aggressiveness figure (≈836 Hz). When motion settles, refresh relaxes and
 * detail fills back in. The full-res foveal region is never coarsened here.
 * Numbers from the shared, illustrative model (lib/model.ts).
 */
import { useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { CELL, FH, FW, countFrame } from './lib/model';
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

/** Content motion speed, 0..1: still, a fast pan that peaks mid-window, then settles. */
const speed = (t: number) => {
  if (t <= M0 || t >= M1) return 0;
  const u = (t - M0) / (M1 - M0);
  return Math.sin(Math.PI * u) ** 2;
};
type Phase = 'still' | 'moving' | 'settled';
const phaseOf = (t: number): Phase => (t < M0 ? 'still' : t < M1 ? 'moving' : 'settled');

export default function MotionAdaptiveTimeline(_: Partial<VfxSlotProps>) {
  const [intensity, setIntensity] = useState(100);
  const peakAgg = intensity / 100;
  /** Skip coarseness outside the fovea follows motion speed (rounded the same way the model rounds). */
  const aggAt = (t: number) => speed(t) * peakAgg;
  const still = countFrame(GAZE.x, GAZE.y, 0);
  const peak = countFrame(GAZE.x, GAZE.y, peakAgg);
  const hzAt = (t: number) => countFrame(GAZE.x, GAZE.y, aggAt(t)).hz;
  // precompute the refresh trace once per intensity
  const trace = useRef<{ k: number; pts: number[] }>({ k: -1, pts: [] });
  if (trace.current.k !== intensity) {
    const pts: number[] = [];
    for (let m = 0; m <= T_TOTAL; m += 10) pts.push(hzAt(m));
    trace.current = { k: intensity, pts };
  }
  const simT = useRef(0);
  const pan = useRef(0);
  const [phase, setPhase] = useState<Phase>('still');
  const [nowHz, setNowHz] = useState(still.hz);
  const [nowAgg, setNowAgg] = useState(0);

  const yMax = 1000;
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
    const ag = aggAt(t);
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
    drawField(ctx, { gazeX: GAZE.x, gazeY: GAZE.y, agg: ag, frame: fcount, tier, s: MS, ox: MX, oy: MY, rings: true });
    // motion arrow
    if (v > 0.05) {
      ctx.strokeStyle = `rgba(255,225,53,${0.3 + 0.6 * v})`; ctx.lineWidth = 2;
      const ax = MX + FWs - 30, ay = MY + 22, len = 30 + 80 * v;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - len, ay); ctx.lineTo(ax - len + 8, ay - 5); ctx.moveTo(ax - len, ay); ctx.lineTo(ax - len + 8, ay + 5); ctx.stroke(); ctx.lineWidth = 1;
    }
    ctx.restore();

    ctx.font = '500 10px "DM Mono", monospace'; ctx.textAlign = 'left';
    const lab = ph === 'still' ? 'STILL CONTENT · MILD FOVEATION · FULL DETAIL' : ph === 'moving' ? 'FAST PAN / HEAD TURN · COARSER SKIPS OUTSIDE THE FOVEA' : 'SETTLED · REFRESH RELAXES · DETAIL FILLS BACK IN';
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
    for (let m = 0; m <= T_TOTAL; m += 10) { const y = TY1 - 6 - speed(m) * peakAgg * 70; if (m === 0) ctx.moveTo(tx(m), y); else ctx.lineTo(tx(m), y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,225,53,.8)'; ctx.textAlign = 'right'; ctx.fillText('MOTION SPEED', TX1 - 8, TY1 - 10);
    // refresh trace, drawn up to the playhead
    const pts = trace.current.pts;
    ctx.strokeStyle = '#00ff99'; ctx.lineWidth = 2;
    if (tier === 'full') { ctx.shadowColor = '#00ff99'; ctx.shadowBlur = 10; }
    ctx.beginPath();
    for (let i = 0; i * 10 <= t; i++) { const x = tx(i * 10), y = ty(pts[i]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
    ctx.fillStyle = '#00ff99'; ctx.textAlign = 'left';
    ctx.fillText(`${fmt(still.hz)} Hz`, tx(20), ty(still.hz) - 6);
    if (t > (M0 + M1) / 2) { ctx.textAlign = 'center'; ctx.fillText(`${fmt(peak.hz)} Hz · PEAK DURING MOTION`, tx((M0 + M1) / 2), ty(peak.hz) - 8); }
    if (t > M1) { ctx.textAlign = 'left'; ctx.fillText(`${fmt(still.hz)} Hz`, tx(M1) + 6, ty(still.hz) - 6); }
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.moveTo(tx(t), TY0 - 4); ctx.lineTo(tx(t), TY1 + 2); ctx.stroke();

    if (frame % 4 === 0 || tier === 'static') { setPhase(ph); setNowHz(hzAt(t)); setNowAgg(ag); }
  }, [intensity]);

  return (
    <Frame
      id="motion-adaptive-timeline"
      eyebrow="Interactive · Motion-adaptive timeline"
      title="Refresh climbs with motion"
      controls={<Slider id="mat-int" label="Motion intensity" value={intensity} onChange={setIntensity} valueText={`${intensity}%`} />}
      readout={
        <>
          <Readout big k="Refresh right now" v={fmt(nowHz)} unit="Hz" color={phase === 'moving' ? 'var(--crtvr-yellow)' : 'var(--crtvr-phosphor)'} />
          <Readout k="Content" v={phase === 'still' ? 'Still' : phase === 'moving' ? 'Fast pan' : 'Settled'} color={phase === 'moving' ? 'var(--crtvr-yellow)' : 'var(--crtvr-text)'}
            note={phase === 'moving' ? 'Skips coarsen outside the fovea as motion speeds up.' : phase === 'settled' ? 'Refresh relaxes and detail fills back in.' : 'Mild foveation, full detail.'} />
          <Readout k="Skip coarseness" v={`${Math.round(nowAgg * 100)}%`} color="var(--crtvr-blue)" note="Outside the foveal region only. The fovea stays at full resolution." />
          <Readout k="Peak during motion" v={fmt(peak.hz)} unit="Hz" color="var(--crtvr-yellow)" note="Illustrative, from the shared model at this motion intensity." />
        </>
      }
      hint="Loops automatically: still, a fast pan or head turn, then settled. With reduced motion, the whole timeline is shown at once."
      foot={<><b>Illustrative.</b> Refresh comes from the shared model (120 Hz full-field baseline). Skip coarseness outside the fovea follows content motion speed, from mild (≈{fmt(still.hz)} Hz) to maximum (≈{fmt(countFrame(GAZE.x, GAZE.y, 1).hz)} Hz).</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} aria-label={`Motion-adaptive timeline. Still content ${still.hz} hertz, peak during a fast pan ${peak.hz} hertz, then back to ${still.hz} hertz when motion settles.`} />
      </div>
    </Frame>
  );
}
