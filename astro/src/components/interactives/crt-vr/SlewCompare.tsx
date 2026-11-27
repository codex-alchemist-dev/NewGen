/**
 * slew-compare · Act 3 · Traveling-Wave Deflection.
 * Conventional (lumped) plates: one voltage along the whole plate. When it changes
 * while an electron is between the plates, that electron sees a mix of old and new
 * field, so the landing spot ramps over the transit time (transit-time limited,
 * hundreds-of-MHz class). Traveling-wave: the plate is segmented and fed down a
 * delay line, so the field travels with the electrons. Each electron sees one clean
 * field the whole way through, and the spot steps sharply (GHz-class slew).
 * Qualitative only; no figures beyond the class labels.
 */
import { useRef } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { useStage } from './lib/hooks';
import { Frame, Readout } from './lib/ui';

const W = 1000, H = 460;
const LANE_H = 200;
const GUN_X = 40, P0 = 170, P1 = 560, SCR = 700;  // plates from P0 to P1, screen at SCR
const SEG = 8;
const VE = 0.32;               // electron speed, px per ms (slow motion)
const STEP_MS = 1400;          // drive toggles every STEP_MS
const EMIT_MS = 26;
const DEFL = 0.000055;         // deflection gain (px/ms²), ≈ ±70 px at the screen
const PLOT_X0 = 740, PLOT_X1 = 980;

interface E { x: number; y: number; vy: number; born: number; v0: number }
interface Lane { es: E[]; hist: { t: number; y: number }[]; last: number }

/** Drive voltage: a square wave between -1 and +1 with a fast edge. */
const drive = (t: number) => (Math.floor(t / STEP_MS) % 2 === 0 ? -1 : 1);

export default function SlewCompare(_: Partial<VfxSlotProps>) {
  const lanes = useRef<Lane[]>([{ es: [], hist: [], last: 0 }, { es: [], hist: [], last: 0 }]);
  const clock = useRef(0);

  const { canvasRef, wrapRef } = useStage(W, H, ({ ctx, dt, tier }) => {
    const still = tier === 'static';
    // static: a composed still just after an edge
    if (still) { clock.current = 0; lanes.current.forEach((l) => { l.es = []; l.hist = []; l.last = 0; }); }
    const steps = still ? Math.ceil((STEP_MS * 4 + 380) / 8) : 1;
    for (let s = 0; s < steps; s++) simulate(still ? 8 : dt);

    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    for (let li = 0; li < 2; li++) drawLane(ctx, li, tier);

    function simulate(d: number) {
      clock.current += d;
      const t = clock.current;
      lanes.current.forEach((L, li) => {
        const tw = li === 1;
        // emit
        while (t - L.last > EMIT_MS) { L.last += EMIT_MS; L.es.push({ x: GUN_X + 40, y: 0, vy: 0, born: L.last, v0: drive(L.last + (P0 - GUN_X - 40) / VE) }); }
        for (const e of L.es) {
          e.x += VE * d;
          if (e.x > P0 && e.x < P1) {
            // field seen by this electron
            // lumped: the plate's present voltage. traveling-wave: the voltage that entered with it (delay matched to electron speed)
            const segIdx = Math.floor(((e.x - P0) / (P1 - P0)) * SEG);
            const v = tw ? drive(t - (segIdx * (P1 - P0) / SEG) / VE) : drive(t);
            // smooth the lumped plate a little (RC of one big plate)
            e.vy += v * DEFL * d;
          }
          e.y += e.vy * d;
        }
        // record landing positions
        L.es = L.es.filter((e) => {
          if (e.x >= SCR) { L.hist.push({ t, y: e.y }); return false; }
          return true;
        });
        L.hist = L.hist.filter((h) => t - h.t < STEP_MS * 2.2);
      });
    }

    function drawLane(c: CanvasRenderingContext2D, li: number, tier: string) {
      const L = lanes.current[li], tw = li === 1;
      const cy = 30 + li * (LANE_H + 30) + LANE_H / 2;
      const t = clock.current;
      const col = tw ? '#00ff99' : '#b9c8ff';
      c.font = '500 10.5px "DM Mono", monospace'; c.textAlign = 'left';
      c.fillStyle = col;
      c.fillText(tw ? 'TRAVELING-WAVE · SEGMENTED PLATES · GHz-CLASS SLEW' : 'CONVENTIONAL · LUMPED PLATES · TRANSIT-TIME LIMITED (HUNDREDS OF MHz CLASS)', GUN_X, cy - LANE_H / 2 + 4);
      // gun
      c.fillStyle = '#1a2240'; c.fillRect(GUN_X, cy - 12, 40, 24);
      c.fillStyle = '#6a7fa8'; c.fillRect(GUN_X + 36, cy - 4, 6, 8);
      // plates
      const plateGap = 46;
      for (let k = 0; k < (tw ? SEG : 1); k++) {
        const x0 = P0 + (k * (P1 - P0)) / (tw ? SEG : 1), x1 = P0 + ((k + 1) * (P1 - P0)) / (tw ? SEG : 1) - (tw ? 4 : 0);
        const v = tw ? drive(t - (k * (P1 - P0) / SEG) / VE) : drive(t);
        const top = v > 0 ? '#ff3c6e' : '#00b4ff', bot = v > 0 ? '#00b4ff' : '#ff3c6e';
        c.globalAlpha = 0.85;
        c.fillStyle = top; c.fillRect(x0, cy - plateGap - 6, x1 - x0, 5);
        c.fillStyle = bot; c.fillRect(x0, cy + plateGap + 1, x1 - x0, 5);
        c.globalAlpha = 0.06; c.fillStyle = v > 0 ? '#ff3c6e' : '#00b4ff'; c.fillRect(x0, cy - plateGap, x1 - x0, plateGap * 2);
        c.globalAlpha = 1;
      }
      if (tw) {
        // delay line feeding the segments
        c.strokeStyle = 'rgba(255,225,53,.5)'; c.setLineDash([2, 3]);
        c.beginPath(); c.moveTo(P0 - 20, cy - plateGap - 22); c.lineTo(P1, cy - plateGap - 22); c.stroke(); c.setLineDash([]);
        for (let k = 0; k < SEG; k++) { const x = P0 + (k + 0.5) * (P1 - P0) / SEG; c.strokeStyle = 'rgba(255,225,53,.35)'; c.beginPath(); c.moveTo(x, cy - plateGap - 22); c.lineTo(x, cy - plateGap - 6); c.stroke(); }
        c.fillStyle = 'rgba(255,225,53,.8)'; c.fillText('DELAY LINE → FIELD TRAVELS WITH THE BEAM', P0, cy - plateGap - 28);
      }
      // screen
      c.fillStyle = '#2a3860'; c.fillRect(SCR, cy - LANE_H / 2 + 14, 3, LANE_H - 18);
      // electrons
      c.save();
      if (tier === 'full') c.globalCompositeOperation = 'lighter';
      for (const e of L.es) {
        c.fillStyle = col; c.globalAlpha = 0.9;
        c.beginPath(); c.arc(e.x, cy + e.y, tier === 'full' ? 2.2 : 1.8, 0, Math.PI * 2); c.fill();
      }
      c.restore();
      // landing trace on the screen (recent)
      const recent = L.hist.filter((h) => t - h.t < 180);
      if (recent.length) {
        const h = recent[recent.length - 1];
        c.save(); if (tier === 'full') { c.shadowColor = col; c.shadowBlur = 14; }
        c.fillStyle = '#fff'; c.beginPath(); c.arc(SCR + 1.5, cy + h.y, 3.5, 0, Math.PI * 2); c.fill(); c.restore();
      }
      // landing position vs time plot
      c.strokeStyle = '#1a2240'; c.strokeRect(PLOT_X0, cy - LANE_H / 2 + 14, PLOT_X1 - PLOT_X0, LANE_H - 18);
      c.fillStyle = '#3a4a6a'; c.fillText('SPOT POSITION', PLOT_X0 + 6, cy - LANE_H / 2 + 28);
      c.textAlign = 'right'; c.fillText('TIME →', PLOT_X1 - 6, cy + LANE_H / 2 - 10); c.textAlign = 'left';
      c.strokeStyle = col; c.lineWidth = 2;
      if (tier === 'full') { c.shadowColor = col; c.shadowBlur = 8; }
      c.beginPath();
      const span = STEP_MS * 2;
      L.hist.forEach((h, i) => {
        const x = PLOT_X1 - ((t - h.t) / span) * (PLOT_X1 - PLOT_X0);
        if (x < PLOT_X0) return;
        const y = cy + Math.max(-LANE_H / 2 + 20, Math.min(LANE_H / 2 - 8, h.y));
        if (i === 0 || x - 0 < PLOT_X0 + 1) c.moveTo(x, y); else c.lineTo(x, y);
      });
      c.stroke(); c.shadowBlur = 0; c.lineWidth = 1;
    }
  }, []);

  return (
    <Frame
      id="slew-compare"
      eyebrow="Interactive · Deflection slew"
      title="Lumped plates vs a field that travels with the beam"
      readout={
        <>
          <Readout k="Conventional" v="Ramps" unit="over transit time" color="var(--crtvr-panel-cold)" note="Electrons already between the plates see the old and new field mixed, so the spot smears from one position to the next." />
          <Readout big k="Traveling-wave" v="Steps" color="var(--crtvr-phosphor)" note="Each segment switches as the electrons reach it. Every electron sees one clean field, so the spot jumps cleanly: GHz-class slew." />
          <Readout k="What it buys" v="Faster jumps" color="var(--crtvr-yellow)" note="Clean, fast vector jumps are what Skip-Scan spends between the dots it keeps." />
        </>
      }
      hint="Same square-wave drive on both. Watch the electrons in flight and the spot trace on the right. Slow motion."
      foot={<><b>Qualitative.</b> Not to scale. Speeds and gains are chosen so the difference is visible. Class labels only: lumped plates are limited by electron transit time, traveling-wave plates reach GHz-class slew.</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} aria-label="Conventional lumped deflection plates ramp the beam over the transit time; traveling-wave segmented plates step it cleanly." />
      </div>
    </Frame>
  );
}
