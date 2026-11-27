/**
 * zone-inspector · Act 2 · The three zones, up close.
 * Click a zone on the field (or pick one) to zoom into its dot pattern over
 * successive frames, with its dot cost per frame from the shared model.
 */
import { useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { CELL, COLS, FH, FIXED_POINTS, FW, ROWS, R_FOVEA, R_MID, ZONE_RGB, countFrame, edgeKeep, midKeep, midLit, zoneOf } from './lib/model';
import { drawField, spot } from './lib/field';
import { pointerToLogical, useStage, useTier } from './lib/hooks';
import { Frame, Readout, Seg, Slider, fmt } from './lib/ui';

type Z = 'fovea' | 'mid' | 'edge';
const W = 1000, H = 430;
const MS = 0.6;                         // mini map scale
const MX = 20, MY = (H - FH * MS) / 2;  // mini map origin
const LX = 690, LY = H / 2, LR = 190;   // lens centre / radius
const GAZE = { x: FW * 0.4, y: FH * 0.48 };
const WIN = 9;                          // lens shows WIN × WIN cells
const COL: Record<Z, string> = { fovea: '#00ff99', mid: '#00b4ff', edge: '#d8e4ff' };

/** A representative lens centre for each zone, in model units. */
const ANCHOR: Record<Z, { x: number; y: number }> = {
  fovea: { x: GAZE.x, y: GAZE.y },
  mid: { x: GAZE.x + (R_FOVEA + R_MID) / 2 + 6, y: GAZE.y - 10 },
  edge: { x: FW - 80, y: FH - 70 },
};

export default function ZoneInspector(_: Partial<VfxSlotProps>) {
  const [zone, setZone] = useState<Z>('mid');
  const [agg, setAgg] = useState(70);
  const a = agg / 100;
  const tier = useTier();
  const zoom = useRef(1); // 0..1 lens open animation
  const zoneRef = useRef(zone); zoneRef.current = zone;
  const aggRef = useRef(a); aggRef.current = a;
  const frameT = useRef(0);

  const st = countFrame(GAZE.x, GAZE.y, a);
  const zc = zone === 'fovea' ? st.fovea : zone === 'mid' ? st.mid : st.edge;
  const zoneCells = (() => { let n = 0; for (let gy = 0; gy < ROWS; gy++) for (let gx = 0; gx < COLS; gx++) { const x = gx * CELL + 5, y = gy * CELL + 5, d = Math.hypot(x - GAZE.x, y - GAZE.y); const zz: Z = d < R_FOVEA ? 'fovea' : d < R_MID ? 'mid' : 'edge'; if (zz === zone) n++; } return n; })();

  const { canvasRef, wrapRef } = useStage(W, H, ({ ctx, frame, dt, tier }) => {
    const z = zoneRef.current, ag = aggRef.current;
    if (tier === 'static') zoom.current = 1; else zoom.current = Math.min(1, zoom.current + dt / 500);
    frameT.current += tier === 'static' ? 0 : dt;
    // slow-motion frame counter for interlace (one model frame every 600 ms)
    const mf = Math.floor(frameT.current / 600);
    ctx.fillStyle = '#04050a';
    ctx.fillRect(0, 0, W, H);

    // mini map
    ctx.save();
    ctx.strokeStyle = '#1a2240';
    ctx.strokeRect(MX - 0.5, MY - 0.5, FW * MS + 1, FH * MS + 1);
    ctx.beginPath(); ctx.rect(MX, MY, FW * MS, FH * MS); ctx.clip();
    drawField(ctx, { gazeX: GAZE.x, gazeY: GAZE.y, agg: ag, frame: mf, tier, s: MS, ox: MX, oy: MY, rings: true });
    ctx.restore();

    // lens window on the mini map
    const an = ANCHOR[z];
    const ww = WIN * CELL * MS;
    const wx = MX + an.x * MS - ww / 2, wy = MY + an.y * MS - ww / 2;
    ctx.strokeStyle = COL[z];
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wx, wy, ww, ww);

    // connector lines
    const e = easeOut(zoom.current);
    const r = LR * (0.2 + 0.8 * e);
    ctx.save();
    ctx.strokeStyle = COL[z]; ctx.globalAlpha = 0.25; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wx + ww, wy); ctx.lineTo(LX, LY - r);
    ctx.moveTo(wx + ww, wy + ww); ctx.lineTo(LX, LY + r);
    ctx.stroke();
    ctx.restore();

    // lens
    ctx.save();
    ctx.beginPath(); ctx.arc(LX, LY, r, 0, Math.PI * 2);
    ctx.fillStyle = '#03040a'; ctx.fill();
    ctx.clip();
    const cell = (2 * r) / WIN;
    const gx0 = Math.round(an.x / CELL - WIN / 2), gy0 = Math.round(an.y / CELL - WIN / 2);
    // framebuffer positions (faint)
    for (let j = 0; j < WIN + 1; j++) for (let i = 0; i < WIN + 1; i++) {
      const x = LX - r + (i + 0.5) * cell, y = LY - r + (j + 0.5) * cell;
      ctx.fillStyle = 'rgba(58,74,106,.5)';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    if (tier === 'full') ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < WIN + 1; j++) for (let i = 0; i < WIN + 1; i++) {
      const gx = gx0 + i, gy = gy0 + j;
      if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) continue;
      const zz = zoneOf(gx, gy, GAZE.x, GAZE.y, ag);
      if (zz === 'skip') continue;
      const x = LX - r + (i + 0.5) * cell, y = LY - r + (j + 0.5) * cell;
      let lit = 1;
      if (zz === 'mid') {
        // interlace with a short persistence tail
        const on = midLit(gx, gy, mf, ag);
        const ph = (frameT.current % 600) / 600;
        lit = on ? 1 - ph * 0.4 : (tier === 'static' ? 0.25 : 0.25 * (1 - ph));
      }
      // spot grows with spacing so sparse zones stay soft, never blocky
      const k = zz === 'fovea' ? 1 : zz === 'mid' ? Math.sqrt(midKeep(ag)) : edgeKeep(ag);
      const sz = cell * (zz === 'fovea' ? 1.25 : zz === 'mid' ? 1.1 + 0.35 * k : 1.0 + 0.3 * k);
      if (tier === 'full') {
        ctx.globalAlpha = lit * (zz === 'edge' ? 0.8 : 1);
        ctx.drawImage(spot(ZONE_RGB[zz], 64), x - sz / 2, y - sz / 2, sz, sz);
      } else {
        const [R, G, B] = ZONE_RGB[zz];
        const g = ctx.createRadialGradient(x, y, 0, x, y, sz / 2);
        g.addColorStop(0, `rgba(${R},${G},${B},${0.9 * lit})`);
        g.addColorStop(1, `rgba(${R},${G},${B},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COL[z]; ctx.lineWidth = 1.5;
    if (tier === 'full') { ctx.shadowColor = COL[z]; ctx.shadowBlur = 16; }
    ctx.beginPath(); ctx.arc(LX, LY, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // lens label
    ctx.fillStyle = COL[z];
    ctx.font = '500 11px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${WIN} × ${WIN} DOTS · ${z === 'fovea' ? 'FOVEA' : z === 'mid' ? 'MID-ZONE' : 'EDGE'}`, LX, LY + LR + 24);
    void frame;
  }, [zone, agg]);

  const pick = (z: Z) => { setZone(z); zoom.current = 0; };
  const onClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerToLogical(e, e.currentTarget, W, H);
    const mx = (p.x - MX) / MS, my = (p.y - MY) / MS;
    if (mx < 0 || my < 0 || mx > FW || my > FH) return;
    const d = Math.hypot(mx - GAZE.x, my - GAZE.y);
    pick(d < R_FOVEA ? 'fovea' : d < R_MID ? 'mid' : 'edge');
  };

  const spatial = zone === 'fovea' ? 'Every dot' : zone === 'mid' ? `1 in ${midKeep(a)}` : `1 in ${edgeKeep(a) ** 2}`;
  const temporal = zone === 'fovea' ? 'Every frame' : zone === 'mid' ? (a < 0.15 ? 'Every frame' : 'Alternate frames') : 'Every frame';
  void tier;

  return (
    <Frame
      id="zone-inspector"
      eyebrow="Interactive · Zone inspector"
      title="Three zones. Three dot budgets."
      controls={
        <>
          <Seg label="Zone" value={zone} onChange={pick} options={[{ v: 'fovea', l: 'Fovea' }, { v: 'mid', l: 'Mid-zone' }, { v: 'edge', l: 'Edge' }]} />
          <Slider id="zi-agg" label="Foveation aggressiveness" value={agg} onChange={setAgg} valueText={`${agg}%`} />
        </>
      }
      readout={
        <>
          <Readout big k="Dot cost per frame" v={fmt(zc)} color={COL[zone]} note={<>of {fmt(zoneCells)} framebuffer dots in this zone.</>} />
          <Readout k="Share of the frame" v={`${Math.round((zc / st.drawn) * 100)}%`} note={<>of {fmt(st.drawn)} dots scanned ({fmt(FIXED_POINTS)} for a full grid).</>} />
          <Readout k="Spatial sampling" v={spatial} color="var(--crtvr-blue)" />
          <Readout k="Temporal rate" v={temporal} color={zone === 'edge' ? 'var(--crtvr-yellow)' : 'var(--crtvr-text)'}
            note={zone === 'edge' ? 'Never interlaced: the periphery is most sensitive to flicker.' : zone === 'mid' ? 'Interlaced: half the kept dots light each frame.' : 'Progressive, full resolution.'} />
        </>
      }
      hint="Click a zone on the field to inspect it. The lens runs in slow motion so the interlace is visible."
      foot={<><b>Illustrative.</b> Dot counts from the shared model (72 × 42 framebuffer). Dots stay round, soft phosphor spots in every zone, so sparse zones go soft instead of pixelated.</>}
    >
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} onPointerDown={onClick} aria-label={`Zone inspector, ${zone}. ${zc} dots per frame.`} />
      </div>
    </Frame>
  );
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
