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
