# vfx/

Global VFX, section transitions and the per-act transition and background
slots. Built by the Opus 5.5 VFX threads only. Components take `VfxSlotProps`
from `src/lib/motion/types.ts`; the tier is read at runtime from the shared
store, so props are optional.

## Drop-in

```astro
---
import GlobalVfx from '../components/vfx/GlobalVfx.astro';
---
<GlobalVfx />   <!-- once, directly in <body> (not inside <VfxLayer>) -->
```

`ActWrapper` already wires each act: pass `title` and it renders
`ActTransition` (variant from `transition`) and `ActBackground` (scene + tint
from `act-looks.ts`). Without `title`, the transition slot stays a placeholder.

A custom per-act background (e.g. `visuals/crt-vr/HookBackground.astro`) goes
in ActWrapper's `background` named slot:

```astro
<ActWrapper id="hook" number={1} transition="default" title="The Hook">
  <HookBackground slot="background" />
  ...
</ActWrapper>
```

It is shown in a fixed full-viewport layer behind the act's content that
crossfades in and out with the act, over the built-in backdrop. The layer sets
`--act-progress` (0..1) and fires `act-progress` (`detail.progress`) so the
background can scrub without its own ScrollTrigger.

## Pieces

| File | What it does |
|---|---|
| `GlobalVfx.astro` | Bundles everything below and the section motion |
| `ScrollBackdrop.astro` | Fixed WebGL backdrop, one scene per act (`act-looks.ts`): `field`, `eye` (almond scan field on the cursor, densest at the fovea), `streaks` (speed with scroll), `mosaic` (six-primary hex flow), `hdr` (white bloom on a true-zero black), `trails` (hard-edged impulse copies, no smear), `blueprint`, `cone`, `calm`, `timelapse`, `shimmer`, `clean`. Morphs act to act on a damped "section position", so blends never pop. Writes `--vfx-tint-rgb` and `--vfx-retro` (1 at Act 1 → 0 at the last act) |
| `section-motion.ts` | One loop for every `.act-title` / `.section` child and any `[data-reveal]`: scroll-scrubbed opacity, rise and de-blur in and out, staggered. `[data-parallax="0.15"]` floats at depth |
| `ActTransition.astro` | The grand act change (below) |
| `ActBackground.astro` | Act backdrop declaration + custom background host |
| `BeamText.astro` | Real HTML text drawn on by an electron beam. `trigger="scroll" \| "enter" \| "external"`; with `external`, set `el.progress = 0..1` to sync it to any animation |
| `ScanlineNoise.astro` | Scanlines, animated grain, rolling refresh band. Fades out with `--vfx-retro` across the page |
| `PhosphorBloom.astro` | SVG filters `#ng-bloom`, `#ng-bloom-hot`; CSS `.ng-glow`, `.ng-glow--hot`, `.ng-phosphor` |
| `PersistenceCursor.astro` | Pointer trail with two-stage phosphor persistence, white-hot to tint |
| `act-looks.ts` | Per-act scene + tint, from the design doc's per-act table |
| `tokens.css` | VFX tokens on top of `src/styles/tokens.css` (RGBMCY primaries, font aliases, curves) |
| `quality.ts`, `motion.ts` | Adapter over the shared quality store; velocity signal and math kit |

## Act transition

Scrubbed across a 300vh spacer at the top of the incoming act (start: the
spacer's top at the viewport bottom; end: its bottom at the top). It is a pure
function of scroll, so it plays backwards too.

1. CRT power-off: four black shutters squash the outgoing act to a white-hot
   line, then pinch it to one phosphor dot.
2. A beat of black: the dot cools to an ember, then nothing.
3. The dot re-ignites and blooms into the variant.
4. The act number is traced by the beam; the title is beam-drawn (`BeamText`).
5. CRT power-on: a line, then the full raster opens onto the new act.

| `variant` | Moment |
|---|---|
| `default` | Bloom with expanding phosphor rings and a raster sweep |
| `eye` (Act 2) | The collapsed line opens into an eye; the dot becomes the pupil; it glances, then locks on you |
| `warp` (Act 3) | The dot detonates into a streak field that accelerates to a light-speed flash |
| `six-beam` (Act 4) | The dot spirals into six RGBMCY beams landing on a hexagon pixel: RGB triangle + inverted MCY triangle |
| `rays` | Legacy (no longer used): rays bend around the viewer |
| `flare` (Act 5) | True black, then one hexagon pixel ignites into a blinding HDR bloom and settles on black-on-black wells |
| `whip` (Act 6) | Whip-pan: a sample-and-hold box smear is swept by the raster into a razor-crisp impulse frame |
| `blueprint` (Act 7) | The side-fire tube flies together from exploded parts as a blueprint, then the six beams fire |
| `cone` (Act 8) | Rays leave the tube as a cone, the eyepiece turns it around, then it wraps you: ±50° Gaze-Cone, Periphery Ring to 160° |
| `shield` (Act 9) | A high-voltage arc crackles, then hex shield cells seal around it |
| `timelapse` (Act 10) | Hours-on counter blurs past (never lands), dust and daylight sweep, burn-in is evened out |
| `seals` (Act 11) | The act's certification seals stamp in one by one, then shimmer |
| `race` (Act 12) | Refresh bars race; CRT-VR smashes the chart ceiling and counts to 3,000+ Hz |

The Act 5–12 moments live in `act-tx-variants.ts`. A variant can set
`opts.lower` (title to the lower band), `opts.ownIgnite` (hide the shared
dot and bloom) and a `title()` hook that styles the beam-drawn title in sync.

Act 1 is a timed power-on intro instead (dot, bloom, raster opens on the hero).
It takes no scroll.

## Quality tiers

- `full`: everything; backdrop at DPR up to 1.5; cursor trail.
- `reduced`: backdrop at half resolution and 30 fps, fewer particles, no cursor trail, no animated grain.
- `static` (always under `prefers-reduced-motion`): no backdrop shader, overlays or transitions; reveals show content in place; Lenis is not started by the shared layer.
- A runtime tier change keeps the reader anchored on what they were reading.
- QA: `?vfx=full|reduced|static` pins a tier.
