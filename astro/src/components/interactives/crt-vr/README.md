# interactives/crt-vr/

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
4. Subpixel peaks balance RGB → D65 (Y=1) and MCY → D65 (Y=1). Nits use the proposed 1,500-nit full-field peak.

Tiers: full (glow, pulses, fly-in), reduced (no filters), static/reduced-motion (no animation, composed frames).
