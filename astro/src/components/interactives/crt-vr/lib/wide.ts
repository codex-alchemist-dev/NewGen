/** Widen a slot out of the narrow text column to its act's content width. */
export function widen(root: HTMLElement): () => void {
  const box = (root.closest('.act__inner') as HTMLElement | null) ?? root.parentElement!;
  const fit = () => {
    root.style.setProperty('--wide-x', '0px');
    root.style.setProperty('--wide-w', '100%');
    const b = box.getBoundingClientRect(), r = root.getBoundingClientRect();
    root.style.setProperty('--wide-w', `${b.width}px`);
    root.style.setProperty('--wide-x', `${b.left - r.left}px`);
  };
  fit();
  window.addEventListener('resize', fit);
  return () => window.removeEventListener('resize', fit);
}

/** Runs fn once when el first comes into view (threshold of its height). */
export function onceVisible(el: Element, fn: () => void, threshold = 0.3): void {
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { threshold });
  io.observe(el);
}

/** Visibility-gated rAF loop. Returns controls. */
export function rafLoop(el: Element, tick: (dt: number, t: number) => void) {
  let raf = 0, last = 0, visible = false, enabled = true;
  const frame = (t: number) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    tick(dt, t / 1000);
    if (visible && enabled) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf && visible && enabled) { last = 0; raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { rootMargin: '10% 0px' });
  io.observe(el);
  return {
    set enabled(v: boolean) { enabled = v; if (v) start(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    get enabled() { return enabled; },
  };
}

/** Canvas sized to its CSS box at devicePixelRatio (capped). */
export function fitCanvas(c: HTMLCanvasElement, maxDpr = 2) {
  const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
  const r = c.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return { w, h, dpr, cssW: r.width, cssH: r.height };
}
