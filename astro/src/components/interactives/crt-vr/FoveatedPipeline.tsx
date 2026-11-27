/**
 * foveated-pipeline · Act 2 · End-to-end foveated pipeline.
 *
 * Top: the chain, gaze in → GPU renders only what the beam will draw → Intel
 * Eventide iDP carries gaze + the foveated framebuffer → the panel's scan
 * scheduler → the beam. Below: one whole-screen raster pass in slow motion.
 * Stage 1 (full-res core) visits every dot, stage 2 (mid-zone) is interlaced,
 * stage 3 (edge) is low-res, never interlaced, done with coarser vector skips.
 * Fewer dots → shorter pass → higher whole-screen refresh, shown against a pass
 * that visits every dot, on the same clock.
 *
 * Numbers come from the shared model (lib/model.ts). The 10–20× link figure is the
 * page's design target at 24K (the coarse model grid can't show that ratio).
 * No eye-tracking hardware is drawn: the panel only receives gaze coordinates.
 */
import { useEffect, useRef, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { CELL, COLS, FH, FIXED_POINTS, FW, R_FOVEA, R_MID, ROWS, ZONE_RGB, countFrame, zoneOf, type FrameCount } from './lib/model';
import { spot } from './lib/field';
import { useEased, useStage } from './lib/hooks';
import { Frame, Legend, Readout, Seg, fmt } from './lib/ui';
import './fp.css';

type Preset = 'mild' | 'aggressive';
const AGG: Record<Preset, number> = { mild: 0, aggressive: 1 };

const W = FW, SH = FH;        // screen in model units
const STRIP = 78;             // timing strip under the screen
const H = SH + STRIP;
const PASS_ALL_MS = 5200;     // slow motion: a pass that visits every dot takes 5.2 s
const HOLD_MS = 260;          // blanking pause between passes

type Dot = { gx: number; gy: number; z: 'fovea' | 'mid' | 'edge' };

/** Raster-order schedule of the dots this pass visits (same rule as the model). */
function schedule(gazeX: number, gazeY: number, agg: number): Dot[] {
  const out: Dot[] = [];
  for (let gy = 0; gy < ROWS; gy++) for (let gx = 0; gx < COLS; gx++) {
    const z = zoneOf(gx, gy, gazeX, gazeY, agg);
    if (z !== 'skip') out.push({ gx, gy, z });
  }
  return out;
}

const CHAIN = [
  { n: '01', t: 'Gaze in', s: 'Headset sends gaze x, y to the panel, every frame' },
  { n: '02', t: 'GPU renders foveated', s: 'Only the dots the beam will draw' },
  { n: '03', t: 'Intel Eventide iDP', s: 'Gaze + foveated framebuffer, ≈10–20× less data' },
  { n: '04', t: 'Scan scheduler', s: 'Builds the three-stage skip map' },
  { n: '05', t: 'One raster pass', s: 'The whole screen, top to bottom' },
];

export default function FoveatedPipeline(_: Partial<VfxSlotProps>) {
  const [preset, setPreset] = useState<Preset>('aggressive');
  const agg = AGG[preset];
  const [stats, setStats] = useState<FrameCount>(() => countFrame(FW / 2, FH / 2, agg));

  // pass state (lives across frames)
  const st = useRef({ start: -1, gx: FW / 2, gy: FH / 2, frame: 0, dots: schedule(FW / 2, FH / 2, agg), passes: 0, t0: 0 });
  useEffect(() => {
    const s = st.current;
    s.start = -1; s.passes = 0; s.frame = 0;
    s.dots = schedule(s.gx, s.gy, agg);
    setStats(countFrame(s.gx, s.gy, agg));
  }, [agg]);

  const { canvasRef, wrapRef, tier } = useStage(W, H, ({ ctx, t, tier }) => {
    const s = st.current;
    const isStatic = tier === 'static';
    // the stage clock restarts whenever the loop restarts (preset, tier or visibility change)
    if (s.start < 0 || t < s.start) { s.start = t; s.t0 = t; }
    let dur = (PASS_ALL_MS * s.dots.length) / FIXED_POINTS;
    // new pass: latch the latest gaze, flip the interlace phase
    if (!isStatic && t - s.start > dur + HOLD_MS) {
      s.start = t; s.frame++; s.passes++;
      const k = (t - s.t0) / 1000;
      s.gx = FW / 2 + 170 * Math.sin(k * 0.55);
      s.gy = FH / 2 + 70 * Math.sin(k * 0.83 + 1);
      s.dots = schedule(s.gx, s.gy, agg);
      dur = (PASS_ALL_MS * s.dots.length) / FIXED_POINTS;
      setStats(countFrame(s.gx, s.gy, agg));
    }
    if (isStatic) { s.gx = FW / 2; s.gy = FH / 2; s.dots = schedule(s.gx, s.gy, agg); }
    const n = s.dots.length;
    const prog = isStatic ? 1 : Math.max(0, Math.min(1, (t - s.start) / dur));
    const cur = Math.max(0, Math.min(n - 1, Math.floor(prog * n)));

    // ── screen
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const cx = (gx: number) => gx * CELL + CELL / 2;
    // the framebuffer grid every dot would cost (faint)
    ctx.fillStyle = 'rgba(58,74,106,.28)';
    for (let gy = 0; gy < ROWS; gy++) for (let gx = 0; gx < COLS; gx++) ctx.fillRect(cx(gx) - 0.5, cx(gy) - 0.5, 1, 1);

    // zone rings around the latched gaze
    ctx.save();
    ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,255,153,.45)';
    ctx.beginPath(); ctx.arc(s.gx, s.gy, R_FOVEA, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,180,255,.4)';
    ctx.beginPath(); ctx.arc(s.gx, s.gy, R_MID, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // dots: visited ones glow, the rest of this pass waits dim
    ctx.save();
    if (tier === 'full') ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < n; j++) {
      const d = s.dots[j];
      const done = j <= cur;
      // interlaced mid-zone: alternate lines light on alternate passes
      const on = d.z !== 'mid' || (d.gy + s.frame) % 2 === 0;
      let a = done ? (on ? 1 : 0.28) : 0.07;
      if (done && !isStatic) a *= Math.max(0.45, 1 - ((cur - j) / Math.max(1, n)) * 1.2);
      const x = cx(d.gx), y = cx(d.gy);
      if (tier === 'full') {
        const sz = d.z === 'edge' ? 26 : d.z === 'mid' ? 15 : 12;
        ctx.globalAlpha = a;
        ctx.drawImage(spot(ZONE_RGB[d.z], 48), x - sz / 2, y - sz / 2, sz, sz);
      } else {
        ctx.globalAlpha = a;
        const [r, g, b] = ZONE_RGB[d.z];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath(); ctx.arc(x, y, d.z === 'edge' ? 3.4 : 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    // beam: the current scan line, the vector jump into the current dot, the spot
    if (!isStatic && prog < 1 && n > 0) {
      const d = s.dots[cur], p = s.dots[Math.max(0, cur - 1)];
      const by = cx(d.gy), bx = cx(d.gx);
      ctx.save();
      const grad = ctx.createLinearGradient(0, by - 16, 0, by + 1);
      grad.addColorStop(0, 'rgba(0,255,153,0)'); grad.addColorStop(1, 'rgba(0,255,153,.07)');
      ctx.fillStyle = grad; ctx.fillRect(0, by - 16, W, 17);
      ctx.fillStyle = 'rgba(200,255,230,.18)'; ctx.fillRect(0, by, W, 1);
      const gap = (d.gy - p.gy) * COLS + (d.gx - p.gx);
      if (gap > 1) {
        ctx.strokeStyle = 'rgba(255,225,53,.85)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx(p.gx), cx(p.gy));
        if (d.gy === p.gy) ctx.quadraticCurveTo((cx(p.gx) + bx) / 2, by - Math.min(30, 6 + gap * 0.8), bx, by);
        else ctx.lineTo(bx, by);
        ctx.stroke();
      }
      if (tier === 'full') { ctx.shadowColor = '#fff'; ctx.shadowBlur = 14; }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // gaze coordinate marker (a coordinate, not hardware)
    ctx.save();
    ctx.strokeStyle = '#eafff4'; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(s.gx - 9, s.gy); ctx.lineTo(s.gx - 3, s.gy); ctx.moveTo(s.gx + 3, s.gy); ctx.lineTo(s.gx + 9, s.gy);
    ctx.moveTo(s.gx, s.gy - 9); ctx.lineTo(s.gx, s.gy - 3); ctx.moveTo(s.gx, s.gy + 3); ctx.lineTo(s.gx, s.gy + 9);
    ctx.stroke();
    ctx.restore();

    // stage tags
    ctx.font = '500 10px "DM Mono", monospace'; ctx.textAlign = 'left';
    const tag = (txt: string, x: number, y: number, c: string) => {
      ctx.fillStyle = 'rgba(4,5,10,.78)';
      const w = ctx.measureText(txt).width + 10;
      ctx.fillRect(ctx.textAlign === 'right' ? x - w + 5 : x - 5, y - 11, w, 15);
      ctx.fillStyle = c; ctx.fillText(txt, x, y);
    };
    const tx = Math.min(W - 170, Math.max(8, s.gx + 8));
    tag('1 · CORE', Math.min(W - 70, s.gx + R_FOVEA * 0.72 + 4), Math.max(14, s.gy - R_FOVEA * 0.72), '#00ff99');
    tag('2 · INTERLACED', Math.min(W - 110, tx), Math.max(14, s.gy - R_MID + 18), '#00b4ff');
    tag('3 · COARSE SKIPS', 10, SH - 12, '#d8e4ff');
    ctx.textAlign = 'right';
    tag(`PASS ${s.passes + 1} · ${n} / ${FIXED_POINTS} DOTS`, W - 10, SH - 12, '#6a7fa8');
    ctx.textAlign = 'left';

    // ── timing strip: the same clock for a pass that visits every dot
    const y0 = SH + 14, bw = W - 190, bx0 = 180, bh = 10;
    ctx.fillStyle = '#1a2240'; ctx.fillRect(0, SH, W, 1);
    const allProg = isStatic ? 1 : (Math.max(0, t - s.t0) % (PASS_ALL_MS + HOLD_MS)) / PASS_ALL_MS;
    const allPasses = isStatic ? 1 : Math.floor((t - s.t0) / (PASS_ALL_MS + HOLD_MS)) + 1;
    ctx.fillStyle = '#6a7fa8';
    ctx.fillText('EVERY DOT', 10, y0 + 9);
    ctx.fillStyle = 'rgba(185,200,255,.12)'; ctx.fillRect(bx0, y0, bw, bh);
    ctx.fillStyle = 'rgba(185,200,255,.55)'; ctx.fillRect(bx0, y0, bw * Math.min(1, allProg), bh);
    ctx.fillStyle = '#00ff99';
    ctx.fillText('FOVEATED PASS', 10, y0 + 33);
    const fr = n / FIXED_POINTS;
    ctx.fillStyle = 'rgba(0,255,153,.12)'; ctx.fillRect(bx0, y0 + 24, bw * fr, bh);
    ctx.fillStyle = '#00ff99'; ctx.fillRect(bx0, y0 + 24, bw * fr * prog, bh);
    ctx.strokeStyle = 'rgba(0,255,153,.6)'; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(bx0 + bw * fr, y0 + 20); ctx.lineTo(bx0 + bw * fr, y0 + 38); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#d8e4ff'; ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(fr * 100)}% OF THE BEAM TIME`, Math.min(bx0 + bw * fr + 8, W - 160), y0 + 33);
    ctx.fillStyle = '#6a7fa8'; ctx.textAlign = 'right';
    ctx.fillText(isStatic ? 'SAME CLOCK' : `SAME CLOCK · ${allPasses} vs ${s.passes + 1} PASSES`, W - 10, y0 + 56);
    ctx.textAlign = 'left';
  }, [agg]);

  const hz = useEased(stats.hz, tier);
  const linkOn = tier !== 'static';

  return (
    <Frame
      id="foveated-pipeline"
      eyebrow="Visual · End-to-end foveated pipeline"
      title="Gaze in, foveated frame in, one raster pass out"
      controls={
        <Seg<Preset>
          label="Foveation"
          value={preset}
          onChange={setPreset}
          options={[{ v: 'mild', l: 'Mild' }, { v: 'aggressive', l: 'Aggressive' }]}
        />
      }
      readout={
        <>
          <Readout big k="Whole-screen refresh" v={fmt(hz)} unit="Hz" color="var(--crtvr-phosphor)" note="The pass is shorter, so the whole screen refreshes sooner." />
          <Readout k="Beam time per pass" v={stats.frameMs.toFixed(2)} unit="ms" color="var(--crtvr-blue)" note={`${Math.round((1 - stats.saved) * 100)}% of a pass that visits every dot.`} />
          <Readout k="Dots this pass" v={fmt(stats.drawn)} note={`Stage 1 core ${fmt(stats.fovea)} · stage 2 mid ${fmt(stats.mid)} · stage 3 edge ${fmt(stats.edge)}`} />
          <Readout k="Link bandwidth" v="10–20×" unit="less" color="var(--crtvr-yellow)" note="Design target at 24K. The GPU sends only what the beam will draw." />
        </>
      }
      foot={<><b>Illustrative, slow motion.</b> One whole-screen raster pass, top to bottom, with equal dwell per visited dot and jumps drawn as zero time. The gaze is latched at the start of each pass. Refresh and dot counts come from the shared model, and the 10–20× link figure is the design target at 24K.</>}
    >
      <ol className={`fp-chain${linkOn ? ' is-live' : ''}`} aria-label="Foveated pipeline, from gaze to beam">
        {CHAIN.map((c) => (
          <li key={c.n} className="fp-node">
            <span className="fp-node__n">{c.n}</span>
            <b className="fp-node__t">{c.t}</b>
            <span className="fp-node__s">{c.s}</span>
          </li>
        ))}
      </ol>
      <div className="ix__screen" ref={wrapRef}>
        <canvas ref={canvasRef} aria-label={`One whole-screen raster pass: ${stats.drawn} of ${FIXED_POINTS} dots visited, ${stats.fovea} in the full-res core, ${stats.mid} interlaced in the mid-zone, ${stats.edge} coarse skips at the edge. Whole-screen refresh ${stats.hz} hertz.`} />
      </div>
      <div className="fp-legend"><Legend items={[
        { c: '#00ff99', l: 'Stage 1 · full-res core, every dot' },
        { c: '#00b4ff', l: 'Stage 2 · mid-zone, interlaced' },
        { c: '#d8e4ff', l: 'Stage 3 · edge, low-res, never interlaced' },
        { c: '#ffe135', l: 'Vector skip, no dwell' },
      ]} /></div>
    </Frame>
  );
}
