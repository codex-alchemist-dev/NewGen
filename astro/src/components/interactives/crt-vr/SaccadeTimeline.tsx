/**
 * saccade-timeline · Act 3 · Motion-Adaptive Foveated Rendering (Saccade Banking).
 * During a saccade (≈20–80 ms) vision is suppressed. The headset already sends gaze
 * to the panel, so the panel drops the foveal region to minimum refresh during the
 * jump, banks that beam time, and spends it on a burst of extra full-res refreshes
 * at the landing spot. The panel still does one whole-screen raster pass per frame;
 * the bank only changes where the beam time goes.
 *
 * Whole-screen refresh and the foveal share of beam time come from the shared model.
 * FOVEA_MIN_RATE and BURST_PASSES are provisional illustration values.
 */
import { useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { FH, FW, countFrame } from './lib/model';
import { drawField, drawRings } from './lib/field';
import { useStage } from './lib/hooks';
import { Frame, Readout, Slider, fmt } from './lib/ui';

const W = 1000, H = 470;
const MS = 0.6, MX = (1000 - 720 * 0.6) / 2, MY = 14;
const FWs = FW * MS, FHs = FH * MS;
const TX0 = 20, TX1 = 980, TY0 = 290, TY1 = 440;
const T_TOTAL = 200;            // ms of simulated time on the timeline
const T_SAC = 60;               // saccade starts here
const SLOWMO = 30;              // real ms per simulated ms
const AGG = 0.6;                // fixation foveation (shared model)
/** Provisional: during the saccade the foveal region is refreshed on 1 pass in 4. */
const FOVEA_MIN_RATE = 0.25;
/** Provisional: at landing, up to 3 extra foveal full-res refreshes per raster pass until the bank is empty. */
const BURST_PASSES = 3;
const A = { x: FW * 0.26, y: FH * 0.6 }, B = { x: FW * 0.74, y: FH * 0.36 };

const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * u));
type Phase = 'fixation' | 'saccade' | 'burst' | 'settled';

export default function SaccadeTimeline(_: Partial<VfxSlotProps>) {
  const [sacMs, setSacMs] = useState(40);
  const fix = countFrame(A.x, A.y, AGG);
  const hz = fix.hz;                                  // whole-screen raster, unchanged throughout
  const frameMs = 1000 / hz;
  const fShare = fix.fovea / fix.drawn;               // foveal share of each pass's beam time
  const foveaPassMs = fShare * frameMs;               // one full-res foveal refresh
  const bankedMs = (1 - FOVEA_MIN_RATE) * fShare * sacMs;   // beam time banked over the saccade
  const burstRefreshes = Math.floor(bankedMs / foveaPassMs);  // extra full-res refreshes at landing
  const burstMs = (burstRefreshes / BURST_PASSES) * frameMs;  // how long the burst lasts
  const T_LAND = T_SAC + sacMs, T_END = T_LAND + burstMs;

  const phaseAt = (t: number): Phase => (t < T_SAC ? 'fixation' : t < T_LAND ? 'saccade' : t < T_END ? 'burst' : 'settled');
  /** Foveal refreshes per raster pass. */
  const rateAt = (t: number) => { const p = phaseAt(t); return p === 'saccade' ? FOVEA_MIN_RATE : p === 'burst' ? 1 + BURST_PASSES : 1; };
  /** Bank level (ms of beam time). */
  const bankAt = (t: number) => {
    if (t < T_SAC) return 0;
    if (t < T_LAND) return bankedMs * ((t - T_SAC) / sacMs);
    if (t < T_END) return bankedMs * (1 - (t - T_LAND) / burstMs);
    return 0;
  };

  const simT = useRef(0);
  const dir = useRef(1);
  const [snap, setSnap] = useState({ ph: 'fixation' as Phase, bank: 0, spent: 0 });

  const rMax = 1 + BURST_PASSES;
  const tx = (t: number) => TX0 + (t / T_TOTAL) * (TX1 - TX0);
  const tyR = (r: number) => TY1 - 8 - (r / (rMax + 0.4)) * (TY1 - TY0 - 30);

  const { canvasRef, wrapRef } = useStage(W, H, ({ ctx, dt, tier, frame, t: wall }) => {
    if (tier === 'static') simT.current = T_TOTAL;
    else {
      simT.current += dt / SLOWMO;
      if (simT.current > T_TOTAL + 30) { simT.current = 0; dir.current *= -1; }
    }
    const t = Math.min(T_TOTAL, simT.current);
    const from = dir.current > 0 ? A : B, to = dir.current > 0 ? B : A;
    const u = ease((t - T_SAC) / sacMs);
    const gx = from.x + (to.x - from.x) * u, gy = from.y + (to.y - from.y) * u;
    const ph = phaseAt(t);
    const passIdx = Math.floor(t / frameMs);

    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);

    // ── field view
    ctx.save();
    ctx.strokeStyle = '#1a2240'; ctx.strokeRect(MX - 0.5, MY - 0.5, FWs + 1, FHs + 1);
    ctx.beginPath(); ctx.rect(MX, MY, FWs, FHs); ctx.clip();
    const shown = tier === 'static' ? { x: to.x, y: to.y } : { x: gx, y: gy };
    // mid-zone and edge: the normal foveated scan, every pass
    drawField(ctx, { gazeX: shown.x, gazeY: shown.y, agg: AGG, frame: passIdx, tier, s: MS, ox: MX, oy: MY, only: 'mid' });
    drawField(ctx, { gazeX: shown.x, gazeY: shown.y, agg: AGG, frame: passIdx, tier, s: MS, ox: MX, oy: MY, only: 'edge' });
    // fovea: dimmed to minimum refresh in flight, burst-bright at landing
    const foveaGain = ph === 'saccade' ? (passIdx % Math.round(1 / FOVEA_MIN_RATE) === 0 ? 0.55 : 0.12) : ph === 'burst' ? 1.6 : 1;
    drawField(ctx, { gazeX: shown.x, gazeY: shown.y, agg: AGG, frame: passIdx, tier, s: MS, ox: MX, oy: MY, only: 'fovea', gain: foveaGain });
    if (ph === 'saccade') {
      ctx.strokeStyle = 'rgba(255,225,53,.7)'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(MX + from.x * MS, MY + from.y * MS); ctx.lineTo(MX + gx * MS, MY + gy * MS); ctx.stroke(); ctx.setLineDash([]);
    }
    if (ph === 'burst' && tier !== 'static') {
      // burst passes: rings pulse with each extra refresh
      for (let k = 0; k < BURST_PASSES; k++) {
        const e = ((wall / 90 + k / BURST_PASSES) % 1);
        ctx.strokeStyle = `rgba(0,255,153,${0.7 * (1 - e)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(MX + gx * MS, MY + gy * MS, 70 * MS * (0.5 + e * 0.7), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.lineWidth = 1;
    }
    ctx.restore();
    drawRings(ctx, MX + shown.x * MS, MY + shown.y * MS, MS, tier);

    ctx.font = '500 10px "DM Mono", monospace'; ctx.textAlign = 'left';
    const lab = ph === 'fixation' ? 'FIXATION · NORMAL FOVEATED SCAN'
      : ph === 'saccade' ? 'SACCADE · FOVEA AT MINIMUM REFRESH · BANKING BEAM TIME'
      : ph === 'burst' ? 'LANDING · BURST OF FULL-RES REFRESHES AT THE NEW GAZE'
      : 'FIXATION · BACK TO NORMAL';
    ctx.fillStyle = ph === 'saccade' ? '#ffe135' : '#00ff99';
    ctx.fillText(lab, MX + 10, MY + FHs - 10);

    // ── timeline
    const band = (t0: number, t1: number, c: string, l: string) => {
      if (t1 <= t0) return;
      ctx.fillStyle = c; ctx.fillRect(tx(t0), TY0, tx(t1) - tx(t0), TY1 - TY0);
      ctx.fillStyle = '#6a7fa8'; ctx.textAlign = 'left'; ctx.fillText(l, tx(t0) + 6, TY0 + 14);
    };
    band(0, T_SAC, 'rgba(0,255,153,.03)', 'FIXATION');
    band(T_SAC, T_LAND, 'rgba(255,225,53,.10)', 'SACCADE');
    band(T_LAND, T_END, 'rgba(0,255,153,.12)', 'BURST');
    band(T_END, T_TOTAL, 'rgba(0,255,153,.03)', 'FIXATION');
    ctx.strokeStyle = '#1a2240'; ctx.strokeRect(TX0, TY0, TX1 - TX0, TY1 - TY0);
    ctx.fillStyle = '#3a4a6a'; ctx.textAlign = 'center';
    for (let m = 0; m <= T_TOTAL; m += 20) { ctx.fillRect(tx(m), TY1, 1, 5); ctx.fillText(`${m} ms`, tx(m), TY1 + 18); }

    // whole-screen raster: one pass per frame, constant
    ctx.strokeStyle = 'rgba(185,200,255,.45)'; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(tx(0), tyR(1)); ctx.lineTo(tx(T_TOTAL), tyR(1)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(185,200,255,.7)'; ctx.textAlign = 'right';
    ctx.fillText(`WHOLE-SCREEN RASTER · ONE PASS · ${fmt(hz)} Hz`, TX1 - 8, tyR(1) + 14);

    // bank level (filled area, yellow)
    const bMax = Math.max(1e-6, bankedMs);
    ctx.fillStyle = 'rgba(255,225,53,.18)'; ctx.strokeStyle = 'rgba(255,225,53,.8)';
    ctx.beginPath(); ctx.moveTo(tx(0), TY1);
    for (let m = 0; m <= t; m += 0.25) ctx.lineTo(tx(m), TY1 - (bankAt(m) / bMax) * 70);
    ctx.lineTo(tx(t), TY1); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    for (let m = 0; m <= t; m += 0.25) { const y = TY1 - (bankAt(m) / bMax) * 70; if (m === 0) ctx.moveTo(tx(m), y); else ctx.lineTo(tx(m), y); }
    ctx.stroke();
    if (t > T_SAC) { ctx.fillStyle = '#ffe135'; ctx.textAlign = 'left'; ctx.fillText('BANKED BEAM TIME', tx(T_SAC) + 6, TY1 - 76); }

    // foveal refreshes per pass (green step)
    ctx.strokeStyle = '#00ff99'; ctx.lineWidth = 2;
    if (tier === 'full') { ctx.shadowColor = '#00ff99'; ctx.shadowBlur = 10; }
    ctx.beginPath();
    let prev = rateAt(0); ctx.moveTo(tx(0), tyR(prev));
    for (let m = 0.25; m <= t; m += 0.25) { const r = rateAt(m); if (r !== prev) { ctx.lineTo(tx(m), tyR(prev)); ctx.lineTo(tx(m), tyR(r)); prev = r; } }
    ctx.lineTo(tx(t), tyR(prev)); ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1;
    ctx.fillStyle = '#00ff99'; ctx.textAlign = 'left';
    ctx.fillText('FOVEAL REFRESHES PER PASS', tx(2), tyR(1) - 8);
    if (t > T_LAND) ctx.fillText(`×${1 + BURST_PASSES} · BURST`, tx(T_LAND) + 4, tyR(1 + BURST_PASSES) - 8);
    if (t > T_SAC) { ctx.fillStyle = '#ffe135'; ctx.fillText(`×${FOVEA_MIN_RATE}`, tx(T_SAC) + 4, tyR(FOVEA_MIN_RATE) - 6); }

    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.moveTo(tx(t), TY0 - 4); ctx.lineTo(tx(t), TY1 + 2); ctx.stroke();

    if (frame % 4 === 0 || tier === 'static') {
      const spent = ph === 'burst' ? Math.round(burstRefreshes * ((t - T_LAND) / burstMs)) : ph === 'settled' ? burstRefreshes : 0;
      setSnap({ ph, bank: bankAt(t), spent });
    }
  }, [sacMs]);

  const foveaHzNow = Math.round(hz * rateAt(snap.ph === 'fixation' ? 0 : snap.ph === 'saccade' ? T_SAC : snap.ph === 'burst' ? T_LAND : T_TOTAL));
  const phColor = snap.ph === 'saccade' ? 'var(--crtvr-yellow)' : 'var(--crtvr-phosphor)';

  return (
    <Frame
      id="saccade-timeline"
      eyebrow="Interactive · Motion-Adaptive Foveated Rendering"
      title="Bank the beam during the jump. Spend it on landing."
      controls={<Slider id="st-sac" label="Saccade length" min={20} max={80} value={sacMs} onChange={setSacMs} valueText={`${sacMs} ms`} />}
      readout={
        <>
          <Readout big k="Refresh now · fovea" v={fmt(foveaHzNow)} unit="Hz" color={phColor}
            note={<>Whole screen stays at {fmt(hz)} Hz, one raster pass per frame.</>} />
          <Readout k="Banked beam time" v={snap.bank.toFixed(1)} unit="ms" color="var(--crtvr-yellow)"
            note={<>{bankedMs.toFixed(1)} ms banked over a {sacMs} ms saccade.</>} />
          <Readout k="Burst at landing" v={`+${snap.ph === 'burst' || snap.ph === 'settled' ? snap.spent : burstRefreshes}`} unit="full-res refreshes" color="var(--crtvr-phosphor)"
            note={<>Spent at the new gaze point over {burstMs.toFixed(1)} ms, so the landing spot is sharp immediately.</>} />
        </>
      }
      hint="Loops automatically: fixate, jump, land, and back. The headset sends gaze to the panel. With reduced motion, the whole timeline is shown at once."
      foot={<><b>Illustrative.</b> Whole-screen refresh and the fovea's share of each pass ({Math.round(fShare * 100)}%) come from the shared model. During the saccade the fovea is refreshed on 1 pass in 4. At landing, up to {BURST_PASSES} extra foveal refreshes per pass until the bank is empty. These two rates are provisional.</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} aria-label={`Saccade banking. ${bankedMs.toFixed(1)} milliseconds of beam time banked during a ${sacMs} millisecond saccade, spent as ${burstRefreshes} extra full-resolution refreshes at the landing point. Whole screen stays at ${hz} hertz.`} />
      </div>
    </Frame>
  );
}
