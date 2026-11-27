# interactives/crt-vr/

Interactive islands (React or TS), one per interactive slot id. See `astro/README.md`.

## Act 7 · The Machine (engineering-cutaway set)

All seven share `blueprint.css` (frames, title blocks, leader labels, controls, readouts)
and use `visuals/crt-vr/lib/tier.ts` + `lib/scrub.ts`. Physics and numbers were approved
by the coordinator on Nov 27; nothing here is invented.

| Component | Slot | What it is |
|---|---|---|
| `ExplodedTube.astro` | `exploded-tube` | Scroll-scrubbed horizontal section of the per-eye side-fire tube (Watchman FD lineage): running → exploded with callouts → tip and hex-screen insets → reassembly → power-on. Dome is convex toward the eye (glass in compression); its outer face is relay E1. |
| `GunShootout.astro` | `gun-shootout` | Port of the live page's trade study with its data verbatim, plus a live emitter cutaway, a radar over the chosen Schottky source and ARIA tabs. One approved text change: spot headroom vs. the ~2 µm triangle side. |
| `BeamFunnel.astro` | `beam-funnel` | Focus-Well Hexagons (Chromatron revival): rims biased negative vs. the floor funnel a shallow, off-target beam into its triangle. Side section + hex top view, illustrative paraxial model. |
| `HexaEmission.astro` | `hexa-emission` | The beam brushes the MgO / doped-diamond index strip on the rim and secondaries fly off; rim current vs. beam position. |
| `HexaSensors.astro` | `hexa-sensors` | Segmented collector ring with fast amps; pulse timing gives Δx, ring split gives Δy. Drag the beam off its raster. Mounted in the Hexa-Index section. |
| `HexaFeatures.astro` | `hexa-features` | Animatic, five scenarios: beam lock ×6, Earth field + head turn, side-fire keystone, aging + uniformity, stuck-beam kill. Drift → rim lights → lock. Mounted in the Hexa-Index section. |
| `PitchCalc.astro` | `pitch-calc` | Pitch = width / pixels (4:3 default), triangle = pitch / √3, spread = 1 µm × (kV / 10)^1.66. Microscope view + log chart. |

Tiers: `full` animates with glow; `reduced` keeps motion, drops glow and particles;
`static` (and reduced motion) shows one composed frame, and the exploded tube takes no
scroll length. QA override: `?vfx=full|reduced|static`.
