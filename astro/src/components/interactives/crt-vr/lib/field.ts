/**
 * Shared renderer for the foveated dot field (model units 720 × 420).
 * Dots are drawn as soft phosphor spots, never squares: the CRT has no pixel grid,
 * so even the sparsest zone reads soft rather than blocky.
 */
import { CELL, COLS, ROWS, R_FOVEA, R_MID, ZONE_RGB, midLit, zoneOf } from './model';
import type { VfxTier } from '../../../../lib/motion/types';

const spriteCache = new Map<string, HTMLCanvasElement>();

/** Radial phosphor spot sprite (hot core + soft halo). */
export function spot(rgb: [number, number, number], size = 32): HTMLCanvasElement {
  const key = rgb.join(',') + '/' + size;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  const [R, G, B] = rgb;
  grad.addColorStop(0, `rgba(255,255,255,1)`);
  grad.addColorStop(0.12, `rgba(${R},${G},${B},1)`);
  grad.addColorStop(0.35, `rgba(${R},${G},${B},.35)`);
  grad.addColorStop(1, `rgba(${R},${G},${B},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  spriteCache.set(key, c);
  return c;
}

export interface FieldOpts {
  gazeX: number;
  gazeY: number;
  agg: number;
  frame: number;
  tier: VfxTier;
  /** Scale from model units to stage units. */
  s?: number;
  ox?: number;
  oy?: number;
  noFovea?: boolean;
  /** Only draw dots whose row index is < this (for a beam mid-frame). */
  rowLimit?: number;
  /** Brightness multiplier. */
  gain?: number;
  rings?: boolean;
  /** Restrict to a zone. */
  only?: 'fovea' | 'mid' | 'edge';
}

/** Draws the field; returns dots lit this frame. */
export function drawField(ctx: CanvasRenderingContext2D, o: FieldOpts): number {
  const s = o.s ?? 1, ox = o.ox ?? 0, oy = o.oy ?? 0, gain = o.gain ?? 1;
  const glow = o.tier === 'full';
  const rows = Math.min(ROWS, o.rowLimit ?? ROWS);
  let lit = 0;
  ctx.save();
  if (glow) ctx.globalCompositeOperation = 'lighter';
  const spr = glow ? { fovea: spot(ZONE_RGB.fovea), mid: spot(ZONE_RGB.mid), edge: spot(ZONE_RGB.edge) } : null;
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < COLS; gx++) {
      const z = zoneOf(gx, gy, o.gazeX, o.gazeY, o.agg, o.noFovea);
      if (z === 'skip') continue;
      if (o.only && z !== o.only) continue;
      if (z === 'mid' && !midLit(gx, gy, o.frame, o.agg)) continue;
      const x = ox + (gx * CELL + CELL / 2) * s;
      const y = oy + (gy * CELL + CELL / 2) * s;
      lit++;
      if (spr) {
        // softer, larger spots further out: low-res reads as soft, not pixelated
        const sz = (z === 'fovea' ? 13 : z === 'mid' ? 13 : 16) * s;
        ctx.globalAlpha = Math.min(1, (z === 'fovea' ? 1 : z === 'mid' ? 0.9 : 0.5) * gain);
        ctx.drawImage(spr[z], x - sz / 2, y - sz / 2, sz, sz);
      } else {
        const [R, G, B] = ZONE_RGB[z];
        const a = (z === 'fovea' ? 0.85 : z === 'mid' ? 0.55 : 0.32) * gain;
        const sz = (z === 'fovea' ? 3 : z === 'mid' ? 2.4 : 2) * Math.max(0.7, s);
        ctx.fillStyle = `rgba(${R},${G},${B},${a})`;
        ctx.beginPath();
        ctx.arc(x, y, sz / 2 + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  if (o.rings && !o.noFovea) drawRings(ctx, o.gazeX * s + ox, o.gazeY * s + oy, s, o.tier);
  return lit;
}

export function drawRings(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, tier: VfxTier) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0,255,153,.6)';
  if (tier === 'full') { ctx.shadowColor = '#00ff99'; ctx.shadowBlur = 8; }
  ctx.beginPath(); ctx.arc(x, y, R_FOVEA * s, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0,180,255,.4)';
  ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.arc(x, y, R_MID * s, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  // gaze reticle
  ctx.strokeStyle = 'rgba(240,244,255,.9)';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.moveTo(x - 12, y); ctx.lineTo(x - 7, y);
  ctx.moveTo(x + 7, y); ctx.lineTo(x + 12, y);
  ctx.moveTo(x, y - 12); ctx.lineTo(x, y - 7);
  ctx.moveTo(x, y + 7); ctx.lineTo(x, y + 12);
  ctx.stroke();
  ctx.restore();
}

/** Phosphor persistence: fade the previous frame instead of clearing (trail), or clear when static. */
export function fadeBg(ctx: CanvasRenderingContext2D, w: number, h: number, tier: VfxTier, a = 0.5) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = tier === 'static' ? '#04050a' : `rgba(4,5,10,${a})`;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
