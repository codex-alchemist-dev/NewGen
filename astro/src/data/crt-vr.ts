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
      { id: 'the-reveal', title: 'The reveal', kind: 'stats', eyebrow: '02 · The numbers', headline: 'The fastest display technology in the world.', footnote: 'OLED is still catching up. † Design targets.', items: [
        { value: '<1', unit: 'µs', label: 'Response', color: '#00ff99' },
        { value: '0', label: 'Motion blur', color: '#00b4ff' },
        { value: '180°+', label: 'Field of view', color: '#ffe135' },
        { value: '24K', label: 'Per eye', color: '#ff3c6e' },
        { value: '∞:1', label: 'True black', color: '#f0f4ff' },
        { value: '6', label: 'Primaries', color: 'six' }] },
      { id: 'no-pixels', title: 'No pixels. Ever.', eyebrow: '03 · No grid', headline: 'No pixels. Ever.', interactive: 'pixel-vs-soft', body: [
        "Even at 480i, a CRT never shows a pixel grid. The beam's soft spot melts into the phosphor. That's why CRT-VR's foveation feels invisible: away from where you look, the image gets softer, never blocky. Your peripheral vision is soft anyway, so the illusion never breaks."] },
      { id: 'the-comeback', title: 'The comeback', eyebrow: '04 · Ahead of its time', headline: 'The industry left it behind. It was simply ahead of its time.', interactive: 'crt-history-timeline', body: [
        'CRT was called bulky, inefficient, retro. What no one saw was the medium it was made for: a tiny screen right in front of your eye, where size stops mattering, and motion, black and the absence of pixels matter most. Then VR arrived.'] },
      { id: 'sony-lineage', title: 'The Sony lineage', eyebrow: '05 · Lineage', headline: 'Sixty years of Sony, in every beam.', interactive: 'sony-lineage-tree', body: [
        'Chromatron focused the beam. Trinitron converged it. Watchman flattened it. BVM made it the reference. Sony microOLED took it to the eye. CRT-VR brings them all together.'] },
      { id: 'built-by-newgen', title: 'Built by NewGen', eyebrow: '06 · Built by NewGen', headline: 'One panel. Every expert.', visual: 'contribution-map', body: [
        'Sony brings the tube, the color and the glass. Intel Eventide brings the link and the scan silicon. Lightmatter brings the light-speed interconnect.',
        'Launch partners: ShallXR · Play For Dream'] },
    ],
  },
  {
    number: 2, id: 'gaze-native', title: 'Gaze-Native', transition: 'eye', tagline: 'The beam goes where your eye goes.', sections: [
      { id: 'hardware-foveation', title: 'Hardware foveation', interactive: 'gaze-scan-density', eyebrow: 'Hardware foveation', headline: 'Foveated in the hardware.', body: [
        "A grid panel draws every pixel, every frame, whether or not you're looking. CRT-VR's beam follows your gaze. Full detail where you look, interlaced detail around it, and a fast, low-res edge tuned for catching motion."] },
      { id: 'skip-scan', title: 'Skip-Scan', interactive: 'scan-model-sim', eyebrow: 'Skip-Scan', headline: 'Skip what you can\'t see.', body: [
        "The beam still reads a normal frame, one scan line at a time. Where you aren't looking, it jumps straight past the dots it doesn't need instead of stopping at each one. Your GPU renders frames as usual. The panel does the rest."] },
      { id: 'built-for-how-eyes-see', title: 'Built for how eyes actually see', interactive: 'acuity-curve', eyebrow: 'Acuity', headline: 'Built for how eyes actually see.', body: [
        "Your sharpest vision covers about 2°. Beyond that, acuity falls off fast. CRT-VR's resolution map follows the same curve, so no beam time is spent on detail your eye can't use."] },
      { id: 'three-zones', title: 'The three zones, up close', interactive: 'zone-inspector', eyebrow: 'Three zones', headline: 'Three zones. One seamless image.', body: [
        'Fovea: Full 24K-class density, drawn every frame.',
        'Mid-zone: Lower resolution, interlaced, alternating lines each frame.',
        'Edge: Low resolution, never interlaced, and built for spotting motion.'] },
      { id: 'grid-vs-crt', title: "Why grid panels can't do this", interactive: 'grid-vs-crt-foveation', eyebrow: 'Flat panels', headline: "Why flat panels can't do this.", body: [
        'On OLED and LCD, foveation only saves GPU work. The panel still drives every pixel at a fixed refresh, and the periphery turns to blocks. On CRT-VR, every skipped dot is beam time saved, and that time becomes refresh rate.'] },
      { id: 'real-eye-freedom', title: 'Real eye freedom', interactive: 'eye-roam', eyebrow: 'Eye freedom', headline: 'Look with your eyes, not your neck.', body: [
        "In today's VR you turn your head because only the center is sharp. CRT-VR's relay is uniform across 180°+, so you can glance the way you do in real life, and it's sharp wherever you land."] },
      { id: 'foveation-presets', title: 'Foveation presets: Quality / Balanced / Velocity', eyebrow: 'Presets', headline: 'Quality. Balanced. Velocity.', body: [
        'Choose how hard the panel foveates, from 226 Hz to 800+ Hz.'] },
      { id: 'end-to-end-pipeline', title: 'End-to-end foveated pipeline', visual: 'foveated-pipeline', eyebrow: 'Pipeline', headline: 'Foveated end to end.', body: [
        'Gaze in, foveated frame in, over Intel Eventide iDP. The GPU renders only what the beam will draw, cutting link bandwidth by about 10–20×.'] },
    ],
  },
  {
    number: 3, id: 'velocity', title: 'Velocity', transition: 'warp', tagline: 'One screen. Thousands of refreshes a second.', sections: [
      { id: 'vari-refresh', title: 'Vari-refresh', interactive: 'skip-coarseness-hz', kind: 'stats', eyebrow: 'Vari-refresh', headline: 'The less it draws, the faster it gets.', footnote: '† Design targets, to be recomputed at 24K.', body: [
        "CRT-VR refreshes the whole screen in a single raster pass. Where detail isn't needed, the beam takes bigger jumps, so the frame finishes sooner and the screen refreshes faster."], items: [
        { value: '226 Hz', label: 'Minimum' },
        { value: '800+ Hz', label: 'Aggressive foveation' },
        { value: '2200+ Hz', label: 'Looking into a corner' }] },
      { id: 'mafr', title: 'Motion-Adaptive Foveated Rendering', interactive: 'motion-adaptive-timeline', eyebrow: 'Saccade banking', headline: 'It knows when your eyes jump.', body: [
        'During a saccade your brain briefly stops seeing. CRT-VR uses that moment: it drops to its coarsest scan, refresh spikes, and it is caught up by the time your eyes land.'] },
      { id: 'traveling-wave-deflection', title: 'Traveling-Wave Deflection', interactive: 'slew-compare', eyebrow: 'Traveling-Wave Deflection', headline: 'Steering at the speed of the beam.', body: [
        'The deflection plates are split into segments whose field travels with the electrons, which allows GHz-class beam steering.'] },
      { id: 'charge-dense-dwell', title: 'Charge-Dense Dwell', eyebrow: 'Charge-Dense Dwell', headline: 'Half a nanosecond per dot.', body: [
        "A Schottky source with huge current headroom delivers each dot's charge in about 0.5 ns instead of 4."] },
      { id: 'open-loop-slew', title: 'Open-Loop Slew + Hexa-Index Correction', eyebrow: 'Open-Loop Slew', headline: 'Jump now. Correct next pass.', body: [
        "The beam doesn't wait to settle. Hexa-Index measures where it landed and corrects it on the next pass."] },
      { id: 'nanosecond-qds', title: 'Nanosecond QDs', eyebrow: 'Nanosecond QDs', headline: 'No afterglow. Ever.', body: [
        "Quantum dots fade in nanoseconds, so even at 2200+ Hz there's no ghosting."] },
    ],
  },
  {
    number: 4, id: 'rgbmcy', title: 'RGBMCY', transition: 'six-beam', tagline: 'RGBMCY. Colors no screen has shown you.', sections: [
      { id: 'why-three-isnt-enough', title: "Six Primaries: why three isn't enough", interactive: 'gamut-explorer', eyebrow: 'Why three', headline: 'Three colors were never enough.', body: [
        'Every screen you own mixes red, green and blue. That triangle leaves out huge parts of what your eye can see, especially the deep cyans and greens.'] },
      { id: 'meet-the-six', title: 'Meet the six', eyebrow: 'Meet the six', headline: 'Meet the six.', body: [
        'Blue 450 · Cyan 490 · Green 520 · Yellow 575 · Red 635 nm, and a true magenta. Cyan fills the gap three-color screens miss. Yellow lifts brightness. Magenta paints pure purples from a single subpixel.'] },
      { id: 'hexagon-pixel', title: 'The Hexagon pixel', interactive: 'hex-zoom', eyebrow: 'The Hexagon', headline: 'The Hexagon.', body: [
        'Every pixel is an RGB triangle and an inverted MCY triangle, six subpixels in one perfect hex.'] },
      { id: 'six-beams-one-gun', title: 'Six beams, one gun', interactive: 'six-beam-convergence', eyebrow: 'Six beams', headline: 'Six beams. One gun.', body: [
        'Trinitron converged three beams. CRT-VR converges six, and each lands only on its own color.'] },
      { id: 'the-gamut', title: 'The gamut', interactive: 'coverage-calc', eyebrow: 'Gamut', headline: 'Up to ~185% of DCI-P3.', footnote: '† Design estimate, CIE 1931 xy.', body: [
        'About 80% of everything the human eye can see. Next target: 200%.'] },
      { id: 'gamut-innovations', title: 'Gamut innovations', eyebrow: 'Innovations', headline: 'Purity, engineered.', body: [
        'Nanoplatelet quantum dots, near-laser narrow',
        "Resonant Wells that tune every subpixel's light",
        'Dichroic trim that shaves off impure edges',
        'Zero cross-talk: no beam ever touches a neighbor'] },
      { id: 'puretone', title: 'Puretone™', interactive: 'puretone-picker', eyebrow: 'Puretone™', headline: 'Puretone™. The purest way to every color.', body: [
        'Every subpixel can work alone. Pure cyan lights only cyan. CRT-VR always builds a color from the fewest, closest pure tones, so color stays clean and power stays low. Only when you need more brightness do other tones join in.'] },
      { id: 'gamut-mapping-pipeline', title: 'Gamut-mapping pipeline', eyebrow: 'Mapping', headline: 'Any content. Six-primary output.', body: [
        "RGB, P3 or Rec.2020 in, RGBMCY out, handled on the panel's controller."] },
      { id: 'color-depth', title: 'Color depth', eyebrow: 'Depth', headline: '12 bits per primary.', body: [
        'Six primaries, 12 bits each, for gradients without a single band.'] },
      { id: 'what-you-gain', title: 'What you gain', eyebrow: 'What you\'ll see', headline: "What you'll see.", body: [
        "Colors you've never seen on a screen. Skin and foliage that look real. Sunsets without banding."] },
    ],
  },
  {
    number: 5, id: 'brilliance', title: 'Brilliance', transition: 'default', tagline: 'Blinding light. Absolute black.', sections: [
      { id: 'the-numbers', title: 'The numbers', kind: 'stats', eyebrow: 'The numbers', headline: 'Bright enough to squint.', footnote: "† Design targets at the faceplate, pending confirmation. Today's headsets deliver about 100–200 nits at the eye.", items: [
        { value: '1,500', unit: 'nits', label: 'Full screen' },
        { value: '4,000+', unit: 'nits', label: 'Highlights' },
        { value: '1,000+', unit: 'nits', label: 'At your eye' }] },
      { id: 'photon-cups', title: 'Photon Cups', eyebrow: 'Photon Cups', headline: 'Every photon, forward.', body: [
        'Mirrored subpixel wells turn light that would be lost sideways toward your eye.'] },
      { id: 'directional-outcoupling', title: 'Directional Outcoupling', interactive: 'emission-compare', eyebrow: 'Outcoupling', headline: 'Light, aimed.', body: [
        "A micro-structured faceplate sends each subpixel's light straight into the lens, instead of scattering it everywhere."] },
      { id: 'many-pass-linearity', title: 'Many-Pass Linearity', eyebrow: 'Many-Pass', headline: 'Faster is brighter.', body: [
        'More refreshes mean less charge per hit, so quantum dots stay efficient instead of saturating.'] },
      { id: 'gaze-peak-hdr', title: 'Gaze-Peak HDR', eyebrow: 'Gaze-Peak HDR', headline: 'Highlights where you look.', body: [
        'HDR headroom follows your fovea.'] },
      { id: 'true-black', title: 'True Black', interactive: 'black-floor-stack', eyebrow: 'True Black', headline: 'True black. Not dim. Off.', body: [
        "Kurocoat ultra-black wells, a black matrix, beam blanking to about 1 part in 100,000, and glare control. Where the beam doesn't go, there is simply no light."] },
    ],
  },
  {
    number: 6, id: 'motion', title: 'Motion', transition: 'default', tagline: 'The crown it never lost.', sections: [
      { id: 'motion-crown', title: 'The motion crown', interactive: 'motion-lineage-chart', eyebrow: 'The crown', headline: 'Decades at the top.', body: [
        'For decades CRT owned motion clarity and response time. Esports players and purists kept theirs long after flat panels took over. LCD never caught up. OLED is still chasing it with black-frame tricks and 480 Hz races. CRT-VR widens the gap.'] },
      { id: 'zero-smear', title: 'Zero smear', eyebrow: 'Zero smear', headline: 'Zero smear.', body: [
        'Light that flashes and fades in an instant, with no black frames needed and no brightness lost.'] },
      { id: 'photon-latency', title: 'Photon latency', eyebrow: 'Latency', headline: 'From gaze to photon, instantly.', body: [
        'Gaze coordinates steer the scan the moment they arrive, and the beam draws straight out of the incoming frame.'] },
      { id: 'judder-free', title: 'Judder-free', interactive: 'motion-blur-compare', eyebrow: 'Judder-free', headline: 'Smoother than the content.', body: [
        'The screen refreshes far faster than any game renders, so motion never judders.'] },
    ],
  },
  {
    number: 7, id: 'the-machine', title: 'The Machine', transition: 'default', tagline: 'A tube, reimagined from the electron up.', sections: [
      { id: 'side-fire-tube', title: 'Side-fire tube', interactive: 'exploded-tube', eyebrow: 'Side-fire', headline: 'Fired from the side.', body: [
        "Inspired by Sony's Watchman flat CRT. The guns sit at your temples and fire across the screen, so there's no deep tube in front of your face, and the weight sits where your head carries it best."] },
      { id: 'dome-faceplate', title: 'Dome faceplate', eyebrow: 'Dome', headline: 'A dome, not a slab.', body: [
        "The faceplate is a concave wraparound cap, 6–8 mm thick, with vacuum-side ribs outside the active area. It takes far less glass than any CRT before it."] },
      { id: 'faceplate-first-lens', title: 'Faceplate = first lens', eyebrow: 'First lens', headline: 'The screen is the first lens.', body: [
        "The dome's outer surface is the first element of the optics."] },
      { id: 'the-gun', title: 'The gun', interactive: 'gun-shootout', eyebrow: 'The gun', headline: 'One gun. Six beams.', body: [
        'A Schottky field-emission source, chosen after a four-way shootout.'] },
      { id: 'focus-well-hexagons', title: 'Focus-Well Hexagons', interactive: 'beam-funnel', eyebrow: 'Focus-Wells', headline: 'Every subpixel aims the beam.', body: [
        "A modern revival of Sony's Chromatron. Charged rims around each subpixel funnel the beam into its center, so it lands perfectly even at an angle."] },
      { id: 'hexa-index', title: 'Hexa-Index', interactive: 'hexa-emission', eyebrow: 'Hexa-Index', headline: 'It always knows where the beam is.', body: [
        'Every subpixel rim gives off a tiny signal when the beam touches it. A ring of sensors reads those signals and locks all six beams onto their targets, live.',
        'Beam lock · Drift correction · Keystone correction · Aging compensation · Stuck-beam protection'] },
      { id: 'density', title: 'Density', interactive: 'pitch-calc', eyebrow: 'Density', headline: '24K in four inches.', body: [
        'About 3.4 µm pixels and 2 µm subpixels, with a low-voltage beam whose spread fits inside each one.'] },
    ],
  },
  {
    number: 8, id: 'wraparound-optics', title: 'Wraparound Optics', transition: 'rays', tagline: 'Made for VR. Before VR existed.', sections: [
      { id: 'cone-in-cone-out', title: 'Cone in, cone out', interactive: 'flat-vs-cone', eyebrow: 'Cone', headline: 'Born a cone.', body: [
        "A flat panel has to stretch a rectangle around your eye, which is where distortion and the screen-in-a-box feel come from. A CRT's light already leaves as a cone. CRT-VR's optics simply turn that cone around to wrap your eye. The panel the industry tried to leave behind was simply ahead of its time."] },
      { id: 'monocentric-relay', title: 'Gaze-Cone optics', interactive: 'rotate-eye', eyebrow: 'Gaze-Cone', headline: 'Sharp across the cone your eye sweeps.', body: [
        'A curved-field aspheric eyepiece per eye, uniformly sharp across the ±50° cone the eye can rotate through, with softening only out in peripheral vision to 160° per eye.',
        'Beyond the cone, a thin Periphery Ring carries the wraparound faceplate out to 160° per eye, where your vision is peripheral anyway.'] },
      { id: 'faceplate-is-first-lens', title: 'The faceplate is the first lens', eyebrow: 'First lens', headline: 'One less lens.', body: [
        'The dome faceplate doubles as the first optical element.'] },
      { id: 'optics-tiers', title: 'Optics tiers: Sony, G, G Master, G Master with ZEISS T*', interactive: 'tier-compare', eyebrow: 'Tiers', headline: 'Glass worthy of the image.', body: [
        'Sony · Sony G · G Master · G Master with ZEISS T*. Every tier uses fixed spacing with no pancake folds, so there are no ghosts and no sweet spot.'] },
      { id: 'field-curvature-match', title: 'Field-curvature match', eyebrow: 'Field curvature', headline: 'Edge to edge.', body: [
        'The curved screen cancels the optics\' field curvature, so it stays sharp right out to the edges.'] },
      { id: 'per-beam-ca-prewarp', title: 'Per-beam chromatic-aberration pre-warp', interactive: 'fringe-toggle', eyebrow: 'CA pre-warp', headline: 'Fringe-free, in hardware.', body: [
        "Each of the six beams pre-bends its own color to cancel the lens's chromatic fringing."] },
      { id: 'pupil-swim-correction', title: 'Pupil-swim correction', eyebrow: 'Pupil swim', headline: 'The world never wobbles.', body: [
        'As your eye turns, the panel adjusts its geometry every frame.'] },
      { id: 'eyebox-and-eye-relief', title: 'Eyebox and eye relief', eyebrow: 'Eyebox', headline: 'Room for you.', body: [
        'A generous eyebox, space for glasses, and wide IPD range.'] },
      { id: 'glare-and-ghost-control', title: 'Glare and ghost control', eyebrow: 'Glare', headline: 'Darkness, protected.', body: [
        'A Kurocoat-lined barrel keeps stray light from lifting the blacks.'] },
      { id: 'honest-fov-note', title: 'Honest FOV note', eyebrow: 'Field of view', headline: 'Your whole field of view.', footnote: '† Stretch design targets.', body: [
        'Up to about 160° per eye, and 200°+ across both eyes.'] },
      { id: 'no-screen-door-no-mura', title: 'No screen-door, no mura', eyebrow: 'No grid', headline: 'No screen-door. No mura.', body: [
        "With no grid, there's nothing to see between pixels."] },
      { id: 'varifocal-relay', title: 'Varifocal relay', eyebrow: 'Moonshot', headline: 'Next: focus that follows you.', body: [
        "Moonshot: varifocal optics that match your focus to what you're looking at."] },
    ],
  },
  {
    number: 9, id: 'safe-on-your-face', title: 'Safe on Your Face', transition: 'default', tagline: 'Safe on your face.', sections: [
      { id: 'high-voltage', title: 'High voltage', eyebrow: 'High voltage', headline: 'High voltage, sealed away.', body: [
        'Potted high-voltage modules at the temples, with an instant fail-safe beam kill.'] },
      { id: 'x-rays', title: 'X-rays', eyebrow: 'X-rays', headline: 'X-rays? Effectively none.', body: [
        'At 2–10 kV, X-ray output is negligible, and the glass faceplate absorbs what little there is.'] },
      { id: 'heat-and-power', title: 'Heat and power', eyebrow: 'Power', headline: 'Power only where there\'s light.', body: [
        'A CRT spends energy only on the pixels it lights, so dark scenes cost almost nothing.'] },
      { id: 'weight-and-balance', title: 'Weight and balance', eyebrow: 'Weight', headline: 'Balanced on your head.', body: [
        'Side-fire tubes put the mass at your temples.'] },
    ],
  },
  {
    number: 10, id: 'built-to-last', title: 'Built to Last', transition: 'default', tagline: 'Built to last.', sections: [
      { id: 'burn-in', title: 'Burn-in', eyebrow: 'Burn-in', headline: 'Burn-in, compensated.', body: [
        "Hexa-Index tracks every subpixel's aging and evens it out."] },
      { id: 'vacuum-lifetime', title: 'Vacuum lifetime', eyebrow: 'Vacuum', headline: 'A vacuum that stays a vacuum.', body: [
        'Thin-film getters absorb gas for the life of the panel.'] },
      { id: 'durability', title: 'Durability', eyebrow: 'Durability', headline: 'Tough by shape.', body: [
        "The concave wraparound cap, 6–8 mm with vacuum-side ribs outside the active area, carries the vacuum load at a fraction of a classic CRT's glass mass."] },
    ],
  },
  {
    number: 11, id: 'certified', title: 'Certified', transition: 'default', tagline: 'Certified, top to bottom.', sections: [
      { id: 'badge-wall', title: 'Certifications', kind: 'badges', eyebrow: 'Certified', headline: 'Certified, top to bottom.', footnote: 'Target certifications, measured at the faceplate.', items: [
        { label: 'VESA DisplayHDR 1400' }, { label: 'DisplayHDR True Black 1000' }, { label: 'ClearMR 21000' },
        { label: 'AdaptiveSync Display' }, { label: 'AMD FreeSync Premium Pro' }, { label: 'NVIDIA G-SYNC (Pulsar-class)' },
        { label: 'Pantone Validated + SkinTone Validated' }, { label: 'Calman Verified' },
        { label: 'TÜV Rheinland Low Blue Light (Hardware) + Eye Comfort' }] },
    ],
  },
  {
    number: 12, id: 'proof', title: 'Proof', transition: 'default', tagline: 'The proof.', sections: [
      { id: 'versus', title: 'Versus', kind: 'comparison', interactive: 'comparison-table', eyebrow: 'Versus', headline: 'CRT-VR vs. everything.' },
      { id: 'full-specs', title: 'Full specs', kind: 'specs', eyebrow: 'Specs', headline: 'Every number.', footnote: '† Design targets, TRL 2–3.' },
      { id: 'engineering-honesty', title: 'Engineering honesty', kind: 'honesty', eyebrow: 'Honesty', headline: "What we don't know yet." },
    ],
  },
];
