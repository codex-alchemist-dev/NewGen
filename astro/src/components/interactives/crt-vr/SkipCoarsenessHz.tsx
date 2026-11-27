/**
 * skip-coarseness-hz · Act 3 · Vari-refresh.
 * One scan line through the gaze point. Fine steps across the fovea, coarser vector
 * jumps outside it. Below: the horizontal deflection over time (a staircase), next to
 * a plain raster's constant ramp. The live readout is the whole-screen refresh from
 * the shared model for this gaze and aggressiveness.
 */
import { useMemo, useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { CELL, COLS, FH, FW, countFrame, edgeKeep, zoneOf } from './lib/model';
import { spot } from './lib/field';
import { useEased, useStage } from './lib/hooks';
import { Frame, Readout, Slider, fmt } from './lib/ui';

const W = 1000, H = 400;
const LX0 = 40, LX1 = 960;
const SX = (LX1 - LX0) / FW;
const LINE_Y = 70;
const PT = 150, PB = 370; // plot top / bottom
const COLR = { fovea: '#00ff99', mid: '#00b4ff', edge: '#d8e4ff' } as const;
const RGB = { fovea: [0, 255, 153], mid: [0, 180, 255], edge: [216, 228, 255] } as const;

export default function SkipCoarsenessHz(_: Partial<VfxSlotProps>) {
  const [gx, setGx] = useState(50);
  const [agg, setAgg] = useState(80);
  const a = agg / 100;
  // the scan line nearest the screen centre that the edge grid samples, so all three zones show
  const k = edgeKeep(a);
  const row = Math.round(21 / k) * k;
  const gazeX = (gx / 100) * FW, gazeY = row * CELL + CELL / 2;

  const line = useMemo(() => {
    const dots: { i: number; z: 'fovea' | 'mid' | 'edge' }[] = [];
    for (let i = 0; i < COLS; i++) {
      const z = zoneOf(i, row, gazeX, gazeY, a);
      if (z !== 'skip') dots.push({ i, z });
    }
    return dots;
  }, [row, gazeX, gazeY, a]);
  const st = countFrame(gazeX, gazeY, a);

  const pos = useRef(0);
  const { canvasRef, wrapRef, tier } = useStage(W, H, ({ ctx, dt, tier, t }) => {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const n = line.length;
    const x = (i: number) => LX0 + (i * CELL + CELL / 2) * SX;

    // screen line + framebuffer ticks
    ctx.fillStyle = 'rgba(58,74,106,.6)';
    for (let i = 0; i < COLS; i++) ctx.fillRect(x(i) - 0.5, LINE_Y + 18, 1, 5);
    ctx.font = '500 10px "DM Mono", monospace'; ctx.fillStyle = '#6a7fa8'; ctx.textAlign = 'left';
    ctx.fillText(`ONE SCAN LINE · ${n} OF ${COLS} DOTS VISITED`, LX0, 22);
    ctx.textAlign = 'right';
    ctx.fillText('RASTER WOULD VISIT ALL ' + COLS, LX1, 22);

    // beam progress (slow motion: one line sweep ≈ 3 s for the raster)
    const rasterMs = 3000;
    const skipMs = rasterMs * (n / COLS);
    if (tier !== 'static') pos.current = (pos.current + dt / skipMs) % 1.25; // short blank before repeating
    const p = tier === 'static' ? 1 : Math.min(1, pos.current);
    const cur = Math.min(n - 1, Math.floor(p * n));

    // vector jumps
    ctx.lineWidth = 1;
    for (let j = 1; j < n; j++) {
      const g = line[j].i - line[j - 1].i;
      if (g <= 1) continue;
      const x0 = x(line[j - 1].i), x1 = x(line[j].i);
      const h = Math.min(34, 6 + g * 1.4);
      const done = j <= cur;
      ctx.strokeStyle = done ? 'rgba(255,225,53,.75)' : 'rgba(255,225,53,.18)';
      ctx.setLineDash(done ? [] : [3, 4]);
      ctx.beginPath(); ctx.moveTo(x0, LINE_Y); ctx.quadraticCurveTo((x0 + x1) / 2, LINE_Y - h * 2, x1, LINE_Y); ctx.stroke();
    }
    ctx.setLineDash([]);
    // dots
    ctx.save();
    if (tier === 'full') ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < n; j++) {
      const d = line[j];
      const lit = j <= cur;
      const age = (cur - j) / n;
      const e = tier === 'static' ? 1 : lit ? Math.max(0.35, 1 - age * 0.9) : 0.12;
      if (tier === 'full') {
        const sz = d.z === 'edge' ? 30 : 20;
        ctx.globalAlpha = e;
        ctx.drawImage(spot(RGB[d.z] as unknown as [number, number, number], 48), x(d.i) - sz / 2, LINE_Y - sz / 2, sz, sz);
      } else {
        ctx.fillStyle = COLR[d.z]; ctx.globalAlpha = e;
        ctx.beginPath(); ctx.arc(x(d.i), LINE_Y, d.z === 'edge' ? 4 : 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    if (tier !== 'static' && pos.current < 1) {
      const bx = x(line[cur].i);
      ctx.save(); if (tier === 'full') { ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, LINE_Y, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    // plot: deflection (x) vs time
    ctx.strokeStyle = '#1a2240'; ctx.lineWidth = 1;
    ctx.strokeRect(LX0, PT, LX1 - LX0, PB - PT);
    ctx.fillStyle = '#6a7fa8'; ctx.textAlign = 'left';
    ctx.fillText('HORIZONTAL DEFLECTION', LX0 + 8, PT + 16);
    ctx.textAlign = 'right';
    ctx.fillText('TIME →', LX1 - 8, PB - 8);
    const tx = (f: number) => LX0 + f * (LX1 - LX0);          // time axis = raster line time
    const py = (i: number) => PB - ((i + 0.5) / COLS) * (PB - PT - 30);
    // raster: constant ramp across the full line time
    ctx.strokeStyle = 'rgba(185,200,255,.5)'; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(tx(0), py(0)); ctx.lineTo(tx(1), py(COLS - 1)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(185,200,255,.7)'; ctx.textAlign = 'right';
    ctx.fillText('RASTER', tx(1) - 6, py(COLS - 1) + 14);
    // skip-scan staircase: one dwell per visited dot, jumps are vertical
    const fr = n / COLS;
    ctx.strokeStyle = '#00ff99'; ctx.lineWidth = 2;
    if (tier === 'full') { ctx.shadowColor = '#00ff99'; ctx.shadowBlur = 8; }
    ctx.beginPath();
    const shown = tier === 'static' ? n : cur + 1;
    for (let j = 0; j < shown; j++) {
      const t0 = (j / n) * fr, t1 = ((j + 1) / n) * fr;
      const y = py(line[j].i);
      if (j === 0) ctx.moveTo(tx(t0), y); else ctx.lineTo(tx(t0), y);
      ctx.lineTo(tx(t1), y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
    // end-of-frame marker
    ctx.strokeStyle = 'rgba(0,255,153,.5)'; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(tx(fr), PT); ctx.lineTo(tx(fr), PB); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#00ff99'; ctx.textAlign = 'left';
    ctx.fillText(`LINE DONE · ${Math.round(fr * 100)}% OF RASTER TIME`, Math.min(tx(fr) + 8, LX1 - 230), PT + 34);
    void t;
  }, [line]);

  const hz = useEased(st.hz, tier);
  const fine = line.filter((d) => d.z === 'fovea').length;

  return (
    <Frame
      id="skip-coarseness-hz"
      eyebrow="Interactive · Skip coarseness → refresh"
      title="Coarser skips, shorter frame, higher Hz"
      controls={
        <>
          <Slider id="sch-gaze" label="Gaze position" value={gx} onChange={setGx} valueText={`${gx}%`} />
          <Slider id="sch-agg" label="Skip coarseness" value={agg} onChange={setAgg} valueText={`${agg}%`} />
        </>
      }
      readout={
        <>
          <Readout big k="Whole-screen refresh" v={fmt(hz)} unit="Hz" color="var(--crtvr-phosphor)" note="Live, for this gaze and coarseness." />
          <Readout k="Dots on this line" v={`${line.length} / ${COLS}`} note={`${fine} fine steps in the fovea, coarse jumps elsewhere.`} />
          <Readout k="Frame time" v={st.frameMs.toFixed(2)} unit="ms" color="var(--crtvr-blue)" note="vs 8.33 ms for a full raster at 120 Hz." />
        </>
      }
      hint="Slide the gaze along the line and raise the skip coarseness. Yellow arcs are vector jumps: no dwell, nothing drawn."
      foot={<><b>Illustrative.</b> Every visited dot gets the same dwell. Jump time is drawn as zero. Refresh from the shared model (120 Hz full-field baseline).</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} aria-label={`One scan line with ${line.length} of ${COLS} dots visited. Whole-screen refresh ${st.hz} hertz.`} />
      </div>
    </Frame>
  );
}
