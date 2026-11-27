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

| `ContributionMap.astro` | `contribution-map` | "Built by NewGen" flow: Sony (tube, color, glass), Intel Eventide (iDP link, scan silicon), Lightmatter (photonic interconnect) → CRT-VR → launch partners ShallXR and Play For Dream (customers). Light flows on the lines; hover a member to isolate it. Stacked list under 640px. Text only. |

## Act 11 · Certified

| Component | Slot | What it is |
|---|---|---|
| `CertBadgeWall.astro` | `badge-wall` section (`kind: 'badges'`) | Original text-only badge tiles (no certifier logos): category word, cert name, foil rim. Staggered rise, shimmer sweep, drifting foil and pointer light in full tier. |

Shared: `tokens.css` (aliases shell tokens, fonts stay swappable), `lib/scrub.ts`
(timeline math + rAF scroll scrub), `lib/tier.ts` (adapter over the shell's
`vfxQuality` store, plus a `?vfx=full|reduced|static` QA override).

### Quality tiers

- **full**: SVG glow filters, photon flow along the rays, canvas sprite glow, idle shimmer and refresh sweep, full beam raster.
- **reduced**: no filters, fewer canvas cells, redraw on scroll only, stats trace + fade.
- **static** (and `prefers-reduced-motion`): no scrubbing. The hero shows one composed frame with all three lines, the background is a CSS still, the stats are drawn.

All three copy lines, captions and figures are real HTML/SVG text.

## Act 4 · RGBMCY

| Component | Slot | What it is |
|---|---|---|
| `GamutInnovations.astro` | `gamut-innovations` section | Four plates: QD lines (~20 nm) vs phosphor (~40–100 nm), Resonant Wells (schematic), per-subpixel dichroic trim (schematic), zero cross-talk (< −30 dB, labeled as a target). Spectra come from the interactives' colour model. |

## Act 7 · The Machine

| Component | Slot | What it is |
|---|---|---|
| `BlueprintBackground.astro` | `act-07/background` | Cyan drafting sheet: minor/major grid, zone letters, registration marks, title block, slow plotter sweep. Mounted through ActWrapper's `background` slot. |

The Act 7 interactives live in `interactives/crt-vr/` (see its README).
