/**
 * grid-vs-crt-foveation · Act 2 · Why grid panels can't do this.
 * Same scene, same gaze, same foveated render on both sides.
 * Grid panel (OLED/LCD): foveation saves GPU work only. The periphery is upscaled
 * into blocks and the panel still refreshes every pixel at a fixed 120 Hz.
 * CRT-VR: the beam skips what is not needed, so beam time is saved, refresh goes up,
 * and low-res areas are drawn as soft phosphor spots rather than square pixels.
 */
import { useEffect, useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { BASELINE_HZ, FH, FW, R_FOVEA, R_MID, countFrame, edgeKeep, midKeep } from './lib/model';
import { drawRings } from './lib/field';
import { pointerToLogical, useStage, useTier } from './lib/hooks';
import { Frame, Readout, Slider, fmt } from './lib/ui';

const W = 1000, PH = 292, GAP = 16;
const PW = (W - GAP) / 2;                // panel width 492
const S = PW / FW;                       // model → panel
const H = PH + 70;

/** Procedural scene: horizon, sun, grid floor, ridge lines, starfield, fine text. Lots of edges to show blocking. */
function buildScene(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = PW; c.height = PH;
  const g = c.getContext('2d')!;
  const hz = PH * 0.58;
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#050816'); sky.addColorStop(0.6, '#1a0b3a'); sky.addColorStop(1, '#4a1250');
  g.fillStyle = sky; g.fillRect(0, 0, PW, hz);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(216,228,255,${0.3 + rnd() * 0.6})`; g.fillRect(rnd() * PW, rnd() * hz * 0.85, 1, 1); }
  // sun with bands
  const sx = PW * 0.62, sy = hz - 8, sr = 64;
  const sun = g.createLinearGradient(0, sy - sr, 0, sy + sr);
  sun.addColorStop(0, '#ffe135'); sun.addColorStop(0.5, '#ff7a00'); sun.addColorStop(1, '#ff3c6e');
  g.save(); g.beginPath(); g.arc(sx, sy, sr, Math.PI, 0); g.clip();
  g.fillStyle = sun; g.fillRect(sx - sr, sy - sr, sr * 2, sr);
  g.fillStyle = '#1a0b3a';
  for (let i = 0; i < 6; i++) g.fillRect(sx - sr, sy - 6 - i * 9, sr * 2, 1.5 + i * 0.6);
  g.restore();
  // ridges
  g.fillStyle = '#0a0a20'; g.strokeStyle = '#cc44ff'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, hz);
  for (let x = 0; x <= PW; x += 12) g.lineTo(x, hz - 18 - 26 * Math.abs(Math.sin(x * 0.021)) - 10 * Math.sin(x * 0.09));
  g.lineTo(PW, hz); g.closePath(); g.fill(); g.stroke();
  // floor
  g.fillStyle = '#05030f'; g.fillRect(0, hz, PW, PH - hz);
  g.strokeStyle = '#00ff99'; g.globalAlpha = 0.8;
  for (let i = -16; i <= 16; i++) { g.beginPath(); g.moveTo(PW / 2 + i * 8, hz); g.lineTo(PW / 2 + i * 70, PH); g.stroke(); }
  for (let j = 1; j < 14; j++) { const y = hz + Math.pow(j / 13, 2.2) * (PH - hz); g.globalAlpha = 0.25 + 0.6 * (j / 13); g.beginPath(); g.moveTo(0, y); g.lineTo(PW, y); g.stroke(); }
  g.globalAlpha = 1;
  // fine HUD text (detail that blocks visibly)
  g.fillStyle = '#00b4ff'; g.font = '9px "DM Mono", monospace';
  ['SECTOR 07 · 2nd GEN', 'BEAM 6 × RGBMCY', 'VECTOR SKIP ON', 'HEX-INDEX LOCK'].forEach((t, i) => g.fillText(t, 14, 20 + i * 12));
  g.fillStyle = '#f0f4ff'; g.font = '11px "DM Mono", monospace';
  g.fillText('NEWGEN × SONY', PW - 116, 22);
  return c;
}

/** Down-sample by f (box), return a small canvas. */
function downsample(src: HTMLCanvasElement, f: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(src.width / f)); c.height = Math.max(1, Math.round(src.height / f));
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export default function GridVsCrtFoveation(_: Partial<VfxSlotProps>) {
  const [agg, setAgg] = useState(70);
  const a = agg / 100;
  const gaze = useRef({ x: FW * 0.38, y: FH * 0.55, tx: FW * 0.38, ty: FH * 0.55 });
  const scene = useRef<HTMLCanvasElement | null>(null);
  const layers = useRef<{ key: string; mid: HTMLCanvasElement; edge: HTMLCanvasElement } | null>(null);
  const [tick, setTick] = useState(0);
  const [st, setSt] = useState(() => countFrame(FW * 0.38, FH * 0.55, 0.7));
  const ticks = useRef(0);
  const liveTier = useTier();
  const hzRef = useRef(st.hz); hzRef.current = st.hz;
  // fonts may land after first paint; rebuild once they do
  useEffect(() => { document.fonts?.ready.then(() => { scene.current = null; layers.current = null; setTick((t) => t + 1); }); }, []);

  // resolution factors from the shared model (linear): mid √k, edge k (×2 so the GPU-side blocks are legible at this size)
  const midF = Math.max(1, Math.sqrt(midKeep(a)) * 2);
  const edgeF = edgeKeep(a) * 2;

  const { canvasRef, wrapRef, tier } = useStage(W, H, ({ ctx, dt, tier }) => {
    if (!scene.current) scene.current = buildScene();
    const key = `${midF}/${edgeF}`;
    if (!layers.current || layers.current.key !== key) layers.current = { key, mid: downsample(scene.current, midF), edge: downsample(scene.current, edgeF) };
    const g = gaze.current;
    if (tier === 'static') { g.x = g.tx; g.y = g.ty; } else { g.x += (g.tx - g.x) * 0.15; g.y += (g.ty - g.y) * 0.15; }
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);

    for (let side = 0; side < 2; side++) {
      const ox = side * (PW + GAP), crt = side === 1;
      const gx = g.x * S, gy = g.y * S;
      ctx.save();
      ctx.beginPath(); ctx.rect(ox, 0, PW, PH); ctx.clip();
      ctx.translate(ox, 0);
      const up = (src: HTMLCanvasElement, soft: boolean, blur: number) => {
        ctx.imageSmoothingEnabled = soft;
        if (soft && tier === 'full' && blur > 0) ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(src, 0, 0, PW, PH);
        ctx.filter = 'none';
      };
      // edge
      up(layers.current.edge, crt, edgeF * 0.35);
      // mid (feathered on CRT, hard circle on the grid)
      ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, R_MID * S, 0, Math.PI * 2); ctx.clip();
      up(layers.current.mid, crt, midF * 0.3);
      ctx.restore();
      // fovea: native
      ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, R_FOVEA * S, 0, Math.PI * 2); ctx.clip();
      ctx.imageSmoothingEnabled = true; ctx.drawImage(scene.current, 0, 0);
      ctx.restore();
      if (crt) {
        // phosphor texture: soft, no pixel grid
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(200,210,230,1)';
        for (let y = 0; y < PH; y += 2) { ctx.globalAlpha = 0.12; ctx.fillRect(0, y, PW, 1); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
      drawRings(ctx, ox + gx, gy, S, tier);

      // frame strip: frames delivered in the same 25 ms window
      const hz = crt ? hzRef.current : BASELINE_HZ;
      const n = Math.round(hz * 0.025);
      const sy = PH + 18;
      ctx.fillStyle = '#6a7fa8'; ctx.font = '500 10px "DM Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillText(`FRAMES IN 25 ms · ${n}`, ox, sy - 4);
      ctx.fillStyle = '#1a2240'; ctx.fillRect(ox, sy + 4, PW, 26);
      const col = crt ? '#00ff99' : '#b9c8ff';
      const run = tier === 'static' ? 1 : ((ticks.current += dt) % 2400) / 2400;
      for (let i = 0; i < n; i++) {
        const x = ox + 4 + (i / Math.max(1, n)) * (PW - 8);
        const on = tier === 'static' || i / n <= run;
        ctx.fillStyle = on ? col : 'rgba(106,127,168,.25)';
        ctx.fillRect(x, sy + 8, Math.max(1.5, (PW - 8) / Math.max(1, n) - 3), 18);
      }
    }
  }, [agg, tick, liveTier === 'static' ? st.hz : 0]);

  useEffect(() => { setSt(countFrame(gaze.current.tx, gaze.current.ty, a)); }, [agg, tick]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.type === 'pointermove' && e.pointerType !== 'mouse' && e.buttons === 0) return;
    const p = pointerToLogical(e, e.currentTarget, W, H);
    if (p.y > PH) return;
    const lx = p.x > PW + GAP ? p.x - PW - GAP : p.x;
    gaze.current.tx = Math.max(0, Math.min(FW, lx / S));
    gaze.current.ty = Math.max(0, Math.min(FH, p.y / S));
    setSt(countFrame(gaze.current.tx, gaze.current.ty, a));
    if (tier === 'static') setTick((t) => t + 1);
  };

  return (
    <Frame
      id="grid-vs-crt-foveation"
      eyebrow="Interactive · Grid panel vs CRT-VR foveation"
      title="Foveation that pays the display, not just the GPU"
      controls={<Slider id="gvc-agg" label="Foveation aggressiveness" value={agg} onChange={setAgg} valueText={`${agg}%`} />}
      readout={
        <>
          <Readout k="Grid panel refresh" v={BASELINE_HZ} unit="Hz · fixed" color="var(--crtvr-panel-cold)" note="Every physical pixel is refreshed every frame, foveated or not." />
          <Readout big k="CRT-VR refresh" v={fmt(st.hz)} unit="Hz" color="var(--crtvr-phosphor)" note="Skipped dots cost no beam time, so the whole frame gets shorter." />
          <Readout k="Display time saved" v={<><span style={{ color: 'var(--crtvr-panel-cold)' }}>0%</span> <span style={{ color: 'var(--crtvr-text-dimmer)' }}>vs</span> {Math.round(st.saved * 100)}%</>} color="var(--crtvr-phosphor)" note="Grid vs CRT-VR. Both save the same GPU work." />
          <Readout k="Periphery" v={<><span style={{ color: 'var(--crtvr-panel-cold)' }}>Blocky</span> <span style={{ color: 'var(--crtvr-text-dimmer)' }}>vs</span> Soft</>} color="var(--crtvr-phosphor)" />
        </>
      }
      hint="Move across either screen to set the gaze. Look at the edges: square blocks on the left, soft spots on the right."
      foot={<><b>Illustrative.</b> Same foveated render on both sides. Grid baseline 120 Hz. CRT-VR refresh from the shared model. Blur and block size are exaggerated so they read at this size.</>}
    >
      <div className="ix-split" style={{ gap: GAP, marginBottom: 6 }}>
        <p className="ix-split__h">OLED / LCD grid <b style={{ color: 'var(--crtvr-panel-cold)' }}>saves GPU only</b></p>
        <p className="ix-split__h">CRT-VR beam <b style={{ color: 'var(--crtvr-phosphor)' }}>saves beam time</b></p>
      </div>
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} onPointerMove={onPointer} onPointerDown={onPointer}
          aria-label={`Grid panel at fixed ${BASELINE_HZ} hertz with blocky periphery, versus CRT-VR at ${st.hz} hertz with a soft periphery.`} />
      </div>
    </Frame>
  );
}
