/**
 * One shared loop for every [data-reveal] / [data-parallax] element.
 * Values are a pure function of where the element sits in the viewport,
 * then damped per element, so motion is continuous both ways.
 */
import { ready, clamp01, smooth } from './motion';
import { getTier } from './quality';

type Item = { el: HTMLElement; kind: 'reveal' | 'parallax'; delay: number; speed: number; v: number; y: number };

let started = false;

export function initSectionMotion() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const { gsap } = ready();
  let items: Item[] = [];
  const collect = () => {
    // Auto-enhance the kit: act titles and every section's children drift in
    // with a gentle stagger. Anything else can opt in with [data-reveal].
    document.querySelectorAll<HTMLElement>('.act-title, .section').forEach((group) => {
      [...group.children].forEach((child, i) => {
        const el = child as HTMLElement;
        if (el.matches('.section__body')) {
          [...el.children].forEach((c, j) => {
            const ce = c as HTMLElement;
            if (!ce.hasAttribute('data-reveal')) ce.dataset.reveal = '';
            if (!ce.dataset.revealDelay) ce.dataset.revealDelay = String(Math.min(3, i + j) * 0.5);
          });
          return;
        }
        if (!el.hasAttribute('data-reveal')) el.dataset.reveal = '';
        if (!el.dataset.revealDelay) el.dataset.revealDelay = String(Math.min(3, i) * 0.5);
      });
    });
    const seen = new Set(items.map((i) => i.el));
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      if (seen.has(el)) return;
      items.push({ el, kind: 'reveal', delay: parseFloat(el.dataset.revealDelay || '0'), speed: 0, v: -1, y: 0 });
    });
    document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      if (seen.has(el)) return;
      items.push({ el, kind: 'parallax', delay: 0, speed: parseFloat(el.dataset.parallax || '0.15'), v: 0, y: 0 });
    });
  };
  collect();
  document.addEventListener('astro:page-load', collect);

  let lastT = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (getTier() === 'static') return;
    const H = innerHeight;
    const k = 1 - Math.exp(-dt * 7); // per-element damping on top of Lenis
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      if (r.bottom < -H * 0.5 || r.top > H * 1.5) continue;
      if (it.kind === 'reveal') {
        // enter: top travels 96% → 58% of viewport. exit: bottom travels 26% → -4%.
        const d = it.delay * 0.08;
        const enter = smooth(clamp01((H * (0.96 - d) - r.top) / (H * 0.38)));
        const exit = smooth(clamp01((H * 0.26 - r.bottom) / (H * 0.3)));
        if (it.v < 0) { it.v = enter; it.y = exit; } // first sight: no catch-up animation
        it.v += (enter - it.v) * k;
        it.y += (exit - it.y) * k;
        const inV = it.v;
        const outV = it.y;
        const op = inV * (1 - outV * 0.92);
        const y = (1 - inV) * 70 - outV * 46;
        const blur = (1 - inV) * 10 + outV * 6;
        it.el.style.opacity = op.toFixed(3);
        it.el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        it.el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : 'none';
      } else {
        const center = r.top + r.height / 2 - H / 2;
        const ty = -center * it.speed;
        it.y += (ty - it.y) * k;
        it.el.style.transform = `translate3d(0, ${it.y.toFixed(2)}px, 0)`;
      }
    }
  });
}
