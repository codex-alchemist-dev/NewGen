# interactives/crt-vr/

Interactive islands, one per interactive slot id. See `astro/README.md` for the slot contract.
These are Astro components with a typed `<script>` (no React runtime). Each reads the live
quality tier through `../../visuals/crt-vr/lib/tier.ts` (QA override: `?vfx=full|reduced|static`),
so `prefers-reduced-motion` always lands on the static tier.

`CrtvrSlot.astro` maps a slot id to its component and falls back to the kit `<Slot>` placeholder,
so the page only needs `<CrtvrSlot id kind />`. Add new components there.

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

Shared: `ix.css` (frame, chips, ranges, labels), `lib/wide.ts` (widen to the act width,
visibility-gated rAF loop, once-visible, DPR canvas fit).
