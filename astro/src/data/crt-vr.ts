import type { SectionKind, TransitionVariant } from './slots';

/*
 * CRT-VR page structure, from the "CRT-VR Page Blueprint" (coordinator, Nov 27).
 * `interactive` and `visual` are slot ids. Slots are rendered as placeholders
 * until the Opus threads supply components with the same id.
 */
export interface SectionDef {
  id: string;
  title: string;
  kind?: SectionKind;
  interactive?: string;
  visual?: string;
  /** Final copy: eyebrow, headline (replaces title), body paragraphs, footnote. */
  eyebrow?: string;
  headline?: string;
  body?: string[];
  footnote?: string;
  /** Extra data for stats, badges, comparison and specs sections. */
  items?: { label: string; value?: string; unit?: string; color?: string; note?: string; cells?: (string | boolean)[] }[];
  columns?: string[];
}

export interface ActDef {
  number: number;
  id: string;
  title: string;
  transition: TransitionVariant;
  sections: SectionDef[];
  tagline?: string;
}

export const acts: ActDef[] = [
  {
    number: 1, id: 'hook', title: 'The Hook', transition: 'default', tagline: "Look anywhere. It's already there.",
    sections: [
      { id: 'hero', title: 'Hero', kind: 'hero', visual: 'hero-animatic', eyebrow: 'NewGen × Sony · CRT-VR', headline: 'CRT-VR',
        body: ["Look anywhere. It's already there."],
        footnote: 'TRL 2–3 · Design study. Nothing here is built yet. All figures are design targets.' },
      { id: 'the-problem', title: 'The problem', eyebrow: '01 · The window', headline: 'VR shows you a screen. We show you a world.', body: [
        "Today's VR feels like looking through a window at a flat screen. A CRT feels like looking through a real window at a real world. CRT-VR takes that, and everything on this page, so you feel like you're truly looking at the game world."] },
      { id: 'the-reveal', title: 'The reveal', kind: 'stats', eyebrow: '02 · The numbers', headline: 'The fastest display technology in the world.', footnote: 'OLED is still catching up. Design targets.', items: [
        { value: '0', label: 'Motion blur', color: '#00b4ff' },
        { value: '180°+', label: 'Binocular field of view', color: '#ffe135' },
        { value: '24K', label: 'Per eye', color: '#ff3c6e' },
        { value: 'True', label: 'Black', color: '#f0f4ff' },
        { value: '6', label: 'Primaries', color: 'six' },
        { value: '3,000+', unit: 'Hz', label: 'Peak refresh', color: '#00ff99' }] },
      { id: 'no-pixels', title: 'No pixels. Ever.', eyebrow: '03 · No grid', headline: 'No pixels. Ever.', interactive: 'pixel-vs-soft', body: [
        "Even at 480i or 480p, a CRT shows no visible pixel grid, because the beam's Gaussian spot blends into the phosphor. That's why CRT-VR's foveation feels invisible: away from where you look, the image gets softer, never blocky. Your peripheral vision is soft anyway, so the illusion never breaks."] },
      { id: 'the-comeback', title: 'The comeback', eyebrow: '04 · Ahead of its time', headline: 'The industry left it behind. It was simply ahead of its time.', interactive: 'crt-history-timeline', body: [
        'CRT was called bulky, inefficient, retro. What no one saw was the medium it was made for: a tiny screen right in front of your eye, where size stops mattering, and motion clarity, true black and the absence of a pixel grid matter most. Then VR arrived.', "The timeline starts with Braun's tube in 1897 and runs through the oscilloscope and radar, TV, Trinitron, Chromatron, the Watchman flat CRT, the vector arcade and Vectrex, the flat-panel takeover in the 2000s, and the CRT holdouts in esports and retro gaming, ending at CRT-VR."] },
      { id: 'sony-lineage', title: 'The Sony lineage', eyebrow: '05 · Lineage', headline: 'Sixty years of Sony, in every beam.', interactive: 'sony-lineage-tree', body: [
        "Chromatron (1961): Sony's first color tube. It focused the beam with a charged grid, which became Focus-Well Hexagons.",
        'Trinitron (1968): one gun with converged beams, which became six beams from one assembly.',
        'Watchman FD (1982): the side-fired flat CRT, which became the side-fire tube.',
        'FD Trinitron, the GDM-FW900 and BVM/PVM broadcast monitors: the reference standard for color and motion.',
        "Sony microOLED (the ECX series, used in today's premium headsets): the near-eye panel CRT-VR now beats.",
        'TRILUMINOS QDs and XCD-LED become six-primary QD color.',
        'Sony G Master optics become the Gaze-Cone eyepiece.',
        "PlayStation VR is Sony's VR heritage."] },
      { id: 'built-by-newgen', title: 'Built by NewGen', eyebrow: '06 · Built by NewGen', headline: 'One panel. Every expert.', visual: 'contribution-map', body: [
        'Sony brings the tube, the color and the glass. Intel Eventide brings the link and the scan silicon. Lightmatter brings the photonic interconnect, if used.',
        'Launch customers: ShallXR and Play For Dream, the first headsets to ship CRT-VR panels.'] },
    ],
  },
  {
    number: 2, id: 'gaze-native', title: 'Gaze-Native', transition: 'eye', tagline: 'The beam goes where your eye goes.', sections: [
      { id: 'hardware-foveation', title: 'Hardware foveation', interactive: 'gaze-scan-density', eyebrow: 'Hardware foveation', headline: 'Foveated in the hardware.', body: [
        "A grid panel draws every pixel, every frame, whether or not you're looking. CRT-VR's beam follows your gaze. Full detail where you look, interlaced detail around it, and a fast, low-res edge tuned for catching motion."] },
      { id: 'skip-scan', title: 'Skip-Scan', interactive: 'scan-model-sim', eyebrow: 'Skip-Scan', headline: 'Skip what you can\'t see.', body: [
        "The beam reads a normal framebuffer in a raster scan-line pass, and uses vector movement to jump straight over the dots foveation skips, without dwelling on them. No vector rendering is involved."] },
      { id: 'built-for-how-eyes-see', title: 'Built for how eyes actually see', interactive: 'acuity-curve', eyebrow: 'Acuity', headline: 'Built for how eyes actually see.', body: [
        "Your sharpest vision covers about 2°. Beyond that, acuity falls off fast. CRT-VR's resolution map follows the same curve, so no beam time is spent on detail your eye can't use."] },
      { id: 'three-zones', title: 'The three zones, up close', interactive: 'zone-inspector', eyebrow: 'Three zones', headline: 'Three zones. One seamless image.', body: [
        'Fovea: Full 24K-class density, drawn every frame.',
        'Mid-zone: Lower resolution, interlaced, alternating lines each frame.',
        'Edge: Low resolution, never interlaced, and built for spotting motion.'] },
      { id: 'grid-vs-crt', title: "Why grid panels can't do this", interactive: 'grid-vs-crt-foveation', eyebrow: 'Flat panels', headline: "Why flat panels can't do this.", body: [
        'On OLED and LCD, foveation only saves GPU work. The panel still drives every pixel at a fixed refresh, and the periphery turns to blocks. On CRT-VR, every skipped dot is beam time saved, and that time becomes refresh rate. Precedent: Varjo\'s dual-panel approach.'] },
      { id: 'real-eye-freedom', title: 'Real eye freedom', interactive: 'eye-roam', eyebrow: 'Eye freedom', headline: 'Look with your eyes, not your neck.', body: [
        "In today's VR you turn your head because only the center is sharp. CRT-VR's Gaze-Cone eyepiece is uniformly sharp across the ±50° cone your eye can rotate through, and a Periphery Ring carries the view out to 160° per eye, so you can glance the way you do in real life."] },
      { id: 'foveation-presets', title: 'Foveation presets: Quality / Balanced / Velocity', eyebrow: 'Presets', headline: 'Quality. Balanced. Velocity.', body: [
        'Quality, Balanced and Velocity trade periphery detail for refresh rate, from 226 Hz to 800+ Hz.'] },
      { id: 'end-to-end-pipeline', title: 'End-to-end foveated pipeline', visual: 'foveated-pipeline', eyebrow: 'Pipeline', headline: 'Foveated end to end.', body: [
        'Gaze in, foveated frame in, over Intel Eventide iDP. The GPU renders only what the beam will draw, cutting link bandwidth by about 10–20×.'] },
    ],
  },
  {
    number: 3, id: 'velocity', title: 'Velocity', transition: 'warp', tagline: 'One screen. Thousands of refreshes a second.', sections: [
      { id: 'vari-refresh', title: 'Vari-refresh', interactive: 'skip-coarseness-hz', kind: 'stats', eyebrow: 'Vari-refresh', headline: 'The less it draws, the faster it gets.', footnote: 'Figures from the NewGen scan model. Design targets, to be recomputed at 24K.', body: [
        "CRT-VR refreshes the whole screen in a single raster pass. Where detail isn't needed, the beam takes bigger jumps, so the frame finishes sooner and the screen refreshes faster. 2,400+ Hz when you look into a corner, where the high-res region is clipped to about a quarter."], items: [
        { value: '226 Hz', label: 'Minimum' },
        { value: '800+ Hz', label: 'Aggressive foveation' },
        { value: '2,400+ Hz', label: 'Looking into a corner' }] },
      { id: 'mafr', title: 'Motion-Adaptive Foveated Rendering', interactive: 'motion-adaptive-timeline', eyebrow: 'Motion-adaptive', headline: 'When everything moves, go all speed.', body: [
        'Resolution matters less when everything is moving. During fast motion, like a whip-pan or a quick head turn, Motion-Adaptive Foveated Rendering drops the entire screen, fovea included, to stage-3 foveation. With the coarsest skips everywhere, the whole-screen refresh rockets past 2,400 Hz even at the mildest setting, and beyond 3,000 Hz at the most aggressive. When motion settles, full three-zone foveation and every bit of detail come straight back. It all happens in a split second. As the motion slows and its natural blur fades, your fovea snaps back to full resolution, so you never notice the switch.'] },
      { id: 'traveling-wave-deflection', title: 'Traveling-Wave Deflection', interactive: 'slew-compare', eyebrow: 'Traveling-Wave Deflection', headline: 'Steering at the speed of the beam.', body: [
        'Segmented MEMS plates whose field travels with the electrons, for GHz-class slew.'] },
      { id: 'charge-dense-dwell', title: 'Charge-Dense Dwell', eyebrow: 'Charge-Dense Dwell', headline: 'Half a nanosecond per dot.', body: [
        'Schottky current headroom cuts pixel dwell from about 4 ns to about 0.5 ns.'] },
      { id: 'open-loop-slew', title: 'Open-Loop Slew + Hexa-Index Correction', eyebrow: 'Open-Loop Slew', headline: 'Jump now. Correct next pass.', body: [
        "The beam doesn't wait to settle. Hexa-Index measures where it landed and corrects it on the next pass."] },
      { id: 'nanosecond-qds', title: 'Nanosecond QDs', eyebrow: 'Nanosecond QDs', headline: 'No afterglow. Ever.', body: [
        "Quantum dots fade in nanoseconds, so even at 2,400+ Hz there's no ghosting."] },
    ],
  },
  {
    number: 4, id: 'rgbmcy', title: 'RGBMCY', transition: 'six-beam', tagline: 'RGBMCY. Colors no screen has shown you.', sections: [
      { id: 'why-three-isnt-enough', title: "Six Primaries: why three isn't enough", interactive: 'gamut-explorer', eyebrow: 'Why three', headline: 'Three colors were never enough.', body: [
        "The RGB triangle against the eye's horseshoe. Every screen you own mixes red, green and blue. That triangle leaves out huge parts of what your eye can see, especially the deep cyans and greens."] },
      { id: 'meet-the-six', title: 'Meet the six', eyebrow: 'Meet the six', headline: 'Meet the six.', body: [
        'Blue ~450 nm: deep enough for a wide blue corner without sliding into dim violet.',
        'Cyan ~490 nm: fills the cyan-green bulge where three-primary displays lose the most.',
        'Green ~520 nm: near the tip of the spectral horseshoe, for the widest green reach.',
        'Yellow ~575 nm: a bright, efficient tone that pushes the yellow edge and renders pure yellow alone.',
        'Red ~635 nm: deep red without spending energy where the eye barely sees.',
        'M: a true two-peak magenta, kept magenta so Puretone draws pure magenta from one subpixel.'] },
      { id: 'hexagon-pixel', title: 'The Hexagon pixel', interactive: 'hex-zoom', eyebrow: 'The Hexagon', headline: 'The Hexagon.', body: [
        'Every pixel is an RGB triangle and an inverted MCY triangle, six subpixels in one perfect hex.'] },
      { id: 'six-beams-one-gun', title: 'Six beams, one gun', interactive: 'six-beam-convergence', eyebrow: 'Six beams', headline: 'Six beams. One gun.', body: [
        'Trinitron converged three beams. CRT-VR converges six, and each lands only on its own color.'] },
      { id: 'the-gamut', title: 'The gamut', interactive: 'coverage-calc', eyebrow: 'Gamut', headline: 'About 170–185% of DCI-P3.', body: [
        'About 80% of human vision, with 200% as the moonshot.'] },
      { id: 'gamut-innovations', title: 'Gamut innovations', eyebrow: 'Innovations', headline: 'Purity, engineered.', body: [
        'Nanoplatelet and perovskite QDs (10–20 nm FWHM)',
        'Resonant Wells (microcavity Photon Cups)',
        'Per-subpixel dichroic spectral trim',
        'Zero cross-talk (Kurocoat walls + Focus-Wells + Hexa-Index)'] },
      { id: 'puretone', title: 'Puretone™', interactive: 'puretone-picker', eyebrow: 'Puretone™', headline: 'Puretone™. The purest way to every color.', body: [
        'Every subpixel can work alone. Pure cyan lights only cyan. CRT-VR always builds a color from the fewest, closest pure tones, so color stays clean and power stays low. Only when you need more brightness do other tones join in.'] },
      { id: 'gamut-mapping-pipeline', title: 'Gamut-mapping pipeline', eyebrow: 'Mapping', headline: 'Any content. Six-primary output.', body: [
        'RGB or Rec.2020 in, RGBMCY out, on the controller.'] },
      { id: 'color-depth', title: 'Color depth', eyebrow: 'Depth', headline: '12 bits per primary.', body: [
        'Six primaries, 12 bits each, for gradients without a single band.'] },
      { id: 'what-you-gain', title: 'What you gain', eyebrow: 'What you\'ll see', headline: "What you'll see.", body: [
        "Colors you've never seen on a screen. Skin and foliage accurate across metamerism. Sunsets without banding."] },
    ],
  },
  {
    number: 5, id: 'brilliance', title: 'Brilliance', transition: 'flare', tagline: 'Blinding light. Absolute black.', sections: [
      { id: 'the-numbers', title: 'The numbers', kind: 'stats', eyebrow: 'The numbers', headline: 'Bright enough to squint.', footnote: 'Design targets. Full-field and peak are at the faceplate; at your eye is what reaches you.', items: [
        { value: '1,500', unit: 'nits', label: 'Full screen' },
        { value: '4,000+', unit: 'nits', label: 'Highlights' },
        { value: '1,000+', unit: 'nits', label: 'At your eye' }] },
      { id: 'photon-cups', title: 'Photon Cups', eyebrow: 'Photon Cups', headline: 'Every photon, forward.', body: [
        'Mirrored subpixel wells turn light that would be lost sideways toward your eye.'] },
      { id: 'directional-outcoupling', title: 'Directional Outcoupling', interactive: 'emission-compare', eyebrow: 'Outcoupling', headline: 'Light, aimed.', body: [
        'Microlens and nano-structured faceplate that aims light into the relay cone.'] },
      { id: 'many-pass-linearity', title: 'Many-Pass Linearity', eyebrow: 'Many-Pass', headline: 'Faster is brighter.', body: [
        'High refresh means less charge per hit, so the quantum dots stay linear.'] },
      { id: 'gaze-peak-hdr', title: 'Gaze-Peak HDR', eyebrow: 'Gaze-Peak HDR', headline: 'Highlights where you look.', body: [
        'HDR headroom follows your fovea.'] },
      { id: 'true-black', title: 'True Black', interactive: 'black-floor-stack', eyebrow: 'True Black', headline: 'True black. Not dim. Off.', body: [
        'Kurocoat wells, black matrix, beam blanking about 10⁻⁵, and the black-level budget (leakage, glare, halo).'] },
    ],
  },
  {
    number: 6, id: 'motion', title: 'Motion', transition: 'whip', tagline: 'The crown it never lost.', sections: [
      { id: 'motion-crown', title: 'The motion crown', interactive: 'motion-lineage-chart', eyebrow: 'The crown', headline: 'Decades at the top.', body: [
        'For decades CRT owned motion clarity and response time. Esports players and purists kept theirs long after flat panels took over. LCD never caught up. OLED is still chasing it with black-frame tricks and 480 Hz races. CRT-VR widens the gap. Impulse phosphor light with microsecond-class response meant no sample-and-hold blur.'] },
      { id: 'zero-smear', title: 'Zero smear', eyebrow: 'Zero smear', headline: 'Zero smear.', body: [
        'Light that flashes and fades in an instant, with no black frames needed and no brightness lost.'] },
      { id: 'photon-latency', title: 'Photon latency', eyebrow: 'Latency', headline: 'From gaze to photon, instantly.', body: [
        'The panel-side latency budget, from gaze coordinates in to beam out.'] },
      { id: 'judder-free', title: 'Judder-free', interactive: 'motion-blur-compare', eyebrow: 'Judder-free', headline: 'Smoother than the content.', body: [
        'The screen refreshes far faster than any game renders, so motion never judders.'] },
    ],
  },
  {
    number: 7, id: 'the-machine', title: 'The Machine', transition: 'blueprint', tagline: 'A tube, reimagined from the electron up.', sections: [
      { id: 'side-fire-tube', title: 'Side-fire tube', interactive: 'exploded-tube', eyebrow: 'Side-fire', headline: 'Fired from the side.', body: [
        'Watchman lineage, with guns at the temples firing across the faceplate.'] },
      { id: 'dome-faceplate', title: 'Dome faceplate', eyebrow: 'Dome', headline: 'A dome, not a slab.', body: [
        'The faceplate is a shallow concave cap, 6–8 mm thick, that bows into the vacuum, with vacuum-side ribs outside the active area.'] },
      { id: 'faceplate-first-lens', title: 'Faceplate = first lens', eyebrow: 'First lens', headline: 'The screen is the first lens.', body: [
        'The outer surface is the first element of the Sony relay.'] },
      { id: 'the-gun', title: 'The gun', interactive: 'gun-shootout', eyebrow: 'The gun', headline: 'One gun. Six beams.', body: [
        'A Schottky ZrO/W source, six beams from one assembly.'] },
      { id: 'focus-well-hexagons', title: 'Focus-Well Hexagons', interactive: 'beam-funnel', eyebrow: 'Focus-Wells', headline: 'Every subpixel aims the beam.', body: [
        'Biased Kurocoat rims funnel the beam into each triangle, a Chromatron revival.'] },
      { id: 'hexa-index', title: 'Hexa-Index', interactive: 'hexa-emission', eyebrow: 'Hexa-Index', headline: 'It always knows where the beam is.', body: [
        'The beam brushes an MgO or diamond rim, and secondary electrons fly off.',
        'A collector ring and timing decode show where the beam landed.',
        'Beam lock, Earth-field and head-turn drift correction, keystone correction, aging uniformity and stuck-beam kill.'] },
      { id: 'density', title: 'Density', interactive: 'pitch-calc', eyebrow: 'Density', headline: '24K in four inches.', body: [
        '24K on 4″ means a ~3.4 µm pitch and ~2 µm triangles, with a beam voltage of about 2–10 kV.'] },
    ],
  },
  {
    number: 8, id: 'wraparound-optics', title: 'Wraparound Optics', transition: 'cone', tagline: 'Made for VR. Before VR existed.', sections: [
      { id: 'cone-in-cone-out', title: 'Cone in, cone out', interactive: 'flat-vs-cone', eyebrow: 'Cone', headline: 'Born a cone.', body: [
        "A flat panel has to stretch a rectangle around your eye, which is where distortion and the screen-in-a-box feel come from. A CRT's light already leaves as a cone. CRT-VR's optics simply turn that cone around to wrap your eye. The panel the industry tried to leave behind was simply ahead of its time."] },
      { id: 'gaze-cone-optics', title: 'Gaze-Cone optics', interactive: 'rotate-eye', eyebrow: 'Gaze-Cone', headline: 'Sharp across the cone your eye sweeps.', body: [
        'A curved-field aspheric eyepiece per eye, uniformly sharp across the ±50° cone the eye can rotate through, with softening only in peripheral vision.',
        'Beyond the cone, a thin Periphery Ring covers 55–80°, giving 160° per eye, where your vision is peripheral anyway.'] },
      { id: 'faceplate-is-first-lens', title: 'The faceplate is the first lens', eyebrow: 'First lens', headline: 'One less lens.', body: [
        'The dome faceplate doubles as the first optical element.'] },
      { id: 'optics-tiers', title: 'Optics tiers: Sony, G, G Master, G Master with ZEISS T*', interactive: 'tier-compare', eyebrow: 'Tiers', headline: 'Glass worthy of the image.', body: [
        'All tiers use a fixed deterministic spacing with no pancake folds, so there are no ghosts, no sweet-spot loss and almost no brightness loss.',
        'Sony (entry panels): Sony-quality aspherical glass.',
        'Sony G (mid-range panels): G-series elements and coatings.',
        "Sony G Master (high-end panels): XA extreme-aspherical elements, Nano AR Coating II and the full G Master coating stack.",
        'ZEISS (select flagship panels): branded "G Master with ZEISS T*", in the same style as Sony\'s ZEISS-badged lenses. It is the full G Master relay with ZEISS T* coating, for the very top of the line.'] },
      { id: 'exploded-relay', title: 'Exploded relay', interactive: 'exploded-relay', eyebrow: 'Relay', body: [
        'Pulled apart from the panel side: the faceplate as first lens, the Gaze-Cone eyepiece for each eye, and the Periphery Ring that carries the view out to 160° per eye. Use the slider to pull the parts apart.'] },
      { id: 'field-curvature-match', title: 'Field-curvature match', eyebrow: 'Field curvature', headline: 'Edge to edge.', body: [
        'The curved screen cancels the optics\' field curvature, so it stays sharp right out to the edges.'] },
      { id: 'per-beam-ca-prewarp', title: 'Per-beam chromatic-aberration pre-warp', interactive: 'fringe-toggle', eyebrow: 'CA pre-warp', headline: 'Fringe-free, in hardware.', body: [
        "Each of the six beams pre-distorts its own primary, so the relay's color fringing cancels in hardware. Lens distortion pre-warp comes free with skip-scan."] },
      { id: 'pupil-swim-correction', title: 'Pupil-swim correction', visual: 'pupil-swim', eyebrow: 'Pupil swim', headline: 'The world never wobbles.', body: [
        'When your eye rotates, the pupil shifts by millimeters. The panel uses gaze coordinates to adjust its geometry every frame, so the world never wobbles.'] },
      { id: 'eyebox-and-eye-relief', title: 'Eyebox and eye relief', eyebrow: 'Eyebox', headline: 'Room for you.', body: [
        'A generous eyebox, room for glasses or a prescription insert, and IPD range.'] },
      { id: 'glare-and-ghost-control', title: 'Glare and ghost control', visual: 'glare-control', eyebrow: 'Glare', headline: 'Darkness, protected.', body: [
        'A Kurocoat-lined relay barrel and baffles keep veiling glare from lifting the black floor, which ties into the black-level budget.'] },
      { id: 'honest-fov-note', title: 'Honest FOV note', eyebrow: 'Field of view', headline: 'Your whole field of view.', footnote: 'Stretch design targets.', body: [
        'Up to about 160° per eye, and 200°+ across both eyes.'] },
      { id: 'no-screen-door-no-mura', title: 'No screen-door, no mura', eyebrow: 'No grid', headline: 'No screen-door. No mura.', body: [
        "With no grid, there's nothing to see between pixels."] },
      { id: 'varifocal-relay', title: 'Varifocal relay', eyebrow: 'Moonshot', headline: 'Next: focus that follows you.', body: [
        'A moonshot beyond the Gaze-Cone baseline: an eyepiece whose focus follows where your eye is looking. It is not part of the design study\'s baseline.'] },
    ],
  },
  {
    number: 9, id: 'safe-on-your-face', title: 'Safe on Your Face', transition: 'shield', tagline: 'Safe on your face.', sections: [
      { id: 'high-voltage', title: 'High voltage', eyebrow: 'High voltage', headline: 'High voltage, sealed away.', body: [
        'Potted high-voltage modules at the temples, with an instant fail-safe beam kill.'] },
      { id: 'x-rays', title: 'X-rays', eyebrow: 'X-rays', headline: 'X-rays? Effectively none.', body: [
        'At 2–10 kV beam energy, the soft X-rays are fully absorbed by the glass envelope, effectively zero at the eye.'] },
      { id: 'heat-and-power', title: 'Heat and power', eyebrow: 'Power', headline: 'Power only where there\'s light.', body: [
        'Power is drawn only where pixels are lit.'] },
      { id: 'weight-and-balance', title: 'Weight and balance', eyebrow: 'Weight', headline: 'Balanced on your head.', body: [
        'Design target: about 300 g per eye for the panel module (glass cap about 140 g, side-fired gun and deflection about 100 g, optics about 60 g). The side-fired guns run back toward the temples, so the mass sits close to the head\'s center. The full-stack weight is open question №1.'] },
    ],
  },
  {
    number: 10, id: 'built-to-last', title: 'Built to Last', transition: 'timelapse', tagline: 'Built to last.', sections: [
      { id: 'burn-in', title: 'Burn-in', eyebrow: 'Burn-in', headline: 'Burn-in, compensated.', body: [
        "Hexa-Index tracks every subpixel's aging and evens it out."] },
      { id: 'vacuum-lifetime', title: 'Vacuum lifetime', eyebrow: 'Vacuum', headline: 'A vacuum that stays a vacuum.', body: [
        'Non-evaporable getters (NEG) keep the vacuum by soaking up gas over the panel\'s whole life, the same approach long-life vacuum tubes and FEDs use. Getter capacity against outgassing is open question №9.'] },
      { id: 'durability', title: 'Durability', eyebrow: 'Durability', headline: 'Tough by shape.', body: [
        'The shallow cap bows into the vacuum, so it carries the vacuum load in tension, like a membrane, at about 1–2 MPa, far below strengthened glass\'s limit. Chemically strengthened glass and vacuum-side ribs outside the active area hold it.'] },
    ],
  },
  {
    number: 11, id: 'certified', title: 'Certified', transition: 'seals', tagline: 'Certified, top to bottom.', sections: [
      { id: 'badge-wall', title: 'Certifications', kind: 'badges', eyebrow: 'Certified', headline: 'Certified, top to bottom.', footnote: 'Targeted, at the faceplate.', items: [
        { label: 'VESA DisplayHDR 1400' }, { label: 'DisplayHDR True Black 1000' }, { label: 'ClearMR 21000' },
        { label: 'AdaptiveSync Display' }, { label: 'AMD FreeSync Premium Pro' }, { label: 'NVIDIA G-SYNC (Pulsar-class)' },
        { label: 'Pantone Validated + SkinTone Validated' }, { label: 'Calman Verified' },
        { label: 'TÜV Rheinland Low Blue Light (Hardware) + Eye Comfort' }] },
    ],
  },
  {
    number: 12, id: 'proof', title: 'Proof', transition: 'race', tagline: 'The proof.', sections: [
      { id: 'versus', title: 'Versus', kind: 'comparison', interactive: 'comparison-table', eyebrow: 'Versus', headline: 'CRT-VR vs. everything.' },
      { id: 'full-specs', title: 'Full specs', kind: 'specs', eyebrow: 'Specs', headline: 'Every number.', footnote: 'All figures are design targets at TRL 2–3.' },
      { id: 'engineering-honesty', title: 'Engineering honesty', kind: 'honesty', eyebrow: 'Honesty', headline: "What we don't know yet." },
    ],
  },
];
