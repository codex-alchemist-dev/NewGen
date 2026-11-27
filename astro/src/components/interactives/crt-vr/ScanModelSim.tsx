/**
 * scan-model-sim · Act 2 · Skip-Scan.
 * Raster vs Skip-Scan, side by side, in slow motion. Both are ONE raster scan-line
 * pass over a normal framebuffer, left to right, top to bottom, same dwell per dot.
 * Raster visits every dot (and wastes dwell on dots foveation does not need).
 * Skip-Scan makes a vector jump over the skipped dots, so its frame ends sooner.
 * No dwelling on skipped dots, no vector rendering.
 */
import { useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { BASELINE_HZ, CELL, COLS, FH, FIXED_POINTS, FW, ROWS, ZONE_RGB, countFrame, midLit, zoneOf, type Zone } from './lib/model';
import { spot } from './lib/field';
import { pointerToLogical, useStage } from './lib/hooks';
import { Frame, Legend, Readout, Slider, fmt } from './lib/ui';

const S = 0.66;
const W = Math.round(FW * S), H = Math.round(FH * S);
/** Slow motion: a raster frame takes this long on screen. */
const RASTER_FRAME_MS = 5200;
const DOTS_PER_MS = FIXED_POINTS / RASTER_FRAME_MS;
const TAU = 900; // visual phosphor decay

interface Lane {
  seq: number[];      // dot indices visited this frame
  zones: (Zone | 'blank')[]; // zone per visited dot ('blank' = interlaced off-phase: dwell, beam blanked)
  pos: number;        // fractional index into seq
  frames: number;
  lastLit: Float32Array;
  lastZone: Uint8Array; // 0 none 1 fovea 2 mid 3 edge 4 wasted
  jumps: { x0: number; y0: number; x1: number; y1: number; t: number }[];
}

const ZI: Record<string, number> = { fovea: 1, mid: 2, edge: 3 };

function buildSeq(skip: boolean, gx0: number, gy0: number, agg: number, frame: number): { seq: number[]; zones: (Zone | 'blank')[] } {
  const seq: number[] = [], zones: (Zone | 'blank')[] = [];
  for (let gy = 0; gy < ROWS; gy++) for (let gx = 0; gx < COLS; gx++) {
    const z = zoneOf(gx, gy, gx0, gy0, agg);
    if (skip && z === 'skip') continue;
    // interlaced mid dots off-phase: visited, blanked (counted as in the model)
    const zz: Zone | 'blank' = z === 'mid' && !midLit(gx, gy, frame, agg) ? 'blank' : z;
    seq.push(gy * COLS + gx); zones.push(zz);
  }
  return { seq, zones };
}

function newLane(skip: boolean, g: { x: number; y: number }, agg: number): Lane {
  const { seq, zones } = buildSeq(skip, g.x, g.y, agg, 0);
  return { seq, zones, pos: 0, frames: 0, lastLit: new Float32Array(FIXED_POINTS).fill(-1e9), lastZone: new Uint8Array(FIXED_POINTS), jumps: [] };
}

export default function ScanModelSim(_: Partial<VfxSlotProps>) {
  const [agg, setAgg] = useState(70);
  const aggRef = useRef(0.7); aggRef.current = agg / 100;
  const gaze = useRef({ x: FW * 0.42, y: FH * 0.5, user: false });
  const lanes = useRef<{ raster: Lane; skip: Lane } | null>(null);
  const [counts, setCounts] = useState({ r: 0, s: 0 });
  const clock = useRef(0);

  const st = countFrame(gaze.current.x, gaze.current.y, agg / 100);

  const draw = ({ ctx, w, h, dt, tier, t }: { ctx: CanvasRenderingContext2D; w: number; h: number; dt: number; tier: string; t: number }) => {
    const g = gaze.current;
    if (!g.user && tier !== 'static') { g.x = FW * (0.5 + 0.28 * Math.sin(t / 4100)); g.y = FH * (0.5 + 0.22 * Math.sin(t / 2900 + 1)); }
    const a = aggRef.current;
    if (!lanes.current) lanes.current = { raster: newLane(false, g, a), skip: newLane(true, g, a) };
    clock.current += tier === 'static' ? 0 : dt;
    const now = clock.current;
    const half = w / 2;

    ctx.fillStyle = '#04050a';
    ctx.fillRect(0, 0, w, h);

    (['raster', 'skip'] as const).forEach((k, li) => {
      const L = lanes.current![k];
      const ox = li * half + (half - W) / 2, oy = (h - H) / 2;
      // framebuffer grid (faint)
      ctx.fillStyle = 'rgba(58,74,106,.35)';
      for (let gy = 0; gy < ROWS; gy++) for (let gx = 0; gx < COLS; gx++) ctx.fillRect(ox + (gx * CELL + 5) * S - 0.5, oy + (gy * CELL + 5) * S - 0.5, 1, 1);

      let bx = ox, by = oy;
      if (tier === 'static') {
        // composed still: one full frame visited
        for (let i = 0; i < L.seq.length; i++) { const zi = L.zones[i]; if (zi === 'blank') { L.lastZone[L.seq[i]] = 2; L.lastLit[L.seq[i]] = now; continue; } L.lastLit[L.seq[i]] = now; L.lastZone[L.seq[i]] = zi === 'skip' ? 4 : ZI[zi]; }
      } else {
        const prev = Math.floor(L.pos);
        L.pos += DOTS_PER_MS * dt;
        const end = Math.floor(L.pos);
        for (let i = prev; i < Math.min(end, L.seq.length); i++) {
          const d = L.seq[i];
          const zi = L.zones[i];
          if (zi !== 'blank') { L.lastLit[d] = now; L.lastZone[d] = zi === 'skip' ? 4 : ZI[zi]; }
          if (i > 0 && k === 'skip') {
            const p = L.seq[i - 1];
            const gap = d - p;
            if (gap > 1 && Math.floor(p / COLS) === Math.floor(d / COLS)) {
              L.jumps.push({ x0: (p % COLS) * CELL + 5, y0: Math.floor(p / COLS) * CELL + 5, x1: (d % COLS) * CELL + 5, y1: Math.floor(d / COLS) * CELL + 5, t: now });
            }
          }
        }
        if (L.pos >= L.seq.length) {
          L.frames++;
          const nb = buildSeq(k === 'skip', g.x, g.y, a, L.frames);
          L.seq = nb.seq; L.zones = nb.zones; L.pos = 0;
        }
        const cur = L.seq[Math.min(L.seq.length - 1, Math.floor(L.pos))];
        bx = ox + ((cur % COLS) * CELL + 5) * S; by = oy + (Math.floor(cur / COLS) * CELL + 5) * S;
      }

      // phosphor dots
      ctx.save();
      if (tier === 'full') ctx.globalCompositeOperation = 'lighter';
      const sp = tier === 'full' ? { 1: spot(ZONE_RGB.fovea), 2: spot(ZONE_RGB.mid), 3: spot(ZONE_RGB.edge), 4: spot([255, 60, 110]) } as Record<number, HTMLCanvasElement> : null;
      for (let d = 0; d < FIXED_POINTS; d++) {
        const zc = L.lastZone[d];
        if (!zc) continue;
        const age = now - L.lastLit[d];
        const tau = zc === 4 ? 260 : TAU * 2.2;
        const e = tier === 'static' ? (zc === 4 ? 0.35 : 0.9) : Math.exp(-age / tau);
        if (e < 0.03) continue;
        const x = ox + ((d % COLS) * CELL + 5) * S, y = oy + (Math.floor(d / COLS) * CELL + 5) * S;
        if (sp) {
          const sz = (zc === 3 ? 16 : zc === 4 ? 7 : 10) * S;
          ctx.globalAlpha = e * (zc === 4 ? 0.5 : 1);
          ctx.drawImage(sp[zc], x - sz / 2, y - sz / 2, sz, sz);
        } else {
          const c = zc === 4 ? [255, 60, 110] : zc === 1 ? ZONE_RGB.fovea : zc === 2 ? ZONE_RGB.mid : ZONE_RGB.edge;
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${e * (zc === 4 ? 0.4 : 0.85)})`;
          ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
        }
      }
      ctx.restore();

      // vector jumps (skip-scan only): fast, thin, unlit
      if (k === 'skip' && tier !== 'static') {
        ctx.save();
        ctx.lineWidth = 1;
        L.jumps = L.jumps.filter((j) => now - j.t < 220);
        for (const j of L.jumps) {
          const e = 1 - (now - j.t) / 220;
          ctx.strokeStyle = `rgba(255,225,53,${0.55 * e})`;
          ctx.beginPath();
          ctx.moveTo(ox + j.x0 * S, oy + j.y0 * S);
          const mx = (j.x0 + j.x1) / 2;
          ctx.quadraticCurveTo(ox + mx * S, oy + j.y0 * S - 6, ox + j.x1 * S, oy + j.y1 * S);
          ctx.stroke();
        }
        ctx.restore();
      }

      // beam spot + its scan line
      if (tier !== 'static') {
        ctx.fillStyle = 'rgba(0,255,153,.05)';
        ctx.fillRect(ox, by - 3, W, 6);
        ctx.save();
        if (tier === 'full') { ctx.shadowColor = '#fff'; ctx.shadowBlur = 14; }
        ctx.fillStyle = '#f0f4ff';
        ctx.beginPath(); ctx.arc(bx, by, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // frame progress bar
      const prog = tier === 'static' ? 1 : L.pos / L.seq.length;
      const frameFrac = L.seq.length / FIXED_POINTS;
      const barY = oy + H + 14;
      ctx.fillStyle = 'rgba(26,34,64,1)';
      ctx.fillRect(ox, barY, W, 4);
      ctx.fillStyle = k === 'raster' ? '#6a7fa8' : '#00ff99';
      ctx.fillRect(ox, barY, W * frameFrac * prog, 4);
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      ctx.fillRect(ox + W * frameFrac - 1, barY - 3, 1, 10);
    });
    if (Math.floor(now / 250) !== Math.floor((now - dt) / 250)) setCounts({ r: lanes.current.raster.frames, s: lanes.current.skip.frames });
  };

  const { canvasRef, wrapRef } = useStage(1000, H + 48, draw as never, [agg]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = pointerToLogical(e, e.currentTarget, 1000, H + 48);
    const lane = p.x > 500 ? 1 : 0;
    const ox = lane * 500 + (500 - W) / 2, oy = (H + 48 - H) / 2;
    gaze.current = { x: Math.max(0, Math.min(FW, (p.x - ox) / S)), y: Math.max(0, Math.min(FH, (p.y - oy) / S)), user: true };
    void r;
  };

  return (
    <Frame
      id="scan-model-sim"
      eyebrow="Interactive · Scan model"
      title="Same raster pass. Fewer dots to visit."
      controls={<Slider id="sms-agg" label="Foveation aggressiveness" value={agg} onChange={setAgg} valueText={`${agg}%`} />}
      readout={
        <>
          <Readout k="Raster frame" v={(1000 / BASELINE_HZ).toFixed(2)} unit="ms" note={<>{BASELINE_HZ} Hz. Visits all {fmt(FIXED_POINTS)} dots, including the ones foveation throws away.</>} />
          <Readout big k="Skip-Scan frame" v={st.frameMs.toFixed(2)} unit="ms" color="var(--crtvr-phosphor)" note={<>{fmt(st.hz)} Hz. Visits {fmt(st.drawn)} dots, jumps the rest.</>} />
          <Readout k="Frames finished (slow-mo)" v={<>{counts.r} <span style={{ color: 'var(--crtvr-text-dim)' }}>vs</span> {counts.s}</>} color="var(--crtvr-yellow)" note="Raster vs Skip-Scan, same clock." />
          <Readout k="Per-dot dwell" v="Identical" color="var(--crtvr-blue)" note="Skip-Scan never dwells on a skipped dot and does no vector rendering. Jumps only." />
        </>
      }
      hint="Point at either screen to move the gaze. Left: raster. Right: Skip-Scan. Shown in slow motion."
      foot={<><b>Illustrative.</b> Both lanes run one left-to-right, top-to-bottom scan-line pass over the same framebuffer at the same dwell per dot. Jump time is drawn as instant. Numbers from the shared model (120 Hz full-field baseline).</>}
    >
      <div className="ix-split" style={{ marginBottom: 6 }}>
        <p className="ix-split__h">Raster <b style={{ color: 'var(--crtvr-text-dim)' }}>every dot</b></p>
        <p className="ix-split__h">Skip-Scan <b style={{ color: 'var(--crtvr-phosphor)' }}>needed dots only</b></p>
      </div>
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} onPointerMove={onPointer} onPointerDown={onPointer}
          aria-label={`Raster versus Skip-Scan. Raster frame ${(1000 / BASELINE_HZ).toFixed(2)} milliseconds. Skip-Scan frame ${st.frameMs.toFixed(2)} milliseconds, ${st.hz} hertz.`} />
      </div>
      <Legend items={[
        { c: '#00ff99', l: 'Fovea' }, { c: '#00b4ff', l: 'Mid-zone' }, { c: '#d8e4ff', l: 'Edge' },
        { c: '#ff3c6e', l: 'Wasted dwell (raster)' }, { c: '#ffe135', l: 'Vector jump (Skip-Scan)' },
      ]} />
    </Frame>
  );
}
