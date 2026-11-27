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

Interactive islands (React or TS), one per interactive slot id. See `astro/README.md`.

## Act 4 · RGBMCY

All colour math is real CIE 1931 2° colorimetry (`lib/cie1931.ts`, 1 nm). Physics inputs are
coordinator-approved (Nov 27, 2026) and live at the top of `lib/color.ts`.

| Component | Slot | What it is |
|---|---|---|
| `GamutExplorer.tsx` | `gamut-explorer` | xy horseshoe; toggles sRGB, DCI-P3, Rec.2020, RGBMCY. Primaries from 20 nm QD lines (B450 C490 G520 Y575 R635); M is a two-peak B+R magenta on the purple line, complementary to G. |
| `HexZoom.tsx` | `hex-zoom` | Canvas zoom: tube face → hex lattice → one pixel (RGB triangle + inverted MCY triangle) → cut through the Kurocoat-walled wells. |
| `SixBeamConvergence.tsx` | `six-beam-convergence` | One gun, six converged beams crossing at the grille aperture; each lands on its own wedge. Solo a beam with the chips. |
| `CoverageCalc.tsx` | `coverage-calc` | Live xy area vs P3 / Rec.2020 / vision. FWHM slider. Panel ≈175.6% P3 (≈80% of vision); 200% moonshot set B430 C496 G516 Y550 R680 at 8 nm. |
| `PuretonePicker.tsx` | `puretone-picker` | Hue × saturation wheel over the panel gamut + luminance slider → live hex pixel with % per subpixel. Real Puretone solver. |

Shared: `act4.css`, `lib/color.ts` (spectra, primaries, hull, sRGB preview, solver), `lib/XYChart.tsx`,
`lib/HexPixel.tsx`, `lib/useTier.ts` (store tier + `?vfx=` QA override + in-view hooks).

### Puretone solver (`puretone()` in `lib/color.ts`)

1. **Fewest tones**: 1 primary if the target is within `PURE_TOL` (0.0025 xy) of it, else 2 on a segment, else the
   containing triangle with the smallest luminance-weighted chromatic spread.
2. **Budget**: the pure set's highest luminance at that chromaticity (a drive hits 100%).
3. **Recruitment**: past the budget, a bounded LP over all six (0 ≤ drive ≤ 1, exact XYZ) with pure tones free and
   others costed by xy distance from the target. Exact vertex enumeration, so drive levels are continuous and fade in.
4. Subpixel peaks balance RGB → D65 (Y=1) and MCY → D65 (Y=1). Nits use the 1,500-nit full-field peak.

Tiers: full (glow, pulses, fly-in), reduced (no filters), static/reduced-motion (no animation, composed frames).

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

## Act 7 · The Machine (engineering-cutaway set)

All seven share `blueprint.css` (frames, title blocks, leader labels, controls, readouts)
and use `visuals/crt-vr/lib/tier.ts` + `lib/scrub.ts`. Physics and numbers were approved
by the coordinator on Nov 27; nothing here is invented.

| Component | Slot | What it is |
|---|---|---|
| `ExplodedTube.astro` | `exploded-tube` | Scroll-scrubbed horizontal section of the per-eye side-fire tube (Watchman FD lineage): running → exploded with callouts → tip and hex-screen insets → reassembly → power-on. Dome is a shallow cap concave toward the eye (glass in tension, radial ribs on the vacuum side outside the active area; the 160° view comes from the Gaze-Cone eyepiece + Periphery Ring); beams graze its vacuum-side phosphor; its outer face is relay E1. |
| `GunShootout.astro` | `gun-shootout` | Port of the live page's trade study with its data verbatim, plus a live emitter cutaway, a radar over the chosen Schottky source and ARIA tabs. One approved text change: spot headroom vs. the ~2 µm triangle side. |
| `BeamFunnel.astro` | `beam-funnel` | Focus-Well Hexagons (Chromatron revival): rims biased negative vs. the floor funnel a shallow, off-target beam into its triangle. Side section + hex top view, illustrative paraxial model. |
| `HexaEmission.astro` | `hexa-emission` | The beam brushes the MgO / doped-diamond index strip on the rim and secondaries fly off; rim current vs. beam position. |
| `HexaSensors.astro` | `hexa-sensors` | Segmented collector ring with fast amps; pulse timing gives Δx, ring split gives Δy. Drag the beam off its raster. Mounted in the Hexa-Index section. |
| `HexaFeatures.astro` | `hexa-features` | Animatic, five scenarios: beam lock ×6, Earth field + head turn, side-fire keystone, aging + uniformity, stuck-beam kill. Drift → rim lights → lock. Mounted in the Hexa-Index section. |
| `PitchCalc.astro` | `pitch-calc` | Pitch = width / pixels (4:3 default), triangle = pitch / √3, spread = 1 µm × (kV / 10)^1.66. Microscope view + log chart. |

Tiers: `full` animates with glow; `reduced` keeps motion, drops glow and particles;
`static` (and reduced motion) shows one composed frame, and the exploded tube takes no
scroll length. QA override: `?vfx=full|reduced|static`.

## Act 8 · Wraparound Optics

| Component | Slot | What it is |
|---|---|---|
| `FlatVsCone.tsx` | `flat-vs-cone` | Flat panel through a pancake fold (stretched, soft-edged, boxed view) next to the CRT-VR cone in, cone out. Gaze loupe slider. |
| `RayTracer.tsx` | `ray-tracer` | Traced rays from the concave dome faceplate through the Gaze-Cone elements into the pupil, plus the Periphery Ring. FOV slider 100°–160° per eye, 200°+ binocular note. |
| `RotateEye.tsx` | `rotate-eye` | Eye sweeps its ±50° rotation cone; the traced bundle for each gaze angle stays converged. |
| `TierCompare.tsx` | `tier-compare` | Sony, Sony G, G Master, G Master with ZEISS T*: qualitative ranks only, text labels only. |
| `ExplodedRelay.tsx` | `exploded-relay` | E1 faceplate, E2–E5 XA elements, Periphery Ring and Kurocoat barrel, with callouts and an explode slider. |
| `FringeToggle.tsx` | `fringe-toggle` | Per-beam CA pre-warp on/off: six primaries pre-distorted at the faceplate, clean at the eye. |

Shared code is in `wraparound/`: `shared.ts` (tier hook with the `?vfx=` override, rAF loop,
colours), `GazeCone.tsx` (the optics drawing), `gazecone-data.ts` (traced rays, generated by
`astro/tools/gaze-cone-trace/`) and `wraparound.css`. Every island reads the live VFX tier:
`full` animates ray flow and sweeps, `reduced` drops glow and motion, `static` (and reduced
motion) shows still frames. Diagrams are labelled "illustrative, not to scale".
