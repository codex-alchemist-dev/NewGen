import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

/*
 * Lenis inertia scroll driven by the GSAP ticker, with ScrollTrigger kept in
 * sync. Not started under prefers-reduced-motion: native scroll is used.
 */
export function startSmoothScroll(reducedMotion: boolean): () => void {
  if (reducedMotion) return () => {};

  const lenis = new Lenis({
    duration: 1.2,
    // Expo-out style curve for wheel inertia. The CSS token --ease-newgen is
    // the shared curve for CSS/GSAP tweens; Lenis takes a plain function.
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
