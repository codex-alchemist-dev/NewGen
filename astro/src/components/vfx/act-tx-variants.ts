/**
 * Bespoke act-transition moments for Acts 5–12 (used by ActTransition.astro).
 *
 * Each variant is a pure function of the scrubbed moment progress `u` (0…1)
 * and the hand-off `out` (0…1, power-on onto the new act), so every frame is
 * repeatable and the whole thing plays backwards when you scroll up.
 * The static tier renders the frame at u ≈ 0.48, so every variant's poster
 * moment sits there.
 *
 *   flare      Act 5  Brilliance     black void → one phosphor hexagon ignites
 *                                    into a blinding HDR bloom → settles on true black
 *   whip       Act 6  Motion         whip-pan: a sample-and-hold smear is swept
 *                                    by the raster into razor-crisp impulse frames
 *   blueprint  Act 7  The Machine    side-fire tube flies together from exploded
 *                                    parts as a blueprint, then the six beams fire
 *   cone       Act 8  Optics         rays fan out of the tube as a cone, bend
 *                                    through the eyepiece and wrap around you
 *   shield     Act 9  Safe           a high-voltage arc crackles, then a hex
 *                                    shield seals around it
 *   timelapse  Act 10 Built to Last  years fly past; dust and daylight sweep,
 *                                    burn-in is evened out, the phosphor stays uniform
 *   seals      Act 11 Certified      certification seals stamp in, then shimmer
 *   race       Act 12 Proof          refresh bars race; CRT-VR breaks the chart
 */
import { seg, clamp01, smooth, easeOut, easeInOut, expoOut, lerp } from './motion';
import { budget } from './quality';

export type Ctx = { W: number; H: number; cx: number; cy: number; R: number; tint: string };
export type VariantOpts = {
  /** art owns the center: title goes to the lower band */
  lower?: boolean;
  /** variant draws its own ignition: hide the shared dot + bloom */
  ownIgnite?: boolean;
};
export type VariantImpl = {
  opts?: VariantOpts;
  build(g: SVGGElement, c: Ctx): void;
  render(u: number, c: Ctx, out: number): void;
  /** optional: style the beam-drawn title in sync with the moment */
  title?(u: number, el: HTMLElement, out: number): void;
};

/* ── helpers ──────────────────────────────────────────────── */
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag: string, attrs: Record<string, string | number> = {}, parent?: Element) => {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, String(attrs[k]));
  parent?.appendChild(el);
  return el as SVGElement;
};
const set = (el: Element, attrs: Record<string, string | number>) => {
  for (const k in attrs) {
    const v = attrs[k];
    el.setAttribute(k, typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : v);
  }
};
const rnd = (i: number, s = 1) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const css = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
/** bell: 0 → 1 → 0 across [a, b] */
const bell = (u: number, a: number, b: number) => Math.sin(Math.PI * seg(u, a, b));
/** pointy-top hexagon points */
const hexPts = (cx: number, cy: number, r: number, rot = -90) =>
  [0, 1, 2, 3, 4, 5]
    .map((k) => {
      const a = ((60 * k + rot) * Math.PI) / 180;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    })
    .join(' ');
const mono = () => css('--vfx-font-mono', 'ui-monospace, monospace');
const display = () => css('--vfx-font-display', 'Bebas Neue, sans-serif');
const label = (parent: Element, txt: string, attrs: Record<string, string | number> = {}) => {
  const t = mk('text', {
    'font-family': mono(), 'font-size': 11, 'letter-spacing': 2.2, fill: '#ffffff',
    'dominant-baseline': 'central', ...attrs,
  }, parent);
  t.textContent = txt;
  return t;
};
const SIX = () => [
  css('--ng-p-r', '#ff2d20'), css('--ng-p-m', '#ff2bd6'), css('--ng-p-g', '#00ff99'),
  css('--ng-p-c', '#00e5ff'), css('--ng-p-b', '#2a6bff'), css('--ng-p-y', '#ffe135'),
];

/* ═══ Act 5 · Brilliance · flare ═════════════════════════════
 * True black first (nothing at all), then one hexagonal pixel wakes,
 * ignites past white into an HDR bloom that floods the screen, and
 * settles: a white-hot hexagon with hard edges, and around it black that
 * is not dim but off. Its unlit neighbours are drawn black-on-black. */
export function flareVariant(): VariantImpl {
  let veil: SVGElement, halo: SVGElement[] = [], streak: SVGElement, spikes: SVGElement[] = [];
  let hex: SVGElement, hexEdge: SVGElement, hexGlow: SVGElement, cells: SVGElement[] = [];
  let lblHot: SVGElement[] = [], lblOff: SVGElement[] = [], leaders: SVGElement[] = [];
  let cellR = 0;
  const gid = uid('flare');
  return {
    opts: { lower: true, ownIgnite: true },
    build(g, c) {
      const defs = mk('defs', {}, g);
      const rg = mk('radialGradient', { id: `${gid}-h` }, defs);
      mk('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 1 }, rg);
      mk('stop', { offset: 0.18, 'stop-color': '#fffaf0', 'stop-opacity': 0.75 }, rg);
      mk('stop', { offset: 0.45, 'stop-color': '#dfe8ff', 'stop-opacity': 0.22 }, rg);
      mk('stop', { offset: 1, 'stop-color': '#dfe8ff', 'stop-opacity': 0 }, rg);
      const lg = mk('linearGradient', { id: `${gid}-s`, x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
      mk('stop', { offset: 0, 'stop-color': '#9fc4ff', 'stop-opacity': 0 }, lg);
      mk('stop', { offset: 0.5, 'stop-color': '#ffffff', 'stop-opacity': 1 }, lg);
      mk('stop', { offset: 1, 'stop-color': '#9fc4ff', 'stop-opacity': 0 }, lg);

      // the unlit neighbours: Kurocoat wells, black on black
      cellR = c.R * 0.14;
      const ring = mk('g', {}, g);
      const dx = cellR * Math.sqrt(3), dy = cellR * 1.5;
      const rows = Math.ceil(c.H / dy / 2) + 1, cols = Math.ceil(c.W / dx / 2) + 1;
      for (let r = -rows; r <= rows; r++) {
        for (let q = -cols; q <= cols; q++) {
          if (r === 0 && q === 0) continue;
          const x = c.cx + q * dx + (Math.abs(r) % 2 ? dx / 2 : 0);
          const y = c.cy + r * dy;
          const d = Math.hypot(x - c.cx, y - c.cy);
          if (d > Math.hypot(c.W, c.H) * 0.55) continue;
          const p = mk('polygon', { points: hexPts(x, y, cellR * 0.93), fill: '#000', stroke: '#1b1e25', 'stroke-width': 1 }, ring);
          (p as any).__d = d;
          cells.push(p);
        }
      }
      const add = mk('g', { class: 'tx-add' }, g);
      halo = [0, 1, 2].map(() => mk('circle', { fill: `url(#${gid}-h)` }, add));
      streak = mk('ellipse', { fill: `url(#${gid}-s)` }, add);
      for (let i = 0; i < 6; i++) spikes.push(mk('line', { stroke: '#ffffff', 'stroke-linecap': 'round' }, add));
      hexGlow = mk('polygon', { fill: '#ffffff', filter: 'url(#ng-bloom-hot)' }, add);
      hex = mk('polygon', { fill: '#ffffff' }, g);
      hexEdge = mk('polygon', { fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4, pathLength: 1, 'stroke-dasharray': 1 }, g);
      veil = mk('rect', { x: 0, y: 0, fill: '#ffffff' }, add);
      // readouts (from the Act 5 stats and the comparison table)
      const lx = c.cx + cellR * 1.6, rx = c.cx - cellR * 1.6;
      leaders.push(mk('path', { fill: 'none', stroke: '#ffffff', 'stroke-width': 0.8 }, g));
      leaders.push(mk('path', { fill: 'none', stroke: '#6b7280', 'stroke-width': 0.8 }, g));
      lblHot = [
        label(g, '4,000+ NITS', { x: lx + c.R * 0.42, y: c.cy - c.R * 0.42, 'font-size': 13 }),
        label(g, 'HIGHLIGHT · AT THE FACEPLATE', { x: lx + c.R * 0.42, y: c.cy - c.R * 0.42 + 18, fill: '#9aa3b2', 'font-size': 10 }),
      ];
      lblOff = [
        label(g, 'TRUE ZERO', { x: rx - c.R * 0.42, y: c.cy + c.R * 0.42, 'text-anchor': 'end', fill: '#9aa3b2', 'font-size': 13 }),
        label(g, 'UNSTRUCK PHOSPHOR EMITS NOTHING', { x: rx - c.R * 0.42, y: c.cy + c.R * 0.42 + 18, 'text-anchor': 'end', fill: '#5b6270', 'font-size': 10 }),
      ];
      set(leaders[0], { d: `M${c.cx + cellR * 0.9},${c.cy - cellR * 0.5} L${lx + c.R * 0.3},${c.cy - c.R * 0.42} L${lx + c.R * 0.38},${c.cy - c.R * 0.42}` });
      set(leaders[1], { d: `M${c.cx - cellR * 2.2},${c.cy + cellR * 0.9} L${rx - c.R * 0.3},${c.cy + c.R * 0.42} L${rx - c.R * 0.38},${c.cy + c.R * 0.42}` });
    },
    render(u, c, out) {
      const vis = 1 - out;
      const diag = Math.hypot(c.W, c.H);
      // 0 · absolute black. 1 · the hexagon wakes (edge traced by the beam)
      const wake = seg(u, 0.08, 0.2);
      // 2 · ignition past white
      const ig = seg(u, 0.18, 0.3);
      const peak = bell(u, 0.19, 0.46); // the blinding bloom
      // 3 · settle on true black
      const settle = easeInOut(seg(u, 0.3, 0.56));
      const r = cellR * (0.6 + 0.4 * easeOut(wake)) * (1 + 0.25 * peak);
      const pts = hexPts(c.cx, c.cy, r);
      set(hexEdge, { points: pts, 'stroke-dashoffset': 1 - easeInOut(wake), opacity: (wake > 0 ? 1 : 0) * vis * (1 - ig * 0.6) });
      set(hex, { points: pts, opacity: Math.pow(ig, 1.5) * vis });
      set(hexGlow, { points: hexPts(c.cx, c.cy, r * 1.06), opacity: Math.max(ig * 0.9, 0.35) * vis * (wake > 0 ? 1 : 0) * (0.5 + 0.5 * ig) });
      // HDR bloom: three nested halos, wide at the peak, tight once settled
      const hs = [diag * 0.9, diag * 0.45, c.R * 0.9];
      halo.forEach((h, i) => {
        const settled = [cellR * 2.2, cellR * 3.4, cellR * 5][i];
        const rr = lerp(cellR * 1.4, hs[i], expoOut(ig)) * (1 - settle) + settled * settle;
        set(h, { cx: c.cx, cy: c.cy, r: Math.max(1, rr), opacity: (ig * (1 - settle) * [0.9, 0.8, 0.9][i] + settle * [0.0, 0.18, 0.28][i]) * vis });
      });
      // anamorphic streak + six diffraction spikes (the hexagon's own aperture)
      set(streak, { cx: c.cx, cy: c.cy, rx: c.W * (0.08 + 0.55 * peak + 0.06 * settle), ry: 1.5 + 5 * peak, opacity: (ig * 0.9 * (1 - settle * 0.7)) * vis });
      spikes.forEach((s, i) => {
        const a = ((60 * i - 90) * Math.PI) / 180;
        const len = cellR * (1.2 + 9 * peak + 1.6 * settle * ig);
        set(s, {
          x1: c.cx, y1: c.cy, x2: c.cx + Math.cos(a) * len, y2: c.cy + Math.sin(a) * len,
          'stroke-width': 0.6 + 2.2 * peak, opacity: ig * (0.35 + 0.5 * peak) * vis,
        });
      });
      // blinding: the whole field floods past white, then drops to true zero
      set(veil, { width: c.W, height: c.H, opacity: Math.pow(bell(u, 0.2, 0.42), 2.2) * 0.86 * vis });
      // the unlit neighbours resolve out of the glare as black-on-black wells
      const wells = seg(u, 0.4, 0.62);
      cells.forEach((p) => {
        const d = (p as any).__d as number;
        const t = clamp01(wells * 1.6 - d / diag);
        p.setAttribute('opacity', (t * 0.9 * vis).toFixed(3));
      });
      const lb = seg(u, 0.5, 0.64) * vis;
      lblHot.forEach((t) => t.setAttribute('opacity', lb.toFixed(3)));
      lblOff.forEach((t) => t.setAttribute('opacity', (seg(u, 0.56, 0.7) * vis).toFixed(3)));
      leaders[0].setAttribute('opacity', (lb * 0.6).toFixed(3));
      leaders[1].setAttribute('opacity', (seg(u, 0.56, 0.7) * 0.6 * vis).toFixed(3));
    },
    title(u, el) {
      // the title emerges out of the glare
      const g = bell(u, 0.2, 0.46);
      el.style.textShadow = g > 0.01 ? `0 0 ${(g * 40).toFixed(0)}px rgba(255,255,255,${(g * 0.9).toFixed(2)})` : '';
    },
  };
}

/* ═══ Act 6 · Motion · whip ══════════════════════════════════
 * A whip-pan across a row of posts and a test target. On a
 * sample-and-hold panel each frame is held, so the target smears into a
 * box-blur as wide as one frame of travel. Then the raster sweeps down
 * the screen: everything above the beam is now impulse light (flash and
 * fade), razor-crisp at the same speed, with only hard-edged phosphor
 * echoes behind it. */
export function whipVariant(): VariantImpl {
  const sid = uid('whip-target');
  const clipHold = uid('whip-hold'), clipImp = uid('whip-imp');
  let holdRect: SVGElement, impRect: SVGElement, beam: SVGElement, beamGlow: SVGElement;
  let holdCopies: SVGElement[] = [], impCopies: SVGElement[] = [];
  let holdPosts: SVGElement[] = [], impPosts: SVGElement[] = [];
  let speed: SVGElement[] = [];
  let tagHold: SVGElement[] = [], tagImp: SVGElement[] = [];
  let postN = 0;
  const N = () => Math.round(14 * Math.max(0.5, budget()));
  return {
    opts: { lower: true },
    build(g, c) {
      const defs = mk('defs', {}, g);
      set(mk('rect', {}, mk('clipPath', { id: clipHold }, defs)), {});
      set(mk('rect', {}, mk('clipPath', { id: clipImp }, defs)), {});
      holdRect = defs.querySelector(`#${clipHold} rect`)!;
      impRect = defs.querySelector(`#${clipImp} rect`)!;
      // the test target: hexagonal reticle with a bar pattern, drawn once
      const sym = mk('symbol', { id: sid, viewBox: '-100 -100 200 200', overflow: 'visible' }, defs);
      mk('polygon', { points: hexPts(0, 0, 92), fill: 'none', stroke: c.tint, 'stroke-width': 4 }, sym);
      mk('polygon', { points: hexPts(0, 0, 60), fill: 'none', stroke: '#ffffff', 'stroke-width': 2 }, sym);
      for (let i = -3; i <= 3; i++) mk('rect', { x: i * 14 - 4, y: -34, width: 8, height: 68, fill: i % 2 ? c.tint : '#ffffff' }, sym);
      mk('line', { x1: -100, y1: 0, x2: -64, y2: 0, stroke: '#ffffff', 'stroke-width': 2 }, sym);
      mk('line', { x1: 64, y1: 0, x2: 100, y2: 0, stroke: '#ffffff', 'stroke-width': 2 }, sym);

      // speed lines (whip-pan streaks) live in the held half only
      const blur = uid('whip-blur');
      mk('feGaussianBlur', { stdDeviation: '10 0' }, mk('filter', { id: blur, x: '-50%', y: '-10%', width: '200%', height: '120%' }, defs));
      const hold = mk('g', { 'clip-path': `url(#${clipHold})` }, g);
      const holdBlur = mk('g', budget() >= 1 ? { filter: `url(#${blur})` } : {}, hold);
      const imp = mk('g', { 'clip-path': `url(#${clipImp})` }, g);
      const ns = Math.round(26 * Math.max(0.4, budget()));
      for (let i = 0; i < ns; i++) speed.push(mk('line', { stroke: '#ffffff', 'stroke-linecap': 'round' }, hold));
      postN = Math.ceil(c.W / (c.R * 0.5)) + 3;
      for (let i = 0; i < postN; i++) {
        holdPosts.push(mk('rect', { fill: c.tint }, hold));
        impPosts.push(mk('rect', { fill: c.tint }, imp));
      }
      const n = N();
      for (let i = 0; i < n; i++) holdCopies.push(mk('use', { href: `#${sid}` }, holdBlur));
      // impulse: the frame + three hard-edged phosphor echoes (decay)
      for (let i = 0; i < 4; i++) impCopies.push(mk('use', { href: `#${sid}` }, imp));
      impCopies.reverse(); // brightest (current frame) drawn last
      beamGlow = mk('rect', { x: 0, fill: c.tint, class: 'tx-add', filter: 'url(#ng-bloom)' }, g);
      beam = mk('rect', { x: 0, height: 2, fill: '#ffffff', class: 'tx-add' }, g);
      tagHold = [
        label(g, 'SAMPLE-AND-HOLD', { x: 28, y: c.H * 0.1, fill: '#ff6b5e', 'font-size': 12 }),
        label(g, 'EACH FRAME HELD · SMEARS', { x: 28, y: c.H * 0.1 + 18, fill: '#8a8f99', 'font-size': 10 }),
      ];
      tagImp = [
        label(g, 'IMPULSE · CRT-VR', { x: c.W - 28, y: c.H * 0.1, 'text-anchor': 'end', fill: c.tint, 'font-size': 12 }),
        label(g, 'FLASH AND FADE · ZERO SMEAR', { x: c.W - 28, y: c.H * 0.1 + 18, 'text-anchor': 'end', fill: '#8a8f99', 'font-size': 10 }),
      ];
    },
    render(u, c, out) {
      const vis = 1 - out;
      // pan: whips in from far left, still fast at the snap, brakes to rest
      const t = seg(u, 0.04, 0.66);
      const ease = (x: number) => 1 - Math.pow(1 - x, 4);
      const travel = c.W * 1.15;
      const x = c.cx - travel * (1 - ease(t));
      const v = travel * 4 * Math.pow(1 - t, 3) * (t > 0 && t < 1 ? 1 : 0); // dx/dt
      const frame = 0.055; // one held frame of travel, in t units
      const smear = Math.min(c.W * 0.7, v * frame);
      const size = c.R * 0.95;
      const y = c.cy - c.R * 0.08;
      // the raster sweep that turns the panel into impulse light
      const sw = easeInOut(seg(u, 0.34, 0.46));
      const sy = lerp(-4, c.H + 4, sw);
      set(holdRect, { x: 0, y: sy, width: c.W, height: Math.max(0, c.H - sy) });
      set(impRect, { x: 0, y: 0, width: c.W, height: Math.max(0, sy) });
      const beamOn = sw > 0 && sw < 1 ? 1 : 0;
      set(beam, { width: c.W, y: sy - 1, opacity: beamOn * vis });
      set(beamGlow, { width: c.W, y: sy - 10, height: 20, opacity: beamOn * 0.45 * vis });
      // held: box-smear, every copy the same weight (one frame held on screen)
      const n = holdCopies.length;
      const appear = seg(u, 0.02, 0.08) * vis;
      holdCopies.forEach((el, i) => {
        const xi = x - (i / Math.max(1, n - 1)) * smear;
        set(el, { x: xi - size / 2, y: y - size / 2, width: size, height: size, opacity: (1.6 / n) * appear });
      });
      // impulse: crisp frame + discrete echoes one refresh apart, decaying fast
      const step = Math.min(c.W * 0.22, v * 0.02);
      impCopies.forEach((el, i) => {
        const k = impCopies.length - 1 - i; // 0 = current frame
        set(el, { x: x - k * step - size / 2, y: y - size / 2, width: size, height: size, opacity: [1, 0.3, 0.1, 0.035][k] * vis * (k > 0 && step < 2 ? 0 : 1) });
      });
      // posts: the pan's parallax foreground
      const gap = c.R * 0.5;
      const pan = (travel * 1.4 * (1 - ease(t))) % gap;
      const ph = c.H * 0.1;
      for (let i = 0; i < postN; i++) {
        const px = i * gap - gap + pan;
        const hgt = ph * (0.6 + rnd(i, 4) * 0.8);
        const w = 3;
        const sm = Math.min(gap * 0.95, smear * 1.4);
        set(holdPosts[i], { x: px - sm, y: c.H * 0.72 - hgt, width: w + sm, height: hgt, opacity: (w / (w + sm)) * 1.6 * 0.5 * appear });
        set(impPosts[i], { x: px, y: c.H * 0.72 - hgt, width: w, height: hgt, opacity: 0.5 * appear });
      }
      // speed streaks while whipping
      const sp = clamp01(v / (travel * 2)) * appear;
      speed.forEach((s, i) => {
        const yy = c.H * rnd(i, 7);
        const len = c.W * (0.1 + rnd(i, 8) * 0.4) * sp;
        const xx = ((rnd(i, 9) * c.W * 1.4 + u * c.W * 9 * (0.6 + rnd(i))) % (c.W * 1.4)) - c.W * 0.2;
        set(s, { x1: xx, y1: yy, x2: xx - len, y2: yy, 'stroke-width': 0.5 + rnd(i, 3) * 1.2, opacity: sp * (0.08 + rnd(i, 2) * 0.22) });
      });
      const th = seg(u, 0.06, 0.14) * (1 - seg(u, 0.4, 0.48)) * vis;
      const ti = seg(u, 0.44, 0.54) * vis;
      tagHold.forEach((e) => e.setAttribute('opacity', th.toFixed(3)));
      tagImp.forEach((e) => e.setAttribute('opacity', ti.toFixed(3)));
    },
    title(u, el) {
      // the title smears with the pan, then snaps crisp with the raster
      const s = 1 - seg(u, 0.36, 0.46);
      if (s < 0.01) { el.style.textShadow = ''; el.style.transform = ''; return; }
      const w = 70 * s;
      const sh = [1, 2, 3, 4, 5, 6].map((k) => `${(-k * w / 6).toFixed(1)}px 0 0 rgba(0,255,153,${(0.22 * s).toFixed(2)})`).join(',');
      el.style.textShadow = sh;
      el.style.transform = `translateX(${(w * 0.5).toFixed(1)}px)`;
    },
  };
}

/* ═══ Act 7 · The Machine · blueprint ════════════════════════
 * Horizontal section of the per-eye side-fire tube (Sony Watchman FD
 * lineage). Parts fly in from an exploded view and draw themselves as a
 * blueprint; when the last one seats, the gun at the temple fires six
 * converged beams that graze across the inside of the dome. */
export function blueprintVariant(): VariantImpl {
  const parts: { el: SVGGElement; from: [number, number, number]; at: number; strokes: SVGElement[]; tag: SVGElement[] }[] = [];
  let root: SVGGElement, grid: SVGElement[] = [], beams: SVGElement[] = [], spot: SVGElement, lit: SVGElement;
  let lock: SVGElement, head: SVGElement[] = [];
  let phosPath: SVGPathElement;
  let six: string[] = [];
  const ink = (parent: Element, tag: string, a: Record<string, string | number>) =>
    mk(tag, { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, pathLength: 1, 'stroke-dasharray': 1, ...a }, parent);
  return {
    opts: { lower: true },
    build(g, c) {
      six = SIX();
      const gridG = mk('g', {}, g);
      const step = 48;
      for (let x = 0; x <= c.W; x += step) grid.push(mk('line', { x1: x, y1: 0, x2: x, y2: c.H, stroke: c.tint, 'stroke-width': x % (step * 4) ? 0.4 : 0.8 }, gridG));
      for (let y = 0; y <= c.H; y += step) grid.push(mk('line', { x1: 0, y1: y, x2: c.W, y2: y, stroke: c.tint, 'stroke-width': y % (step * 4) ? 0.4 : 0.8 }, gridG));
      root = mk('g', { style: `color:${c.tint}` }, g) as SVGGElement;
      const P = (from: [number, number, number], at: number, draw: (pg: SVGGElement) => SVGElement[], tag?: [string, string, number, number, string?]) => {
        const el = mk('g', {}, root) as SVGGElement;
        const strokes = draw(el);
        const t: SVGElement[] = [];
        if (tag) {
          const [a, b, x, y, anchor = 'start'] = tag;
          t.push(label(el, a.toUpperCase(), { x, y, fill: '#e6fbff', 'font-size': 13, 'text-anchor': anchor }));
          t.push(label(el, b, { x, y: y + 20, fill: c.tint, 'font-size': 11, 'letter-spacing': 1.4, 'text-anchor': anchor }));
        }
        parts.push({ el, from, at, strokes, tag: t });
      };
      // 3 · rear wafer / vacuum envelope
      P([0, -260, -4], 0.0, (pg) => [
        ink(pg, 'rect', { x: 330, y: 280, width: 860, height: 22 }),
        ink(pg, 'path', { d: 'M1176,302 L1176,474 M1190,302 L1190,476 M330,302 L330,330 M330,410 L330,476' }),
      ], ['Wafer-sealed envelope', 'anodic / frit bond under vacuum', 760, 236, 'middle']);
      // 4 · NEG getter film
      P([140, -170, 3], 0.05, (pg) => [ink(pg, 'path', { d: 'M350,312 L1160,312', 'stroke-dasharray': '0.004 0.006', 'stroke-width': 3 })],
        ['NEG getter', 'non-evaporable film', 1210, 330]);
      // 5 · QD hex phosphor screen (inner dome surface, vacuum side)
      P([0, 170, 2], 0.1, (pg) => {
        const p = ink(pg, 'path', { d: 'M340,468 Q760,388 1180,468', 'stroke-width': 2.4 });
        phosPath = p as unknown as SVGPathElement;
        const ticks: SVGElement[] = [p];
        for (let i = 1; i < 28; i++) {
          const t = i / 28;
          const x = (1 - t) * (1 - t) * 340 + 2 * (1 - t) * t * 760 + t * t * 1180;
          const y = (1 - t) * (1 - t) * 468 + 2 * (1 - t) * t * 388 + t * t * 468;
          ticks.push(ink(pg, 'path', { d: `M${x.toFixed(1)},${(y - 5).toFixed(1)} l0,10`, 'stroke-width': 0.8 }));
        }
        return ticks;
      }, ['QD hex phosphor', 'RGBMCY hexes in Kurocoat wells', 1210, 470]);
      // 6 · dome faceplate (shallow concave cap; outer face = relay E1)
      P([0, 320, -3], 0.15, (pg) => [
        ink(pg, 'path', { d: 'M330,478 Q760,398 1190,478', 'stroke-width': 1.2 }),
        ink(pg, 'path', { d: 'M330,504 Q760,424 1190,504', 'stroke-width': 2 }),
        ink(pg, 'path', { d: 'M330,478 L330,504 M1190,478 L1190,504' }),
        // dimension: 4″ active width
        ink(pg, 'path', { d: 'M360,590 L1160,590 M360,580 L360,600 M1160,580 L1160,600', 'stroke-width': 0.9 }),
      ], ['Dome faceplate', '6–8 mm concave cap · outer face = relay E1', 760, 548, 'middle']);
      // 2 · MEMS deflection plates
      P([-60, -240, 8], 0.2, (pg) => {
        const out: SVGElement[] = [];
        for (let i = 0; i < 6; i++) {
          out.push(ink(pg, 'rect', { x: 345 + i * 21, y: 336, width: 17, height: 9 }));
          out.push(ink(pg, 'rect', { x: 345 + i * 21, y: 395, width: 17, height: 9 }));
        }
        return out;
      }, ['MEMS deflection', 'segmented traveling-wave plates', 300, 180, 'end']);
      // 1 · Schottky gun at the temple
      P([-420, 30, -10], 0.25, (pg) => [
        ink(pg, 'rect', { x: 90, y: 330, width: 240, height: 80, rx: 22 }),
        ink(pg, 'path', { d: 'M100,358 L118,370 L100,382 Z' }),
        ink(pg, 'path', { d: 'M140,340 L140,360 M140,380 L140,400 M176,340 L176,360 M176,380 L176,400 M212,340 L212,360 M212,380 L212,400 M248,340 L248,360 M248,380 L248,400' }),
      ], ['Schottky ZrO/W gun', 'one assembly · six beams', 90, 450]);
      const dimT = label(root, '4″  ·  24K PER EYE', { x: 760, y: 612, 'text-anchor': 'middle', fill: c.tint, 'font-size': 12 });
      parts[3].tag.push(dimT);
      parts[3].el.appendChild(dimT);
      // live beams
      const bg = mk('g', { class: 'tx-add' }, root);
      lit = mk('path', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3.2, 'stroke-linecap': 'round', filter: 'url(#ng-bloom)', d: 'M340,468 Q760,388 1180,468', pathLength: 1 }, bg);
      six.forEach((col) => beams.push(mk('line', { stroke: col, 'stroke-width': 1.5, filter: 'url(#ng-bloom)' }, bg)));
      spot = mk('circle', { r: 7, fill: '#ffffff', filter: 'url(#ng-bloom-hot)' }, bg);
      lock = mk('rect', { x: 60, y: 160, width: 1300, height: 480, fill: 'none', stroke: c.tint, 'stroke-width': 1 }, root);
      head = [
        label(g, 'DWG CRT-VR-07 · SIDE-FIRE TUBE · ONE PER EYE', { x: 28, y: 32, fill: c.tint, 'font-size': 11 }),
        label(g, 'SONY WATCHMAN FD LINEAGE · 1982', { x: c.W - 28, y: 32, fill: '#e6fbff', 'font-size': 11, 'text-anchor': 'end' }),
      ];
    },
    render(u, c, out) {
      const vis = 1 - out;
      // fit the 1400 × 860 drawing into the upper ~72% of the screen
      // drawing content spans x 60…1360, y 160…640
      const s = Math.min((c.W * 0.84) / 1300, (c.H * 0.64) / 480);
      const ox = c.cx - 710 * s, oy = c.H * 0.41 - 400 * s;
      root.setAttribute('transform', `translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${s.toFixed(4)})`);
      root.setAttribute('opacity', vis.toFixed(3));
      const gr = seg(u, 0, 0.12) * vis;
      grid.forEach((l) => l.setAttribute('opacity', (gr * 0.12).toFixed(3)));
      head.forEach((h) => h.setAttribute('opacity', (seg(u, 0.04, 0.14) * vis).toFixed(3)));
      // exploded → assembled, staggered, each part drawing itself as it flies
      parts.forEach((p) => {
        const t = seg(u, 0.02 + p.at, 0.24 + p.at);
        const e = easeInOut(t);
        const [dx, dy, rot] = p.from;
        p.el.setAttribute('transform', `translate(${(dx * (1 - e)).toFixed(1)},${(dy * (1 - e)).toFixed(1)}) rotate(${(rot * (1 - e)).toFixed(2)} 760 420)`);
        p.el.setAttribute('opacity', Math.min(1, t * 3).toFixed(3));
        const draw = easeOut(seg(t, 0, 0.85));
        p.strokes.forEach((st) => st.setAttribute('stroke-dashoffset', (1 - draw).toFixed(4)));
        const tg = seg(u, 0.24 + p.at, 0.32 + p.at) * (1 - seg(u, 0.62, 0.72) * 0.5);
        p.tag.forEach((x) => x.setAttribute('opacity', tg.toFixed(3)));
      });
      // lock flash when the last part seats
      const lk = bell(u, 0.46, 0.56);
      set(lock, { opacity: lk * 0.7, 'stroke-width': 1 + lk * 2 });
      // fire: six converged beams graze the inside of the dome, raster sweep
      const fire = seg(u, 0.5, 0.56);
      const scan = seg(u, 0.52, 0.95);
      const sweeps = 3;
      const ph = (scan * sweeps) % 1;
      const back = Math.floor(scan * sweeps) % 2 === 1;
      const tt = 0.04 + 0.92 * (back ? 1 - ph : ph);
      let px = 760, py = 420;
      if (phosPath) {
        const L = phosPath.getTotalLength();
        const pt = phosPath.getPointAtLength(L * tt);
        px = pt.x; py = pt.y;
      }
      beams.forEach((b, i) => {
        set(b, { x1: 330, y1: 364 + i * 2.4, x2: px, y2: py, opacity: fire * (0.85 + 0.15 * Math.sin(u * 300 + i)) * vis });
      });
      set(spot, { cx: px, cy: py, opacity: fire * vis, r: 6 + 3 * fire });
      // phosphor lit behind the beam (impulse: short persistence)
      set(lit, { 'stroke-dasharray': `0.06 1`, 'stroke-dashoffset': -(tt - (back ? -0.0 : 0.06)), opacity: fire * 0.8 * vis });
    },
  };
}

/* ═══ Act 8 · Wraparound Optics · cone ═══════════════════════
 * Side section: light leaves the tube already fanned out as a cone,
 * passes the dome faceplate (element 1), and the Gaze-Cone eyepiece
 * turns the cone around so it converges into the eye. Then we step into
 * the eye: the same rays now wrap around you, sharp across ±50° and
 * carried out to 160° per eye by the Periphery Ring. */
export function coneVariant(): VariantImpl {
  let rays: SVGElement[] = [], wraps: SVGElement[] = [], lenses: SVGElement[] = [], dome: SVGElement[] = [];
  let tube: SVGElement, eye: SVGElement[] = [], arcCore: SVGElement, arcRing: SVGElement[] = [], ticks: SVGElement[] = [];
  let tags: SVGElement[] = [], wrapTags: SVGElement[] = [];
  let n = 0;
  return {
    opts: { lower: true },
    build(g, c) {
      n = Math.round(21 * Math.max(0.6, budget()));
      const side = mk('g', {}, g);
      tube = mk('path', { fill: 'none', stroke: c.tint, 'stroke-width': 1.2, opacity: 0.6 }, side);
      dome = [mk('path', { fill: 'none', stroke: c.tint, 'stroke-width': 2.2, filter: 'url(#ng-bloom)' }, side)];
      for (let i = 0; i < 2; i++) lenses.push(mk('path', { fill: 'rgba(200,246,255,0.06)', stroke: '#e8fbff', 'stroke-width': 1.4 }, side));
      const add = mk('g', { class: 'tx-add' }, g);
      for (let i = 0; i < n; i++) {
        rays.push(mk('path', { fill: 'none', stroke: i % 5 === 2 ? '#ffffff' : c.tint, 'stroke-width': 1.2, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1 }, add));
        wraps.push(mk('line', { stroke: i % 5 === 2 ? '#ffffff' : c.tint, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, add));
      }
      arcCore = mk('path', { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', filter: 'url(#ng-bloom)' }, add);
      arcRing = [0, 1].map(() => mk('path', { fill: 'none', stroke: c.tint, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': '2 6' }, add));
      for (let i = 0; i < 5; i++) ticks.push(mk('line', { stroke: '#8fa3ad', 'stroke-width': 1 }, g));
      eye = [
        mk('path', { fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4 }, g),
        mk('circle', { fill: '#000', stroke: c.tint, 'stroke-width': 1.4 }, g),
      ];
      tags = [
        label(g, 'BORN A CONE', { 'font-size': 12, fill: c.tint }),
        label(g, 'DOME FACEPLATE · ELEMENT 1', { 'font-size': 10, fill: '#9fb4bd', 'text-anchor': 'middle' }),
        label(g, 'GAZE-CONE EYEPIECE', { 'font-size': 10, fill: '#e8fbff', 'text-anchor': 'middle' }),
        label(g, 'CONE TURNED AROUND', { 'font-size': 12, fill: '#ffffff', 'text-anchor': 'end' }),
      ];
      wrapTags = [
        label(g, '±50° · SHARP ACROSS THE GAZE-CONE', { 'font-size': 11, fill: '#ffffff', 'text-anchor': 'middle' }),
        label(g, 'PERIPHERY RING · TO 160° PER EYE', { 'font-size': 11, fill: c.tint, 'text-anchor': 'middle' }),
      ];
    },
    render(u, c, out) {
      const vis = 1 - out;
      const h = Math.min(c.H * 0.27, c.W * 0.26);
      const yC = c.H * 0.42;
      const xA = c.cx - c.W * 0.32;  // cone apex, inside the tube
      const xF = c.cx - c.W * 0.16;  // dome faceplate
      const xL1 = c.cx - c.W * 0.01, xL2 = c.cx + c.W * 0.08; // eyepiece elements
      const xE = c.cx + c.W * 0.25;  // the eye
      const halfA = Math.atan2(h * 0.62, xF - xA);
      // 0 · side section; 1 · step into the eye
      const into = easeInOut(seg(u, 0.4, 0.62));
      const sideVis = (1 - into) * vis;
      const draw = easeInOut(seg(u, 0.04, 0.36));
      set(tube, { d: `M${xA - 30},${yC - 14} L${xF - 6},${yC - h * 0.8} M${xA - 30},${yC + 14} L${xF - 6},${yC + h * 0.8} M${xA - 30},${yC - 14} L${xA - 30},${yC + 14}`, opacity: 0.5 * seg(u, 0, 0.08) * sideVis });
      const dy = h * 0.82;
      set(dome[0], { d: `M${xF + 18},${yC - dy} Q${xF - 18},${yC} ${xF + 18},${yC + dy}`, opacity: seg(u, 0.02, 0.1) * sideVis });
      [xL1, xL2].forEach((x, i) => {
        const lh = h * (0.95 - i * 0.12), bw = 22 - i * 4;
        set(lenses[i], { d: `M${x},${yC - lh} Q${x + bw * 2},${yC} ${x},${yC + lh} Q${x - bw * 2},${yC} ${x},${yC - lh} Z`, opacity: seg(u, 0.06 + i * 0.03, 0.14 + i * 0.03) * sideVis });
      });
      // rays: apex → faceplate → eyepiece (bend) → converge on the eye → retina
      rays.forEach((r, i) => {
        const f = n > 1 ? i / (n - 1) * 2 - 1 : 0; // -1 … 1
        const a = f * halfA;
        const y1 = yC + Math.tan(a) * (xF - xA);
        const y2 = yC + Math.tan(a) * (xL1 - xA);
        const y3 = lerp(y2, yC, 0.55);
        const y4 = yC - (y3 - yC) * 0.35;
        const d = `M${xA},${yC} L${xF},${y1.toFixed(1)} L${xL1},${y2.toFixed(1)} L${xL2},${y3.toFixed(1)} L${xE},${yC} L${xE + 40},${y4.toFixed(1)}`;
        r.setAttribute('d', d);
        r.setAttribute('stroke-dashoffset', (1 - draw).toFixed(4));
        r.setAttribute('opacity', (seg(u, 0.03, 0.08) * (0.45 + 0.4 * rnd(i, 2)) * sideVis).toFixed(3));
      });
      // eye: moves from the end of the bench to center as we step inside
      const ex = lerp(xE, c.cx, into), ey = lerp(yC, c.H * 0.46, into);
      const es = lerp(1, 1.6, into);
      set(eye[0], { d: `M${ex + 26 * es},${ey - 18 * es} Q${ex - 8 * es},${ey} ${ex + 26 * es},${ey + 18 * es}`, opacity: seg(u, 0.1, 0.18) * vis * (1 - into) });
      set(eye[1], { cx: ex, cy: ey, r: 5 * es, opacity: seg(u, 0.1, 0.18) * vis });
      // wrap: from the eye, the same rays now surround you (160° per eye)
      const wrap = easeOut(seg(u, 0.5, 0.78));
      const RR = Math.min(c.W * 0.42, c.H * 0.4);
      const span = (80 * Math.PI) / 180;
      wraps.forEach((w, i) => {
        const f = n > 1 ? i / (n - 1) * 2 - 1 : 0;
        const a = -Math.PI / 2 + f * span * wrap; // opens around the top: in front of you
        const rr = RR * (0.25 + 0.75 * wrap);
        set(w, { x1: ex, y1: ey, x2: ex + Math.cos(a) * rr, y2: ey + Math.sin(a) * rr, opacity: seg(u, 0.48, 0.56) * (Math.abs(f) * span * 180 / Math.PI <= 50 ? 0.6 : 0.3) * vis });
      });
      const arc = (a0: number, a1: number, r: number) => {
        const p0 = [ex + Math.cos(a0) * r, ey + Math.sin(a0) * r];
        const p1 = [ex + Math.cos(a1) * r, ey + Math.sin(a1) * r];
        return `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${r},${r} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
      };
      const deg = Math.PI / 180;
      const core = 50 * deg * wrap, ring0 = 55 * deg * wrap, ring1 = 80 * deg * wrap;
      const rA = RR * (0.25 + 0.75 * wrap) + 6;
      set(arcCore, { d: arc(-Math.PI / 2 - core, -Math.PI / 2 + core, rA), opacity: seg(u, 0.52, 0.6) * vis });
      set(arcRing[0], { d: arc(-Math.PI / 2 - ring1, -Math.PI / 2 - ring0, rA), opacity: seg(u, 0.6, 0.7) * vis });
      set(arcRing[1], { d: arc(-Math.PI / 2 + ring0, -Math.PI / 2 + ring1, rA), opacity: seg(u, 0.6, 0.7) * vis });
      [-80, -50, 0, 50, 80].forEach((dg, i) => {
        const a = -Math.PI / 2 + dg * deg * wrap;
        set(ticks[i], { x1: ex + Math.cos(a) * (rA + 8), y1: ey + Math.sin(a) * (rA + 8), x2: ex + Math.cos(a) * (rA + 18), y2: ey + Math.sin(a) * (rA + 18), opacity: seg(u, 0.62, 0.7) * vis });
      });
      // labels (narrow screens keep only the two that tell the story)
      const narrow = c.W < 700 ? 0 : 1;
      set(tags[0], { x: xA - 30, y: yC + h * 0.7, opacity: seg(u, 0.08, 0.16) * sideVis * narrow });
      set(tags[1], { x: xF, y: yC - h - 30, opacity: seg(u, 0.12, 0.2) * sideVis * narrow });
      set(tags[2], { x: (xL1 + xL2) / 2, y: yC - h - 30, opacity: seg(u, 0.18, 0.26) * sideVis });
      set(tags[3], { x: xE + 40, y: yC + h * 0.7, opacity: seg(u, 0.26, 0.34) * sideVis });
      set(wrapTags[0], { x: ex, y: ey - rA - 34, opacity: seg(u, 0.62, 0.7) * vis });
      set(wrapTags[1], { x: ex, y: ey + 34, opacity: seg(u, 0.66, 0.74) * vis });
    },
  };
}

/* ═══ Act 9 · Safe on Your Face · shield ═════════════════════
 * A high-voltage arc crackles between two electrodes, then hexagonal
 * shield cells fly in and seal into a capsule around it. Sealed, the arc
 * calms to a contained glow: potted high voltage, with a fail-safe kill. */
export function shieldVariant(): VariantImpl {
  let arcs: { core: SVGElement; glow: SVGElement }[] = [], forks: SVGElement[] = [], sparks: SVGElement[] = [];
  let elec: SVGElement[] = [], cells: { el: SVGElement; x: number; y: number; a: number }[] = [];
  let capsule: SVGElement, fillE: SVGElement, sealRun: SVGElement, flash: SVGElement, tags: SVGElement[] = [];
  const ARC = '#dff1ff', GLOW = '#7fb8ff';
  return {
    opts: { lower: true },
    build(g, c) {
      const rx = c.R * 1.05, ry = c.R * 0.55;
      fillE = mk('ellipse', { fill: '#0a0f18' }, g);
      elec = [0, 1].map(() => mk('rect', { fill: '#1d2430', stroke: '#8a96a8', 'stroke-width': 1.2, rx: 3 }, g));
      const add = mk('g', { class: 'tx-add' }, g);
      for (let i = 0; i < 3; i++) {
        arcs.push({
          glow: mk('polyline', { fill: 'none', stroke: GLOW, 'stroke-width': 7, 'stroke-linejoin': 'round', filter: 'url(#ng-bloom)' }, add),
          core: mk('polyline', { fill: 'none', stroke: ARC, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, add),
        });
      }
      for (let i = 0; i < 6; i++) forks.push(mk('polyline', { fill: 'none', stroke: ARC, 'stroke-width': 1, 'stroke-linejoin': 'round' }, add));
      const ns = Math.round(40 * Math.max(0.4, budget()));
      for (let i = 0; i < ns; i++) sparks.push(mk('line', { stroke: '#ffffff', 'stroke-width': 1.2, 'stroke-linecap': 'round' }, add));
      // shield: hex cells tiled along the capsule
      const cr = c.R * 0.085;
      const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
      const k = Math.max(18, Math.round(per / (cr * 1.75)));
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2;
        const x = c.cx + Math.cos(a) * rx, y = c.cy + Math.sin(a) * ry;
        cells.push({ el: mk('polygon', { points: hexPts(0, 0, cr), fill: 'rgba(201,210,227,0.08)', stroke: c.tint, 'stroke-width': 1.3 }, g), x, y, a });
      }
      capsule = mk('ellipse', { fill: 'none', stroke: c.tint, 'stroke-width': 1.4 }, g);
      sealRun = mk('ellipse', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, pathLength: 1, 'stroke-dasharray': '0.08 1', filter: 'url(#ng-bloom)', class: 'tx-add' }, g);
      flash = mk('ellipse', { fill: '#ffffff', class: 'tx-add', filter: 'url(#ng-bloom)' }, g);
      tags = [
        label(g, 'HIGH VOLTAGE', { x: c.cx, y: c.cy - ry - c.R * 0.32, 'text-anchor': 'middle', fill: '#ffb36b', 'font-size': 12 }),
        label(g, 'SEALED AWAY · POTTED AT THE TEMPLES', { x: c.cx, y: c.cy - ry - c.R * 0.32, 'text-anchor': 'middle', fill: c.tint, 'font-size': 12 }),
        label(g, 'INSTANT FAIL-SAFE BEAM KILL', { x: c.cx, y: c.cy + ry + c.R * 0.3, 'text-anchor': 'middle', fill: '#8a96a8', 'font-size': 10 }),
      ];
    },
    render(u, c, out) {
      const vis = 1 - out;
      const rx = c.R * 1.05, ry = c.R * 0.55;
      const gap = c.R * 0.62;
      const xL = c.cx - gap, xR = c.cx + gap;
      [xL, xR].forEach((x, i) => set(elec[i], { x: i ? x : x - 18, y: c.cy - 22, width: 18, height: 44, opacity: seg(u, 0, 0.06) * vis }));
      // crackle: a new deterministic bolt every few hundredths of progress
      const live = seg(u, 0.03, 0.08);
      const seal = easeInOut(seg(u, 0.26, 0.46));
      const sealed = seg(u, 0.44, 0.5);
      const f = Math.floor(u * (sealed > 0.5 ? 60 : 160));
      const intensity = live * (1 - 0.72 * sealed) * vis;
      arcs.forEach((a, j) => {
        const pts: string[] = [];
        const segs = 14;
        const amp = c.R * (0.08 + 0.08 * j) * (1 - 0.5 * sealed);
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          const env = Math.sin(Math.PI * t);
          const x = lerp(xL, xR, t);
          const y = c.cy + (rnd(f * 17 + i, j + 1) - 0.5) * 2 * amp * env;
          pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        const flick = 0.55 + 0.45 * rnd(f, j + 9);
        a.core.setAttribute('points', pts.join(' '));
        a.glow.setAttribute('points', pts.join(' '));
        a.core.setAttribute('opacity', ((j === 0 ? 1 : 0.6) * flick * intensity).toFixed(3));
        a.glow.setAttribute('opacity', ((j === 0 ? 0.6 : 0.3) * flick * intensity).toFixed(3));
        const col = sealed > 0.5 ? c.tint : GLOW;
        a.glow.setAttribute('stroke', col);
      });
      forks.forEach((fk, j) => {
        const t0 = 0.15 + rnd(f, j + 20) * 0.7;
        const x0 = lerp(xL, xR, t0);
        const pts = [`${x0.toFixed(1)},${c.cy.toFixed(1)}`];
        let x = x0, y = c.cy;
        const dir = rnd(f, j + 30) > 0.5 ? 1 : -1;
        for (let i = 0; i < 4; i++) {
          x += (rnd(f + i, j + 40) - 0.5) * c.R * 0.18;
          y += dir * c.R * (0.05 + rnd(f + i, j + 50) * 0.08);
          pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        fk.setAttribute('points', pts.join(' '));
        fk.setAttribute('opacity', (rnd(f, j + 60) > 0.45 ? 0.7 : 0) * intensity * (1 - sealed) + '');
      });
      sparks.forEach((s, i) => {
        const life = ((u * 9 + rnd(i, 3)) % 1);
        const a = rnd(i, 4) * Math.PI * 2;
        const x0 = lerp(xL, xR, rnd(i, 5));
        const d = life * c.R * (0.3 + rnd(i, 6) * 0.6);
        // sealed: sparks stop at the shield wall
        const lim = sealed > 0.5 ? 0.0 : 1;
        set(s, { x1: x0 + Math.cos(a) * d, y1: c.cy + Math.sin(a) * d, x2: x0 + Math.cos(a) * (d + 6), y2: c.cy + Math.sin(a) * (d + 6), opacity: (1 - life) * live * lim * (1 - seal) * vis });
      });
      // the shield seals: cells fly in from outside and lock edge to edge
      cells.forEach((cl, i) => {
        const st = (i % 2 ? i : cells.length - i) / cells.length;
        const t = easeOut(seg(seal, st * 0.55, st * 0.55 + 0.45));
        const far = Math.hypot(c.W, c.H) * 0.6;
        const x = lerp(c.cx + Math.cos(cl.a) * far, cl.x, t);
        const y = lerp(c.cy + Math.sin(cl.a) * far, cl.y, t);
        cl.el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${((1 - t) * 120).toFixed(1)})`);
        cl.el.setAttribute('opacity', (Math.min(1, t * 2) * vis).toFixed(3));
      });
      set(capsule, { cx: c.cx, cy: c.cy, rx, ry, opacity: sealed * 0.8 * vis });
      set(fillE, { cx: c.cx, cy: c.cy, rx, ry, opacity: sealed * 0.85 * vis });
      const run = seg(u, 0.46, 0.62);
      set(sealRun, { cx: c.cx, cy: c.cy, rx, ry, 'stroke-dashoffset': -run, opacity: bell(u, 0.46, 0.62) * vis });
      const fl = bell(u, 0.44, 0.52);
      set(flash, { cx: c.cx, cy: c.cy, rx: rx * (0.9 + fl * 0.15), ry: ry * (0.9 + fl * 0.15), opacity: fl * 0.25 * vis });
      tags[0].setAttribute('opacity', (seg(u, 0.05, 0.12) * (1 - seg(u, 0.4, 0.46)) * vis).toFixed(3));
      tags[1].setAttribute('opacity', (seg(u, 0.5, 0.58) * vis).toFixed(3));
      tags[2].setAttribute('opacity', (seg(u, 0.56, 0.64) * vis).toFixed(3));
    },
    title(u, el) {
      // jitters while the arc is live, steady once sealed
      const j = (1 - seg(u, 0.44, 0.5)) * seg(u, 0.03, 0.08);
      const f = Math.floor(u * 160);
      el.style.transform = j > 0.01 ? `translate(${((rnd(f, 70) - 0.5) * 4 * j).toFixed(1)}px, ${((rnd(f, 71) - 0.5) * 3 * j).toFixed(1)}px)` : '';
    },
  };
}

/* ═══ Act 10 · Built to Last · timelapse ═════════════════════
 * Time-lapse over a lit phosphor field: an hours-on counter runs faster
 * and faster until it blurs (it never lands on a number), daylight sweeps
 * by, dust streams past. A static HUD starts to
 * imprint itself (burn-in), then Hexa-Index evens it out. Through all of
 * it the phosphor stays perfectly uniform. */
export function timelapseVariant(): VariantImpl {
  let cells: SVGElement[] = [], ghost: SVGGElement, sweep: SVGElement, sun: SVGElement, dust: SVGElement[] = [];
  let year: SVGElement, yearGhost: SVGElement[] = [], yearLbl: SVGElement, frame: SVGElement, scan: SVGElement, tags: SVGElement[] = [];
  const gid = uid('tl');
  let box = { x: 0, y: 0, w: 0, h: 0 };
  return {
    opts: { lower: true },
    build(g, c) {
      const defs = mk('defs', {}, g);
      const lg = mk('linearGradient', { id: `${gid}-sun`, x1: 0, x2: 1, y1: 0, y2: 0.4 }, defs);
      mk('stop', { offset: 0, 'stop-color': '#ffd9a0', 'stop-opacity': 0 }, lg);
      mk('stop', { offset: 0.5, 'stop-color': '#ffe8c4', 'stop-opacity': 0.5 }, lg);
      mk('stop', { offset: 1, 'stop-color': '#ffd9a0', 'stop-opacity': 0 }, lg);
      const clip = uid('tl-clip');
      const cp = mk('clipPath', { id: clip }, defs);
      const bw = Math.min(c.W * 0.56, c.R * 2.2), bh = Math.min(c.H * 0.3, c.R * 1.05);
      box = { x: c.cx - bw / 2, y: c.H * 0.5 - bh / 2, w: bw, h: bh };
      mk('rect', { x: box.x, y: box.y, width: bw, height: bh, rx: 10 }, cp);
      sun = mk('rect', { x: 0, y: 0, width: c.W, height: c.H, fill: '#1a1410' }, g);
      const field = mk('g', { 'clip-path': `url(#${clip})` }, g);
      mk('rect', { x: box.x, y: box.y, width: bw, height: bh, fill: c.tint, opacity: 0.9 }, field);
      const hr = Math.max(6, bh / 22);
      const dx = hr * Math.sqrt(3), dy = hr * 1.5;
      for (let r = 0; r * dy < bh + dy; r++) {
        for (let q = 0; q * dx < bw + dx; q++) {
          const x = box.x + q * dx + (r % 2 ? dx / 2 : 0), y = box.y + r * dy;
          cells.push(mk('polygon', { points: hexPts(x, y, hr * 0.98), fill: 'none', stroke: '#8c8271', 'stroke-width': 0.6, opacity: 0.35 }, field));
        }
      }
      // the would-be burn-in: a static HUD (reticle + health bar)
      ghost = mk('g', { fill: 'none', stroke: '#5f5446', 'stroke-width': hr * 0.9 }, field) as SVGGElement;
      mk('circle', { cx: c.cx, cy: box.y + bh / 2, r: bh * 0.18 }, ghost);
      mk('path', { d: `M${c.cx - bh * 0.3},${box.y + bh / 2} h${bh * 0.6} M${c.cx},${box.y + bh / 2 - bh * 0.3} v${bh * 0.6}` }, ghost);
      mk('rect', { x: box.x + bw * 0.06, y: box.y + bh * 0.78, width: bw * 0.3, height: bh * 0.08 }, ghost);
      scan = mk('rect', { x: box.x, width: bw, height: 3, fill: '#ffffff', filter: 'url(#ng-bloom)' }, field);
      sweep = mk('rect', { y: -c.H * 0.2, height: c.H * 1.4, fill: `url(#${gid}-sun)`, class: 'tx-add' }, g);
      frame = mk('rect', { x: box.x, y: box.y, width: bw, height: bh, rx: 10, fill: 'none', stroke: c.tint, 'stroke-width': 1.2 }, g);
      const nd = Math.round(70 * Math.max(0.4, budget()));
      for (let i = 0; i < nd; i++) dust.push(mk('line', { stroke: '#e9dcc5', 'stroke-linecap': 'round' }, g));
      const fs = Math.min(c.H * 0.12, 104);
      const ty = { x: c.cx, y: box.y - fs * 0.62, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': display(), 'font-size': fs, 'letter-spacing': 4 };
      // odometer blur: two ghost copies trail the digits as the count speeds up
      yearGhost = [0, 1].map(() => mk('text', { ...ty, fill: c.tint }, g));
      year = mk('text', { ...ty, fill: c.tint }, g);
      yearLbl = label(g, 'HOURS ON', { x: c.cx, y: box.y - fs * 1.3 - 6, 'text-anchor': 'middle', fill: '#9b9282', 'font-size': 11, 'letter-spacing': 6 });
      tags = [
        label(g, 'BURN-IN · DETECTED', { x: box.x, y: box.y + bh + 22, fill: '#c98b5a', 'font-size': 11 }),
        label(g, 'HEXA-INDEX · EVENED OUT', { x: box.x, y: box.y + bh + 22, fill: c.tint, 'font-size': 11 }),
        label(g, 'UNIFORM · EVERY SUBPIXEL', { x: box.x + bw, y: box.y + bh + 22, fill: '#9b9282', 'font-size': 11, 'text-anchor': 'end' }),
      ];
    },
    render(u, c, out) {
      const vis = 1 - out;
      const t = seg(u, 0.06, 0.8);
      // time accelerates: days blur into years. The counter never lands:
      // it keeps running through the hand-off and fades out still counting.
      const tt = Math.pow(t, 1.6);
      const run = tt + out * 0.6;
      const hours = Math.floor(Math.pow(run, 2.4) * 150000 + run * 2400);
      const fmt = (h: number) => Math.max(0, h).toLocaleString('en-US');
      year.textContent = fmt(hours);
      const show = seg(u, 0.02, 0.1) * vis;
      const blur = clamp01(tt * 1.4);
      year.setAttribute('opacity', (show * (1 - blur * 0.45)).toFixed(3));
      yearGhost.forEach((gh, i) => {
        gh.textContent = fmt(hours - Math.round((i + 1) * 997 * blur * blur * 40));
        set(gh, { transform: `translate(0, ${(-(i + 1) * 10 * blur).toFixed(1)})`, opacity: show * blur * (i ? 0.12 : 0.25) });
      });
      // fades out still counting, as the next act powers on
      yearLbl.setAttribute('opacity', show.toFixed(3));
      frame.setAttribute('opacity', (show * 0.7).toFixed(3));
      // day/night: ambient room light pulses, faster as time speeds up
      const days = tt * 40;
      const day = 0.5 + 0.5 * Math.sin(days * Math.PI * 2);
      sun.setAttribute('opacity', (day * 0.55 * show).toFixed(3));
      const sx = ((days % 1) * 1.6 - 0.3) * c.W;
      set(sweep, { x: sx - c.W * 0.25, width: c.W * 0.5, opacity: (0.25 + 0.5 * (1 - t)) * day * show });
      // dust streams faster and faster
      dust.forEach((d, i) => {
        const sp = 0.4 + rnd(i, 2) * 0.8;
        const xx = ((rnd(i, 3) + tt * 12 * sp) % 1) * (c.W + 200) - 100;
        const yy = c.H * (0.05 + rnd(i, 4) * 0.9) + Math.sin(tt * 30 * sp + i) * 20;
        const len = 1 + tt * 40 * sp;
        set(d, { x1: xx, y1: yy, x2: xx - len, y2: yy, 'stroke-width': 0.6 + rnd(i, 5) * 1.4, opacity: (0.15 + rnd(i, 6) * 0.35) * show });
      });
      // burn-in tries to imprint, Hexa-Index evens it out
      const imprint = seg(u, 0.14, 0.4);
      const fix = easeInOut(seg(u, 0.4, 0.52));
      ghost.setAttribute('opacity', (imprint * 0.38 * (1 - fix) * vis).toFixed(3));
      set(scan, { y: lerp(box.y - 4, box.y + box.h + 4, fix), opacity: bell(u, 0.4, 0.52) * vis });
      tags[0].setAttribute('opacity', (seg(u, 0.26, 0.34) * (1 - seg(u, 0.42, 0.48)) * vis).toFixed(3));
      tags[1].setAttribute('opacity', (seg(u, 0.48, 0.56) * vis).toFixed(3));
      tags[2].setAttribute('opacity', (seg(u, 0.56, 0.64) * vis).toFixed(3));
    },
  };
}

/* ═══ Act 11 · Certified · seals ═════════════════════════════
 * Certification seals stamp in one after another, each landing with a
 * shock ring and a kick, then a shimmer runs across the whole set. */
export function sealsVariant(labels: string[]): VariantImpl {
  const items = labels.length ? labels : ['Certified'];
  let seals: { g: SVGGElement; ring: SVGElement; x: number; y: number; r: number; shock: SVGElement }[] = [];
  let root: SVGGElement, shine: SVGElement, shineClip: SVGElement;
  const gid = uid('seal');
  return {
    opts: { lower: true },
    build(g, c) {
      const defs = mk('defs', {}, g);
      const lg = mk('linearGradient', { id: `${gid}-sh`, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      mk('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 0 }, lg);
      mk('stop', { offset: 0.5, 'stop-color': '#ffffff', 'stop-opacity': 0.75 }, lg);
      mk('stop', { offset: 1, 'stop-color': '#ffffff', 'stop-opacity': 0 }, lg);
      shineClip = mk('clipPath', { id: `${gid}-clip` }, defs);
      root = mk('g', {}, g) as SVGGElement;
      const n = items.length;
      const cols = c.W > c.H * 1.2 ? Math.ceil(n / 2) : 3;
      const rows = Math.ceil(n / cols);
      const top = c.H * 0.08, bot = c.H * 0.7;
      const cellW = (c.W * (cols > 3 ? 0.72 : 0.92)) / cols, cellH = (bot - top) / rows;
      const r = Math.min(cellW, cellH) * 0.36;
      items.forEach((txt, i) => {
        const row = Math.floor(i / cols);
        const inRow = Math.min(cols, n - row * cols);
        const col = i - row * cols;
        const x = c.cx + (col - (inRow - 1) / 2) * cellW;
        const y = top + (row + 0.5) * cellH;
        const sg = mk('g', {}, root) as SVGGElement;
        mk('circle', { r, fill: '#0b0d12', stroke: c.tint, 'stroke-width': 2 }, sg);
        const ring = mk('circle', { r: r * 0.8, fill: 'none', stroke: c.tint, 'stroke-width': 0.8, 'stroke-dasharray': '2 3' }, sg);
        for (let k = 0; k < 24; k++) {
          const a = (k / 24) * Math.PI * 2;
          mk('line', { x1: Math.cos(a) * r, y1: Math.sin(a) * r, x2: Math.cos(a) * r * 1.07, y2: Math.sin(a) * r * 1.07, stroke: c.tint, 'stroke-width': 1.4 }, sg);
        }
        const pid = `${gid}-p${i}`;
        const rr = r * 0.66;
        mk('path', { id: pid, d: `M${-rr},0 A${rr},${rr} 0 1 1 ${rr},0 A${rr},${rr} 0 1 1 ${-rr},0`, fill: 'none' }, sg);
        const t = mk('text', { 'font-family': mono(), 'font-size': Math.max(7, r * 0.13), fill: '#e4e8f0', 'letter-spacing': 1 }, sg);
        const tp = mk('textPath', { href: `#${pid}`, startOffset: '0', textLength: (2 * Math.PI * rr * 0.94).toFixed(1), lengthAdjust: 'spacingAndGlyphs' }, t);
        tp.textContent = txt.toUpperCase() + ' · ';
        // center: hexagon with a check
        mk('polygon', { points: hexPts(0, 0, r * 0.34), fill: 'none', stroke: '#ffffff', 'stroke-width': 1.6 }, sg);
        mk('path', { d: `M${-r * 0.14},${r * 0.01} L${-r * 0.03},${r * 0.12} L${r * 0.16},${-r * 0.12}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sg);
        const shock = mk('circle', { cx: x, cy: y, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.5, class: 'tx-add' }, g);
        mk('circle', { cx: x, cy: y, r }, shineClip);
        seals.push({ g: sg, ring, x, y, r, shock });
      });
      shine = mk('rect', { y: 0, height: c.H, fill: `url(#${gid}-sh)`, 'clip-path': `url(#${gid}-clip)`, class: 'tx-add' }, g);
    },
    render(u, c, out) {
      const vis = 1 - out;
      const n = seals.length;
      let kick = 0;
      seals.forEach((s, i) => {
        const a = 0.04 + (i / n) * 0.36;
        const t = seg(u, a, a + 0.06);
        // falls toward the page (big and soft) and lands with a bounce
        const land = t < 1 ? Math.pow(t, 2.2) : 1;
        const sc = lerp(2.4, 1, land) * (1 + 0.06 * bell(u, a + 0.06, a + 0.1));
        s.g.setAttribute('transform', `translate(${s.x.toFixed(1)},${s.y.toFixed(1)}) scale(${sc.toFixed(3)}) rotate(${((1 - land) * -18).toFixed(1)})`);
        s.g.setAttribute('opacity', (Math.min(1, t * 2.5) * vis).toFixed(3));
        s.ring.setAttribute('transform', `rotate(${(u * 120).toFixed(1)})`);
        const sh = seg(u, a + 0.055, a + 0.14);
        set(s.shock, { r: s.r * (1 + sh * 0.9), opacity: (sh > 0 && sh < 1 ? 1 - sh : 0) * 0.8 * vis, 'stroke-width': 0.5 + 2.5 * (1 - sh) });
        kick = Math.max(kick, bell(u, a + 0.055, a + 0.08));
      });
      // every landing kicks the whole set a little
      root.setAttribute('transform', `translate(0, ${(kick * 4).toFixed(2)})`);
      const s = seg(u, 0.44, 0.66);
      set(shine, { x: lerp(-c.W * 0.3, c.W * 1.05, easeInOut(s)), width: c.W * 0.25, opacity: (s > 0 && s < 1 ? 1 : 0) * vis });
    },
    title(u, el) {
      // the title gets the same shimmer pass
      const s = bell(u, 0.5, 0.72);
      el.style.textShadow = s > 0.01 ? `0 0 ${(s * 24).toFixed(0)}px rgba(255,255,255,${(s * 0.8).toFixed(2)})` : '';
    },
  };
}

/* ═══ Act 12 · Proof · race ══════════════════════════════════
 * Refresh-rate bars race up a chart. The flat panels stall where they
 * are; CRT-VR keeps climbing, smashes the top of the chart and counts on
 * past 3,000 Hz (whole-screen refresh, most aggressive motion-adaptive setting, Act 3). */
export const RACE = [
  { name: 'MICROOLED', hz: 120, note: 'typical' },
  { name: 'OLED', hz: 240, note: 'up to' },
  { name: 'CRT-VR', hz: 3000, note: 'and past', hero: true },
];
export function raceVariant(): VariantImpl {
  const MAX = 600; // chart ceiling, Hz
  let bars: SVGElement[] = [], caps: SVGElement[] = [], vals: SVGElement[] = [], names: SVGElement[] = [];
  let axis: SVGElement, grid: SVGElement[] = [], gridLbl: SVGElement[] = [], topL: SVGElement[] = [], shards: SVGElement[] = [];
  let flash: SVGElement, trail: SVGElement, unit: SVGElement, heroGlow: SVGElement;
  return {
    opts: { lower: true },
    build(g, c) {
      axis = mk('line', { stroke: '#8a93a6', 'stroke-width': 1 }, g);
      for (let i = 1; i <= 3; i++) {
        grid.push(mk('line', { stroke: '#2a303c', 'stroke-width': 1, 'stroke-dasharray': '3 5' }, g));
        gridLbl.push(label(g, `${(MAX / 4) * i}`, { fill: '#5b6372', 'font-size': 10, 'text-anchor': 'end' }));
      }
      // the chart ceiling, in pieces so it can shatter
      for (let i = 0; i < 24; i++) topL.push(mk('line', { stroke: '#c7cfdd', 'stroke-width': 1.6 }, g));
      gridLbl.push(label(g, `${MAX} HZ`, { fill: '#c7cfdd', 'font-size': 10, 'text-anchor': 'end' }));
      const add = mk('g', { class: 'tx-add' }, g);
      trail = mk('rect', { fill: c.tint, opacity: 0, filter: 'url(#ng-bloom)' }, add);
      RACE.forEach((b) => {
        bars.push(mk('rect', { fill: b.hero ? '#ffffff' : '#4a5263' }, b.hero ? add : g));
        caps.push(mk('rect', { fill: b.hero ? c.tint : '#9aa3b4' }, b.hero ? add : g));
        vals.push(mk('text', { 'font-family': display(), 'font-size': b.hero ? 54 : 30, fill: b.hero ? '#ffffff' : '#aeb6c6', 'text-anchor': 'middle', 'letter-spacing': 1 }, g));
        names.push(label(g, b.name, { fill: b.hero ? c.tint : '#8a93a6', 'font-size': 11, 'text-anchor': 'middle' }));
      });
      heroGlow = mk('rect', { fill: c.tint, filter: 'url(#ng-bloom-hot)', class: 'tx-add' }, g);
      const ns = Math.round(28 * Math.max(0.4, budget()));
      for (let i = 0; i < ns; i++) shards.push(mk('line', { stroke: '#ffffff', 'stroke-width': 1.6, 'stroke-linecap': 'round', class: 'tx-add' }, g));
      flash = mk('circle', { fill: '#ffffff', filter: 'url(#ng-bloom)', class: 'tx-add' }, g);
      unit = label(g, 'WHOLE-SCREEN REFRESH · HZ', { fill: '#8a93a6', 'font-size': 10 });
    },
    render(u, c, out) {
      const vis = 1 - out;
      const base = c.H * 0.68, top = c.H * 0.2;
      const span = base - top;
      const cw = Math.min(c.W * 0.7, 760);
      const x0 = c.cx - cw / 2;
      const show = seg(u, 0.02, 0.08) * vis;
      set(axis, { x1: x0, x2: x0 + cw, y1: base, y2: base, opacity: show });
      grid.forEach((l, i) => {
        const y = base - span * ((i + 1) / 4);
        set(l, { x1: x0, x2: x0 + cw, y1: y, y2: y, opacity: show * 0.8 });
        set(gridLbl[i], { x: x0 - 10, y, opacity: show * 0.8 });
      });
      set(gridLbl[3], { x: x0 - 10, y: top, opacity: show * (1 - seg(u, 0.36, 0.42)) });
      set(unit, { x: x0, y: base + 44, opacity: show * 0.8 });
      // the race
      const bw = Math.min(90, cw / 6);
      const brk = 0.36; // CRT-VR hits the ceiling
      let heroTop = base;
      RACE.forEach((b, i) => {
        const x = x0 + cw * ((i + 0.5) / RACE.length);
        let hz: number, h: number;
        if (!b.hero) {
          const t = seg(u, 0.06, 0.3 + i * 0.04);
          const e = 1 - Math.pow(1 - t, 3);
          const over = 1 + 0.05 * Math.sin(seg(u, 0.3, 0.4) * Math.PI) * (t >= 1 ? 1 : 0);
          hz = b.hz * e * over;
          h = (hz / MAX) * span;
        } else {
          const t = seg(u, 0.06, brk);
          const climb = Math.pow(t, 1.7) * MAX;
          const past = seg(u, brk, 0.46); // lands on 3,000+ by the poster frame
          hz = t < 1 ? climb : lerp(MAX, b.hz, easeOut(past));
          // past the ceiling the bar keeps going right off the screen
          h = t < 1 ? (climb / MAX) * span : span + (top + 40) * easeOut(seg(u, brk, 0.5));
          heroTop = base - h;
        }
        set(bars[i], { x: x - bw / 2, y: base - h, width: bw, height: Math.max(0, h), opacity: show * (b.hero ? 0.92 : 1) });
        set(caps[i], { x: x - bw / 2, y: base - h - 3, width: bw, height: 3, opacity: show * (h > 1 ? 1 : 0) });
        const label = b.hero && u >= 0.46 ? `${Math.round(hz).toLocaleString('en-US')}+` : Math.round(hz).toLocaleString('en-US');
        vals[i].textContent = label;
        const vy = b.hero ? Math.max(top + 70, base - h - 16) : base - h - 14;
        set(vals[i], { x: b.hero && u > brk ? x : x, y: b.hero && u > brk ? top + 70 + 0 : vy, opacity: show });
        set(names[i], { x, y: base + 20, opacity: show });
        if (b.hero) {
          set(heroGlow, { x: x - bw / 2 - 6, y: base - h, width: bw + 12, height: Math.max(0, h), opacity: show * 0.25 * seg(u, 0.2, brk) });
          set(trail, { x: x - bw / 2, y: base - h, width: bw, height: Math.max(0, h), opacity: show * 0.3 * seg(u, brk - 0.02, brk + 0.04) });
          // value rides beside the bar; on narrow screens it sits to its left
          const roomR = c.W - (x + bw / 2) > 150;
          if (u > brk) set(vals[i], { x: roomR ? x + bw / 2 + 18 : x - bw / 2 - 12, y: top + 70, 'text-anchor': roomR ? 'start' : 'end' });
          else vals[i].setAttribute('text-anchor', 'middle');
        }
      });
      // the ceiling shatters where the bar punches through
      const hx = x0 + cw * ((RACE.length - 0.5) / RACE.length);
      const sh = seg(u, brk, brk + 0.18);
      topL.forEach((l, i) => {
        const a = x0 + (cw * i) / topL.length, b2 = x0 + (cw * (i + 1)) / topL.length - 2;
        const mid = (a + b2) / 2;
        const near = Math.max(0, 1 - Math.abs(mid - hx) / (cw * 0.35));
        const fly = easeOut(sh) * near;
        const ang = (rnd(i, 3) - 0.5) * 2.4 * fly;
        const dx = (mid - hx) * 0.6 * fly, dy = -c.H * 0.25 * fly * (0.5 + rnd(i, 4));
        const hl = (b2 - a) / 2;
        set(l, {
          x1: mid + dx - Math.cos(ang) * hl, y1: top + dy - Math.sin(ang) * hl,
          x2: mid + dx + Math.cos(ang) * hl, y2: top + dy + Math.sin(ang) * hl,
          opacity: show * (1 - sh * near * 0.9),
        });
      });
      shards.forEach((s, i) => {
        const a = -Math.PI / 2 + (rnd(i, 5) - 0.5) * 2.2;
        const d = easeOut(sh) * c.R * (0.4 + rnd(i, 6) * 1.1);
        const x = hx + (rnd(i, 7) - 0.5) * bw;
        set(s, { x1: x + Math.cos(a) * d, y1: top + Math.sin(a) * d, x2: x + Math.cos(a) * (d + 8 + 10 * rnd(i)), y2: top + Math.sin(a) * (d + 8 + 10 * rnd(i)), opacity: (sh > 0 && sh < 1 ? 1 - sh : 0) * vis });
      });
      const fl = bell(u, brk - 0.01, brk + 0.08);
      set(flash, { cx: hx, cy: top, r: c.R * (0.1 + 0.5 * fl), opacity: fl * 0.7 * vis });
      void heroTop; void smooth;
    },
  };
}

export const BESPOKE: Record<string, (labels: string[]) => VariantImpl> = {
  flare: () => flareVariant(),
  whip: () => whipVariant(),
  blueprint: () => blueprintVariant(),
  cone: () => coneVariant(),
  shield: () => shieldVariant(),
  timelapse: () => timelapseVariant(),
  seals: (l) => sealsVariant(l),
  race: () => raceVariant(),
};
