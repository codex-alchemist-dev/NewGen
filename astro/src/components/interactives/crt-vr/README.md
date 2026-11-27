# interactives/crt-vr/

Interactive islands (React), one per interactive slot id. See `astro/README.md` for the slot contract.

## Act 2 · Gaze-Native and Act 3 · Velocity

| Component | Slot | What it shows |
|---|---|---|
| `GazeScanDensity.tsx` | `gaze-scan-density` | Upgrade of the live page's Gaze-Following Scan Density. Drag/hover the gaze, aggressiveness slider, presets Mild / Aggressive / Corner. Fovea, interlaced mid-zone, never-interlaced edge. Live whole-screen refresh (≈227 / 836 / 2400 Hz at the presets), dots scanned, beam time reclaimed, fovea-on-screen fraction (≈1/4 in a corner). |
| `ScanModelSim.tsx` | `scan-model-sim` | Raster vs Skip-Scan side by side in slow motion. Same scan-line pass and dwell per dot; raster wastes dwell on skipped dots, Skip-Scan vector-jumps over them. Frame time and frames-finished counters. |
| `AcuityCurve.tsx` | `acuity-curve` | Eye acuity falloff (1 / (1 + e / 2.3°)) against the CRT-VR resolution map (core ±5°, mid ±20°, edge), uniform optics line, lowest headroom outside the core. Drag to move the gaze. |
| `ZoneInspector.tsx` | `zone-inspector` | Click a zone to zoom a 9 × 9 lens into its dot pattern (interlace visible in slow motion) with its dot cost per frame, share of frame, spatial and temporal sampling. |
| `GridVsCrtFoveation.tsx` | `grid-vs-crt-foveation` | Same scene and foveated render. Grid panel: blocky periphery, fixed 120 Hz, 0% display time saved. CRT-VR: soft periphery, model refresh, beam time saved. Frames-in-25-ms strips. |
| `EyeRoam.tsx` | `eye-roam` | Top-down eye at the centre of a 180°+ monocentric field; uniform sharpness wherever it lands, core and mid-zone carried with the gaze. Toggle a qualitative sweet-spot lens for contrast. Idle auto-roam. |
| `SkipCoarsenessHz.tsx` | `skip-coarseness-hz` | One scan line: fine steps in the fovea, coarse vector jumps outside, deflection-vs-time staircase against a raster ramp, live Hz. |
| `SaccadeTimeline.tsx` | `saccade-timeline` | Fixate → 40 ms saccade (coarsest skips, no fovea, illustrative peak) → land and catch up. Field view plus a refresh-vs-time trace. |
| `SlewCompare.tsx` | `slew-compare` | Lumped plates (spot ramps over the transit time) vs traveling-wave segmented plates fed by a delay line (spot steps). Qualitative, class labels only. |

`CrtVrInteractive.astro` mounts the right island for a slot id (`client:visible`); `index.ts` lists the built ids so the page keeps `<Slot>` for the rest.

### Shared model (illustrative)

All numbers come from `lib/model.ts`, a straight port of the live page's §05 math:
refresh = 120 Hz × (3,024 fixed-grid dots ÷ dots scanned), fovea r 70 / mid r 190 on a 72 × 42 grid,
mid keep 1–4 + interlace, edge keep 2–8, 0.05 floor (2,400 Hz ceiling). Angular mapping, acuity formula,
40 ms saccade and the 120 Hz grid baseline are coordinator-approved provisional values in the same file.

### Quality tiers

Each island reads the live tier through `lib/hooks.ts` (`useTier`: shell FPS store, reduced motion, `?vfx=` override).

- **full**: rAF, DPR ≤ 2, additive phosphor sprites, glow, persistence trails.
- **reduced**: ~30 fps, DPR 1, flat dots, no blur/glow filters.
- **static** (and `prefers-reduced-motion`): no loop. Each island draws one composed frame and redraws only on input.

Islands stop animating when offscreen (IntersectionObserver).

## Acts 1, 5, 6 and 12 (Astro + TS islands)

These are Astro components with a typed `<script>` (no React runtime). Each reads the live quality tier through `../../visuals/crt-vr/lib/tier.ts` (QA override `?vfx=full|reduced|static`), so reduced motion lands on the static tier. `CrtvrSlot.astro` maps a slot id to its component and falls back to the kit `<Slot>`. Their shared frame is `cx.css` (class prefix `cx-`, kept apart from the Act 2–3 `ix.css`).

| Component | Slot | Act | What it is | full / reduced / static |
|---|---|---|---|---|
| `PixelVsSoft.astro` | `pixel-vs-soft` | 1 | Same scene, same foveated sample budget, two reconstructions: grid panel (hard blocks, hard zone edges) vs. CRT-VR (Gaussian spots, seamless zones). Gaze follows the pointer; periphery slider down to below 480p-class; zone overlay. | auto-roaming gaze / render on input / one frame |
| `CrtHistoryTimeline.astro` | `crt-history-timeline` | 1 | Pinned horizontal scroll story, Braun 1897 → CRT-VR. A beam at stage centre draws the line; each era's line-art device draws on. Green tube era, cold flat-panel era, flickering holdouts, six-primary return. Captions from the coordinator. | glow / no glow / wrapped grid, no pinning |
| `SonyLineageTree.astro` | `sony-lineage-tree` | 1 | Sony ancestor → the CRT-VR feature it became, joining a bus into CRT-VR. Hover/focus traces one line. | pulses / no pulses / drawn |
| `EmissionCompare.astro` | `emission-compare` | 5 | Simulated photons: Lambertian (cosine) vs. directional outcoupling into the relay cone, with a running "reaches the lens" meter. Illustrative. | trails / dots / ray fans |
| `BlackFloorStack.astro` | `black-floor-stack` | 5 | Log-scale black budget: beam leakage, veiling glare, electron halo. Fixes (blanking ≈10⁻⁵, Kurocoat barrel, Kurocoat wells + Photon Cups) play in sequence, then toggle. Patch shows the black you'd see. Illustrative except the blanking figure. | sequence / sequence / all fixes on |
| `MotionLineageChart.astro` | `motion-lineage-chart` | 6 | Qualitative motion-clarity chart, scroll-scrubbed time cursor 1950s → today; CRT-VR breaks off the top. | glow / no glow / drawn |
| `MotionBlurCompare.astro` | `motion-blur-compare` | 6 | Pursuit view of a moving target: sample-and-hold smear (speed × full-persistence hold) vs. CRT-VR impulse. Speed slider, pause. | smooth / fewer samples / parked target |
| `ComparisonTable.astro` | `comparison-table` | 12 | `crt-vr-proof.ts` data with topic filter, compare-with column toggles, row/column crosshair, arrow-key cell navigation, pinned lit CRT-VR column. | reveal / reveal / no motion |

Shared: `cx.css` (frame, chips, ranges, labels), `lib/wide.ts` (widen to the act width,
visibility-gated rAF loop, once-visible, DPR canvas fit).
