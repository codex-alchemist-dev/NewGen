// Generated from the live Sony/CRT-VR/index.html (comparison table, open questions, footnotes). Do not hand-edit numbers.
export const comparisonHeads = ["CRT-VR (theoretical)", "MicroOLED", "OLED (TV-class)", "True RGB LED", "MiniLED LCD"];
export const comparisonRows = [
 {
  "label": "Peak Brightness",
  "cells": [
   "~1,500 nits full field, 4,000+ nits peak at the faceplate, about 1,000+ nits at the eye — phosphor-saturation-limited, not gun-limited. Relay optics lose less than pancakes → at-eye advantage even at equal panel output.",
   "1000 nits panel-rated (Sony ECX344A); substantially less at eye through pancakes",
   "800–1500 nits",
   "Very high, coarse pitch",
   "1000–4000 nits"
  ]
 },
 {
  "label": "Blacks / Contrast",
  "cells": [
   "True zero — unstruck phosphor emits nothing",
   "Effectively infinite — tie, no overclaim",
   "Effectively infinite",
   "Per-LED off",
   "Blooming from zones"
  ]
 },
 {
  "label": "Color Gamut",
  "cells": [
   "6-primary RGBMCY hexagon — structurally exceeds any RGB triangle (cyan/yellow/magenta coverage)",
   "Wide RGB triangle (P3-class)",
   "RGB triangle",
   "RGB triangle",
   "RGB triangle, narrowed by filters/backlight"
  ]
 },
 {
  "label": "Resolution",
  "cells": [
   "Variable, beam-addressed — no fixed grid. PPI ceiling set by phosphor litho + color bleed; 24K per eye on a roughly 4″ tube is about 7,500 PPI",
   "Fixed ~4K/eye, 1000–2500+ PPI — current density leader",
   "Large-panel PPI",
   "Very low PPI",
   "Panel-dependent"
  ]
 },
 {
  "label": "Refresh",
  "cells": [
   "Variable, multi-kHz ceiling — foveation converts peripheral savings to central refresh gains",
   "90–120 Hz typical; 240 Hz record only at 1080p",
   "Up to 240 Hz",
   "Fast",
   "LC response is the bottleneck"
  ]
 },
 {
  "label": "Motion Blur",
  "cells": [
   "Essentially none — impulse-driven (phosphor flash + decay)",
   "Persistence blur; strobing helps at brightness cost",
   "Persistence blur",
   "Depends on drive",
   "Worst of group"
  ]
 },
 {
  "label": "Burn-In",
  "cells": [
   "Hexa-Index aging compensation, designed against it — unproven",
   "Real, documented on static HUDs in 2026 product",
   "Real",
   "Minimal",
   "None"
  ]
 },
 {
  "label": "Weight / Packaging",
  "cells": [
   "Unknown — honest open question №1",
   "107–170 g shipping (today's microOLED panel and optics)",
   "N/A",
   "N/A",
   "N/A"
  ]
 },
 {
  "label": "Power",
  "cells": [
   "Single emission point + deflection — no per-pixel tax; plausibly better per-lumen",
   "Millions of driven diodes; scales with lit pixels",
   "Same",
   "Same",
   "Backlight-dominated"
  ]
 },
 {
  "label": "Foveated Rendering",
  "cells": [
   "Hardware-native — beam skips sparse regions; savings become refresh",
   "GPU-side only; every pixel still refreshes",
   "GPU-side only",
   "GPU-side only",
   "GPU-side only"
  ]
 },
 {
  "label": "Maturity / Cost",
  "cells": [
   "TRL 2–3; unknown yield, cost, lifetime",
   "Mass production, $899–$2,200 street",
   "Mature",
   "Mature",
   "Mature"
  ]
 }
];
export const openQuestions = [
 {
  "tier": "P0 Feasibility-Deciding",
  "body": "Two miniature vacuum tubes + relay optics covering 160° per eye and 200°+ binocular FOV vs. 107–170 g for today's shipping microOLED panel and optics. A first design estimate puts the CRT-VR panel module at about 300 g per eye, but the full-stack mass is still open. This is where \"smaller, thinner\" is proven or dies. Inputs needed: tube envelope wall thickness at wafer-level-sealed scale, relay lens element count/mass, HV supply mass."
 },
 {
  "tier": "P0 Feasibility-Deciding",
  "body": "The actual PPI limit of the whole system. Model beam scatter at short throw + QD stripe pitch vs. cross-talk. Gun and MEMS deflection plates carry 100–1000× margin; this subsystem sets max resolution."
 },
 {
  "tier": "P0 Feasibility-Deciding",
  "body": "The 1,500 nit full-field, 4,000+ nit peak and 1,000+ nit at-eye targets hinge on QD-phosphor saturation/degradation limits under e-beam flux. Needs a literature review of cathodoluminescent QD data at minimum; ideally lab data."
 },
 {
  "tier": "P1 Architecture-Completing",
  "body": "Motion thresholds: which pan and head-turn speeds should push foveation to its most aggressive?"
 },
 {
  "tier": "P1 Architecture-Completing",
  "body": "Real-time 6-channel conversion, metamerism-aware optimization (multiple valid drive combos per color — optimize for brightness/efficiency/power). Precedent: Sharp Quattron processing silicon. Lives in the VR render pipeline. Could be prototyped in software now."
 },
 {
  "tier": "P1 Architecture-Completing",
  "body": "Lock the RGBMCY primary wavelengths for maximum hexagon area vs. the spectral locus, considering QD linewidths and eye sensitivity (CIE 1931 / CIE 170-2 observer)."
 },
 {
  "tier": "P1 Architecture-Completing",
  "body": "Vector scan-plan generation per frame: foveal density map → point list → deflection DAC waveform. Tier boundaries, temporal subsampling patterns for the midground. Also software-prototypable."
 },
 {
  "tier": "P2 Productization",
  "body": "Acceleration voltage choice, insulation, failure modes, regulatory pathway. Solvable, but real engineering."
 },
 {
  "tier": "P2 Productization",
  "body": "NEG getter capacity vs. outgassing over product life."
 },
 {
  "tier": "P2 Productization",
  "body": "Litho phosphor striping + MEMS electrostatic deflection plates + QD emitters + wafer vacuum sealing have never been combined in one device. Identify closest analog processes: FED post-mortems, MEMS bolometer lines, QD-OLED deposition."
 },
 {
  "tier": "P2 Productization",
  "body": "XCD-LED-style purity-vs-brightness crossover points; perceptual validation of high-luminance primary recruitment."
 }
];
export const liveFootnotes = [
 "† TRL 2–3 throughout. All figures are physics-grounded estimates extrapolated from real component technologies (SEM/TEM Schottky columns, e-beam lithography, MEMS wafer-level packaging, cathodoluminescent QD research) — never measured specs of this device, because this device has not been built.",
 "† Refresh & brightness ceilings are headroom statements, not commitments. Electrostatic deflection is multi-MHz-drivable and Schottky current headroom is 10²–10⁴× — but the shipped ceiling would be set by phosphor decay/saturation, which needs lab data (open questions №3).",
 "† Foveation refresh figures in the Act 3 vari-refresh simulator are illustrations of the conversion mechanism (peripheral scan savings → central refresh), computed from a notional 120 Hz full-field baseline. They are not performance claims.",
 "† Gamut figures in Act 4 are CIE 1931 calculations; final primary wavelengths are still unlocked (open question №6). The structural claim — a hexagon through six primaries contains every triangle through three — is geometry, not projection.",
 "† Cathodoluminescent quantum-dot phosphors are active research, not fantasy — but unproven at product scale. ALD passivation against e-beam degradation is design intent, not demonstrated lifetime.",
 "† MicroOLED ties on blacks and leads outright on maturity, packaging, and proven density. Comparison rows state this without hedging; the asymmetry (theory vs. shipping product) is the design target, TRL 2–3.",
 "† \"6 guns, 6 dots\": classic Trinitron \"single gun\" marketing = one assembly, three converged beams, purely geometric color separation via aperture grille. CRT-VR extends the same converged-assembly principle to six beams with a litho-patterned grille — no mechanical wires, no damper-wire shadows.",
 "† Adaptive drive strategy (purity at low luminance, recruitment at high luminance) originates in the XCD-LED display concept and is applied here as firmware/driver logic. See /Sony/XCD-LED for the originating architecture."
];

/** Full specs, two columns per group. Every value is a design target. */
export const specGroups: { name: string; rows: { label: string; value: string }[] }[] = [
  { name: 'Panel', rows: [
    { label: 'Type', value: 'Side-fire foveated CRT, one per eye' },
    { label: 'Screen', value: '~4″ concave wraparound faceplate, 4:3' },
    { label: 'Resolution', value: '24K-class per eye (foveal)' },
    { label: 'Pixel pitch', value: '~3.4 µm' },
    { label: 'Subpixel', value: '6 triangular subpixels per hex pixel (RGB + inverted MCY), ~2 µm side' },
    { label: 'Pixel grid', value: 'None visible' },
  ] },
  { name: 'Refresh & motion', rows: [
    { label: 'Refresh', value: '226 Hz min / 800+ Hz aggressive / 2,400+ Hz corner gaze' },
    { label: 'Motion-adaptive', value: '2,400+ Hz at minimum aggression, 3,000+ Hz at maximum' },
    { label: 'Response', value: '<1 µs' },
    { label: 'Motion blur', value: 'Zero (impulse emission)' },
    { label: 'Dwell', value: '~0.5 ns per dot' },
    { label: 'Deflection', value: 'Traveling-wave electrostatic MEMS' },
  ] },
  { name: 'Color', rows: [
    { label: 'Primaries', value: 'RGBMCY (B 450 · C 490 · G 520 · Y 575 · R 635 nm · two-peak M)' },
    { label: 'Gamut', value: '~170–185% DCI-P3 (CIE 1931 xy)' },
    { label: 'Color depth', value: '12 bits per primary' },
    { label: 'Color engine', value: 'Puretone™' },
  ] },
  { name: 'Brightness', rows: [
    { label: 'Full field', value: '~1,500 nits' },
    { label: 'Peak', value: '4,000+ nits' },
    { label: 'At eye', value: '~1,000+ nits' },
    { label: 'Black', value: 'True black (beam blanking ~10⁻⁵, Kurocoat wells)' },
  ] },
  { name: 'Electron optics', rows: [
    { label: 'Source', value: 'Schottky ZrO/W field emission, 6 converged beams' },
    { label: 'Beam voltage', value: '~2–10 kV' },
    { label: 'Landing', value: 'Focus-Well Hexagons + Hexa-Index closed loop' },
  ] },
  { name: 'Optics', rows: [
    { label: 'Relay', value: 'Gaze-Cone optics (elements 2+) + Periphery Ring (55–80°), faceplate = field element 1' },
    { label: 'FOV', value: 'Up to ~160° per eye, 200°+ binocular' },
    { label: 'Tiers', value: 'Sony · Sony G · G Master · G Master with ZEISS T*' },
    { label: 'CA correction', value: 'Per-beam hardware pre-warp' },
  ] },
  { name: 'Interface', rows: [
    { label: 'Link', value: 'Intel Eventide iDP, foveated framebuffer + gaze input' },
    { label: 'Bandwidth', value: '~10–20× lower than full-res' },
  ] },
  { name: 'Lifetime & safety', rows: [
    { label: 'Vacuum', value: 'Wafer-sealed, NEG getters' },
    { label: 'Burn-in', value: 'Hexa-Index aging compensation' },
    { label: 'X-ray', value: 'Negligible at 2–10 kV, fully absorbed by the glass envelope' },
    { label: 'HV', value: 'Potted temple modules with a fail-safe beam kill' },
  ] },
];
