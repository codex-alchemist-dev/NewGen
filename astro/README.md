# NewGen 2nd® Gen — Astro shell (preview)

This folder is an Astro project that builds the 2nd® Gen shell and the CRT-VR
preview page. It is separate from the live Jekyll site, which is not changed.

## Build and preview

```bash
cd astro
npm ci
npm run dev       # http://localhost:4321/NewGen/2nd/Sony/CRT-VR/
npm run build     # static output in astro/dist/
npm run preview   # serves dist/ at the same /NewGen/2nd/ path
```

The shared sidebar (`nav.js` / `nav.css`) loads from the live site root
(`/NewGen/assets/…`). The Astro dev server does not serve that path, so the
sidebar is missing locally. Set `PUBLIC_LIVE_ROOT` to load it from the live site,
for example `PUBLIC_LIVE_ROOT=https://cookiesmuch.github.io/NewGen/ npm run dev`.

The preview is not yet deployed. The Jekyll Pages workflow still publishes only
the existing site. Publishing `astro/dist/` under `/2nd/` on Pages is a follow-up decision.

## Layout

| Path | Purpose |
|---|---|
| `src/styles/tokens.css` | Design tokens as CSS custom properties (provisional values) |
| `src/styles/base.css` | Base styles, act shell, NewGen signature layer, slot placeholders |
| `src/layouts/BaseLayout.astro` | HTML shell, fonts, nav.js, motion init |
| `src/components/kit/` | Component kit: ActWrapper, ActTitle, Section, StatCard, Badge, SpecTable, ComparisonTable, Callout, Footnote, CertificationWall, ActRail, Slot |
| `src/components/vfx/` | Global VFX and per-act transition/background slots (Opus VFX threads) |
| `src/components/visuals/crt-vr/` | Page visuals and animatics (Opus threads) |
| `src/components/interactives/crt-vr/` | Interactive islands (React/TS) |
| `src/lib/motion/` | Lenis, GSAP + ScrollTrigger, adaptive VFX quality store, React hook |
| `src/data/crt-vr.ts` | The 12 acts, sections and slot ids from the blueprint |
| `src/pages/Sony/CRT-VR/index.astro` | Preview page at `/NewGen/2nd/Sony/CRT-VR/` (does not replace `/Sony/CRT-VR/`) |

## Motion foundation

- **Lenis** smooth scroll, driven by the GSAP ticker. Not started under reduced motion.
- **GSAP + ScrollTrigger**: import from `src/lib/motion/gsap.ts` only.
- **VFX quality store** (`src/lib/motion/vfx-quality.ts`): samples FPS each second.
  Two windows below 45 fps step the tier down (`full` → `reduced` → `static`). Four
  windows at or above 58 fps step it back up. `prefers-reduced-motion` pins the tier to `static`.
  The tier is mirrored to `<html data-vfx-tier="…">`. React islands use `useVfxQuality()`.

## Slot contract

Each slot is a `<Slot id kind />` placeholder inside an act. To replace one, add the
component in the folder below, then swap the `<Slot>` for the component in
`src/pages/Sony/CRT-VR/index.astro`.

Every visual, interactive and VFX component accepts `VfxSlotProps` (`src/lib/motion/types.ts`):

```ts
interface VfxSlotProps {
  tier: 'full' | 'reduced' | 'static';
  reducedMotion: boolean;
  progress?: number;   // 0..1 scroll progress through the owning act
  variant?: string;    // transition/background variant
}
```

| Slot id | Kind | Folder | Component name | Notes |
|---|---|---|---|---|
| `act-NN/transition` | vfx | `vfx/` | `ActTransition` | `variant`: default, eye (Act 2), warp (Act 3), six-beam (Act 4), rays (Act 8) |
| `act-NN/background` | vfx | `vfx/` | `ActBackground` | Per-act background |
| `hero-animatic` | visual | `visuals/crt-vr/` | `HeroAnimatic` | Act 1 |
| `contribution-map` | visual | `visuals/crt-vr/` | `ContributionMap` | Act 1. Id is provisional |
| `foveated-pipeline` | visual | `visuals/crt-vr/` | `FoveatedPipeline` | Act 2. Id is provisional |
| `pixel-vs-soft`, `crt-history-timeline`, `sony-lineage-tree`, `gaze-scan-density`, `scan-model-sim`, `acuity-curve`, `zone-inspector`, `grid-vs-crt-foveation`, `eye-roam`, `skip-coarseness-hz`, `motion-adaptive-timeline`, `slew-compare`, `gamut-explorer`, `hex-zoom`, `six-beam-convergence`, `coverage-calc`, `puretone-picker`, `emission-compare`, `black-floor-stack`, `motion-lineage-chart`, `motion-blur-compare`, `exploded-tube`, `gun-shootout`, `beam-funnel`, `hexa-emission`, `hexa-sensors`, `hexa-features`, `pitch-calc`, `flat-vs-cone`, `ray-tracer`, `rotate-eye`, `tier-compare`, `exploded-relay`, `fringe-toggle`, `comparison-table` | interactive | `interactives/crt-vr/` | PascalCase of the id | React or TS islands, e.g. `PixelVsSoft.tsx` for `pixel-vs-soft` |

## Blueprint notes

- Body copy is `[copy pending]` throughout. Do not invent copy, numbers or physics here.
- Act and section titles follow the coordinator's blueprint list. Section ids are kebab-case slugs.
- Slot ids the blueprint did not name (`contribution-map`, `foveated-pipeline`) are provisional.
- The Act 1 hero has the TRL 2–3 badge and the tagline. The Act 11 badge wall has the footnote "Measured at the faceplate."

## Shipping (planned, not yet approved)

The 2nd® Gen CRT-VR page replaces the live page at `/Sony/CRT-VR/`. Until Dom-tron approves the finished page, the live page stays as it is and the preview stays at `/NewGen/2nd/`.

When approved:

1. Build with the live base: `cd astro && ASTRO_BASE=/NewGen/ npm run build`. This emits `dist/Sony/CRT-VR/index.html` with `/NewGen/assets/…` paths.
2. Copy that file over `Sony/CRT-VR/index.html` at the repo root. Other pages are untouched.
3. Keep the preview build (`ASTRO_BASE` unset) for development.

The swap should be a reviewed PR, not an automatic deploy. The Jekyll workflow is not changed by this plan.
