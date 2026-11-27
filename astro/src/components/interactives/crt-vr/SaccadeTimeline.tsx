/**
 * saccade-timeline · Act 3 · Motion-Adaptive Foveated Rendering.
 * A gaze jump. During the saccade vision is suppressed, so the scan drops to its
 * coarsest skips everywhere: frames get shorter and refresh spikes. The moment the
 * gaze lands, the beam catches up and the full-res fovea is drawn at the new spot.
 */
import { useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { FH, FW, countFrame } from './lib/model';
import { drawField } from './lib/field';
import { useStage } from './lib/hooks';
import { Frame, Readout, Slider, fmt } from './lib/ui';

const W = 1000, H = 470;
const MS = 0.6, MX = (1000 - 720 * 0.6) / 2, MY = 14;                 // field view
const FWs = FW * MS, FHs = FH * MS;
const TX0 = 20, TX1 = 980, TY0 = 290, TY1 = 440;   // timeline
const T_TOTAL = 300;                               // ms of simulated time on the timeline
const T_SAC = 120, SAC_MS = 40;                    // saccade starts at 120 ms, lasts 40 ms (provisional, approved)
const SLOWMO = 22;                                 // real ms per simulated ms
const A = { x: FW * 0.24, y: FH * 0.62 }, B = { x: FW * 0.78, y: FH * 0.32 };

const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * u));
type Phase = 'fixation' | 'saccade' | 'landed';

export default function SaccadeTimeline(_: Partial<VfxSlotProps>) {
  const [agg, setAgg] = useState(60);
  const a = agg / 100;
  const fixA = countFrame(A.x, A.y, a), fixB = countFrame(B.x, B.y, a);
  const sac = countFrame(FW / 2, FH / 2, 1, true); // coarsest skips, no fovea
  const simT = useRef(0);
  const dir = useRef(1);
  const [phase, setPhase] = useState<Phase>('fixation');
  const [nowHz, setNowHz] = useState(fixA.hz);
  const landFlash = useRef(-1e9);

  const peak = sac.hz;
  const yMax = Math.max(2600, peak * 1.08);
  const hzAt = (t: number) => (t < T_SAC ? fixA.hz : t < T_SAC + SAC_MS ? peak : fixB.hz);
  const ty = (hz: number) => TY1 - (hz / yMax) * (TY1 - TY0 - 18);
  const tx = (t: number) => TX0 + (t / T_TOTAL) * (TX1 - TX0);

  const { canvasRef, wrapRef } = useStage(W, H, ({ ctx, dt, tier, frame }) => {
    if (tier === 'static') simT.current = T_TOTAL;
    else {
      simT.current += dt / SLOWMO;
      if (simT.current > T_TOTAL + 40) { simT.current = 0; dir.current *= -1; }
    }
    const t = Math.min(T_TOTAL, simT.current);
    const from = dir.current > 0 ? A : B, to = dir.current > 0 ? B : A;
    const u = ease((t - T_SAC) / SAC_MS);
    const gx = from.x + (to.x - from.x) * u, gy = from.y + (to.y - from.y) * u;
    const ph: Phase = t < T_SAC ? 'fixation' : t < T_SAC + SAC_MS ? 'saccade' : 'landed';
    if (ph === 'landed' && landFlash.current < T_SAC) landFlash.current = t;
    if (t < T_SAC) landFlash.current = -1e9;

    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);

    // field view
    ctx.save();
    ctx.strokeStyle = '#1a2240'; ctx.strokeRect(MX - 0.5, MY - 0.5, FWs + 1, FHs + 1);
    ctx.beginPath(); ctx.rect(MX, MY, FWs, FHs); ctx.clip();
    const sacNow = ph === 'saccade';
    // each sim frame lasts 1000/hz ms; interlace phase from sim frame count
    const fcount = Math.floor((t * hzAt(t)) / 1000);
    drawField(ctx, { gazeX: gx, gazeY: gy, agg: sacNow ? 1 : a, frame: fcount, tier, s: MS, ox: MX, oy: MY, noFovea: sacNow, rings: !sacNow });
    if (sacNow) {
      // gaze in flight: streak, no fovea drawn (vision suppressed)
      ctx.strokeStyle = 'rgba(255,60,110,.8)'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(MX + from.x * MS, MY + from.y * MS); ctx.lineTo(MX + gx * MS, MY + gy * MS); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff3c6e'; ctx.beginPath(); ctx.arc(MX + gx * MS, MY + gy * MS, 4, 0, Math.PI * 2); ctx.fill();
    }
    const since = t - landFlash.current;
    if (since >= 0 && since < 30 && tier !== 'static') {
      const e = since / 30;
      ctx.strokeStyle = `rgba(0,255,153,${1 - e})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(MX + gx * MS, MY + gy * MS, 70 * MS * (0.4 + e * 1.4), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
    }
    ctx.restore();

    // phase label on the field
    ctx.font = '500 10px "DM Mono", monospace'; ctx.textAlign = 'left';
    const lab = ph === 'fixation' ? 'FIXATION · FOVEATED SCAN' : ph === 'saccade' ? 'SACCADE · VISION SUPPRESSED · COARSEST SKIPS' : 'LANDED · BEAM CAUGHT UP AT NEW GAZE';
    ctx.fillStyle = ph === 'saccade' ? '#ff3c6e' : '#00ff99';
    ctx.fillText(lab, MX + 10, MY + FHs - 10);

    // right column: big phase-coloured mini legend drawn in DOM readouts; here draw the timeline
    // phase bands
    const band = (t0: number, t1: number, c: string, l: string) => {
      ctx.fillStyle = c; ctx.fillRect(tx(t0), TY0, tx(t1) - tx(t0), TY1 - TY0);
      ctx.fillStyle = '#6a7fa8'; ctx.textAlign = 'left'; ctx.fillText(l, tx(t0) + 6, TY0 + 14);
    };
    band(0, T_SAC, 'rgba(0,255,153,.04)', 'FIXATION');
    band(T_SAC, T_SAC + SAC_MS, 'rgba(255,60,110,.10)', 'SACCADE');
    band(T_SAC + SAC_MS, T_TOTAL, 'rgba(0,255,153,.04)', 'LANDED');
    ctx.strokeStyle = '#1a2240'; ctx.strokeRect(TX0, TY0, TX1 - TX0, TY1 - TY0);
    // ms ticks
    ctx.fillStyle = '#3a4a6a'; ctx.textAlign = 'center';
    for (let m = 0; m <= T_TOTAL; m += 50) { ctx.fillRect(tx(m), TY1, 1, 5); ctx.fillText(`${m} ms`, tx(m), TY1 + 18); }
    // gaze position trace (thin)
    ctx.strokeStyle = 'rgba(240,244,255,.35)'; ctx.beginPath();
    for (let m = 0; m <= T_TOTAL; m += 1) { const uu = ease((m - T_SAC) / SAC_MS); const y = TY1 - 20 - uu * 40; if (m === 0) ctx.moveTo(tx(m), y); else ctx.lineTo(tx(m), y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(240,244,255,.5)'; ctx.textAlign = 'right'; ctx.fillText('GAZE', TX1 - 8, TY1 - 66);
    // refresh trace (step, drawn up to the playhead)
    ctx.strokeStyle = '#00ff99'; ctx.lineWidth = 2;
    if (tier === 'full') { ctx.shadowColor = '#00ff99'; ctx.shadowBlur = 10; }
    ctx.beginPath();
    let prev = hzAt(0); ctx.moveTo(tx(0), ty(prev));
    for (let m = 1; m <= t; m += 0.5) { const h = hzAt(m); if (h !== prev) { ctx.lineTo(tx(m), ty(prev)); ctx.lineTo(tx(m), ty(h)); prev = h; } }
    ctx.lineTo(tx(t), ty(prev)); ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
    // labels
    ctx.fillStyle = '#00ff99'; ctx.textAlign = 'left';
    ctx.fillText(`${fmt(fixA.hz)} Hz`, tx(4), ty(fixA.hz) - 6);
    if (t > T_SAC) { ctx.fillStyle = '#ff3c6e'; ctx.fillText(`${fmt(peak)} Hz · ILLUSTRATIVE PEAK DURING SACCADE`, tx(T_SAC) + 4, ty(peak) - 6); }
    if (t > T_SAC + SAC_MS) { ctx.fillStyle = '#00ff99'; ctx.fillText(`${fmt(fixB.hz)} Hz`, tx(T_SAC + SAC_MS) + 6, ty(fixB.hz) - 6); }
    // playhead
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.moveTo(tx(t), TY0 - 4); ctx.lineTo(tx(t), TY1 + 2); ctx.stroke();

    if (frame % 4 === 0 || tier === 'static') { setPhase(ph); setNowHz(hzAt(t)); }
  }, [agg]);

  return (
    <Frame
      id="saccade-timeline"
      eyebrow="Interactive · Saccade timeline"
      title="Refresh spikes while the eye is in flight"
      controls={<Slider id="st-agg" label="Foveation aggressiveness (fixation)" value={agg} onChange={setAgg} valueText={`${agg}%`} />}
      readout={
        <>
          <Readout big k="Refresh right now" v={fmt(nowHz)} unit="Hz" color={phase === 'saccade' ? 'var(--crtvr-rose)' : 'var(--crtvr-phosphor)'} />
          <Readout k="Scan mode" v={phase === 'fixation' ? 'Foveated' : phase === 'saccade' ? 'Coarsest skips' : 'Caught up'} color={phase === 'saccade' ? 'var(--crtvr-rose)' : 'var(--crtvr-text)'}
            note={phase === 'saccade' ? 'Vision is suppressed mid-saccade, so nothing needs the fovea.' : phase === 'landed' ? 'Full-res fovea redrawn where the gaze landed.' : 'Fovea, interlaced mid-zone, edge.'} />
          <Readout k="Saccade" v={SAC_MS} unit="ms" color="var(--crtvr-yellow)" note={`Shown ${SLOWMO}× slower than real time.`} />
          <Readout k="Peak during saccade" v={fmt(peak)} unit="Hz" color="var(--crtvr-rose)" note="Illustrative peak during saccade, from the shared model at coarsest skips." />
        </>
      }
      hint="Loops automatically: fixate, jump, land, and back. With reduced motion, the whole timeline is shown at once."
      foot={<><b>Illustrative.</b> Fixation and peak refresh come from the shared model (120 Hz full-field baseline). The peak uses the coarsest edge skips everywhere with no fovea.</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} aria-label={`Saccade timeline. Fixation ${fixA.hz} hertz, illustrative peak during saccade ${peak} hertz, then ${fixB.hz} hertz after landing.`} />
      </div>
    </Frame>
  );
}
