/** Small, dependency-free helpers for scroll-scrubbed timelines. */

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Local 0..1 progress of p inside the window [a, b]. */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

/** Rises over [a,b], holds, falls over [c,d]. Good for "on screen during this beat". */
export const window4 = (p: number, a: number, b: number, c: number, d: number) =>
  Math.min(seg(p, a, b), 1 - seg(p, c, d));

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Scroll progress of a tall "scroller" element whose child is position:sticky.
 * 0 when its top hits the viewport top, 1 when its bottom hits the viewport bottom.
 */
export function stickyProgress(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  if (span <= 0) return r.top <= 0 ? 1 : 0;
  return clamp(-r.top / span);
}

/** Progress of an element travelling through the viewport: 0 when its top enters the bottom edge, 1 when its bottom leaves the top. */
export function passProgress(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return clamp((vh - r.top) / (r.height + vh));
}

/**
 * Drives `render(p)` on scroll/resize with rAF batching and gentle smoothing
 * (so wheel steps feel like a film scrub, not a slideshow).
 * Only runs while the element is near the viewport.
 */
export function scrubLoop(
  el: HTMLElement,
  measure: (el: HTMLElement) => number,
  render: (p: number) => void,
  opts: { smoothing?: number } = {},
): () => void {
  const k = opts.smoothing ?? 0.18; // 1 = no smoothing
  let target = measure(el);
  let shown = target;
  let raf = 0;
  let visible = true;

  const frame = () => {
    raf = 0;
    shown += (target - shown) * k;
    if (Math.abs(target - shown) < 0.0004) shown = target;
    render(shown);
    if (shown !== target) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    target = measure(el);
    if (!raf && visible) raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver(
    ([e]) => { visible = e.isIntersecting; if (visible) kick(); },
    { rootMargin: '25% 0px 25% 0px' },
  );
  io.observe(el);
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  render(shown);

  return () => {
    io.disconnect();
    window.removeEventListener('scroll', kick);
    window.removeEventListener('resize', kick);
    if (raf) cancelAnimationFrame(raf);
  };
}
