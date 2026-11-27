# visuals/crt-vr/

Page visuals and animatics (SVG, illustrations, scroll animations). Built by Opus 5.5 threads only.
Name each file after its slot id, for example `HeroAnimatic.astro` for `hero-animatic`.
See `astro/README.md` for the slot contract.

## Act 1 · The Hook

| Component | Slot | What it is |
|---|---|---|
| `HeroAnimatic.astro` | `hero-animatic` | Scroll-scrubbed SVG film "Ahead of its time" (≈8 screens). 1950s glow → Trinitron → Watchman → BVM → flat-panel takeover → the tube returns (6 converged RGBMCY beams) → side-fire tubes in a headset → the eye, light wrapping 180°+ → hero line. HTML copy is word-synced to the beats. |
| `HookBackground.astro` | `act-01/background` | Canvas power-on bloom (dot → line → raster) that opens into a wraparound 40° → 180°+ field. Mount it anywhere in Act 1: it moves itself into the closest `.act` and starts after the hero animatic. Ready for the VFX thread's ActBackground system. |
| `RevealStats.astro` | `the-reveal` stats | Six giant figures drawn by a beam: vector trace → raster fill with a moving beam spot → phosphor decay → label types in. `items` prop takes `{ value, unit?, label, color? }` (`color: 'six'` = RGBMCY gradient). |

Shared: `tokens.css` (aliases shell tokens, fonts stay swappable), `lib/scrub.ts`
(timeline math + rAF scroll scrub), `lib/tier.ts` (adapter over the shell's
`vfxQuality` store, plus a `?vfx=full|reduced|static` QA override).

### Quality tiers

- **full**: SVG glow filters, photon flow along the rays, canvas sprite glow, idle shimmer and refresh sweep, full beam raster.
- **reduced**: no filters, fewer canvas cells, redraw on scroll only, stats trace + fade.
- **static** (and `prefers-reduced-motion`): no scrubbing. The hero shows one composed frame with all three lines, the background is a CSS still, the stats are drawn.

All three copy lines, captions and figures are real HTML/SVG text.

## Act 8 · Wraparound Optics

| Component | Section | What it is |
|---|---|---|
| `PupilSwim.astro` | `pupil-swim-correction` | Eye turns, the pupil shifts; correction off makes the view wobble, on holds it still. Static tier shows a held frame. |
| `GlareControl.astro` | `glare-and-ghost-control` | Barrel cross-section: bare walls bounce stray light into the eye and lift black; Kurocoat lining and baffles absorb it. |
