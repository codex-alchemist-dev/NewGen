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
  /** Extra data for stats, badges, comparison and specs sections. */
  items?: { label: string; value?: string; note?: string; cells?: (string | boolean)[] }[];
  columns?: string[];
  footnote?: string;
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
      { id: 'hero', title: 'Hero', kind: 'hero', visual: 'hero-animatic' },
      { id: 'the-problem', title: 'The problem' },
      { id: 'the-reveal', title: 'The reveal', kind: 'stats', items: [
        { label: 'Fastest display tech in the world' }, { label: 'Zero motion blur' }, { label: '180°+ FOV' },
        { label: '24K per eye' }, { label: 'True Black' }, { label: '6 primaries' }] },
      { id: 'no-pixels', title: 'No pixels. Ever.', interactive: 'pixel-vs-soft' },
      { id: 'the-comeback', title: 'The comeback', interactive: 'crt-history-timeline' },
      { id: 'sony-lineage', title: 'The Sony lineage', interactive: 'sony-lineage-tree' },
      { id: 'built-by-newgen', title: 'Built by NewGen', visual: 'contribution-map' },
    ],
  },
  {
    number: 2, id: 'gaze-native', title: 'Gaze-Native', transition: 'eye', sections: [
      { id: 'hardware-foveation', title: 'Hardware foveation', interactive: 'gaze-scan-density' },
      { id: 'skip-scan', title: 'Skip-Scan', interactive: 'scan-model-sim' },
      { id: 'built-for-how-eyes-see', title: 'Built for how eyes actually see', interactive: 'acuity-curve' },
      { id: 'three-zones', title: 'The three zones, up close', interactive: 'zone-inspector' },
      { id: 'grid-vs-crt', title: "Why grid panels can't do this", interactive: 'grid-vs-crt-foveation' },
      { id: 'real-eye-freedom', title: 'Real eye freedom', interactive: 'eye-roam' },
      { id: 'foveation-presets', title: 'Foveation presets: Quality / Balanced / Velocity' },
      { id: 'end-to-end-pipeline', title: 'End-to-end foveated pipeline', visual: 'foveated-pipeline' },
    ],
  },
  {
    number: 3, id: 'velocity', title: 'Velocity', transition: 'warp', sections: [
      { id: 'vari-refresh', title: 'Vari-refresh', interactive: 'skip-coarseness-hz' },
      { id: 'mafr', title: 'Motion-Adaptive Foveated Rendering', interactive: 'saccade-timeline' },
      { id: 'traveling-wave-deflection', title: 'Traveling-Wave Deflection', interactive: 'slew-compare' },
      { id: 'charge-dense-dwell', title: 'Charge-Dense Dwell' },
      { id: 'open-loop-slew', title: 'Open-Loop Slew + Hexa-Index Correction' },
      { id: 'nanosecond-qds', title: 'Nanosecond QDs' },
    ],
  },
  {
    number: 4, id: 'rgbmcy', title: 'RGBMCY', transition: 'six-beam', sections: [
      { id: 'why-three-isnt-enough', title: "Six Primaries: why three isn't enough", interactive: 'gamut-explorer' },
      { id: 'meet-the-six', title: 'Meet the six' },
      { id: 'hexagon-pixel', title: 'The Hexagon pixel', interactive: 'hex-zoom' },
      { id: 'six-beams-one-gun', title: 'Six beams, one gun', interactive: 'six-beam-convergence' },
      { id: 'the-gamut', title: 'The gamut', interactive: 'coverage-calc' },
      { id: 'gamut-innovations', title: 'Gamut innovations' },
      { id: 'puretone', title: 'Puretone™', interactive: 'puretone-picker' },
      { id: 'gamut-mapping-pipeline', title: 'Gamut-mapping pipeline' },
      { id: 'color-depth', title: 'Color depth' },
      { id: 'what-you-gain', title: 'What you gain' },
    ],
  },
  {
    number: 5, id: 'brilliance', title: 'Brilliance', transition: 'default', sections: [
      { id: 'the-numbers', title: 'The numbers', kind: 'stats' },
      { id: 'photon-cups', title: 'Photon Cups' },
      { id: 'directional-outcoupling', title: 'Directional Outcoupling', interactive: 'emission-compare' },
      { id: 'many-pass-linearity', title: 'Many-Pass Linearity' },
      { id: 'gaze-peak-hdr', title: 'Gaze-Peak HDR' },
      { id: 'true-black', title: 'True Black', interactive: 'black-floor-stack' },
    ],
  },
  {
    number: 6, id: 'motion', title: 'Motion', transition: 'default', sections: [
      { id: 'motion-crown', title: 'The motion crown', interactive: 'motion-lineage-chart' },
      { id: 'zero-smear', title: 'Zero smear' },
      { id: 'photon-latency', title: 'Photon latency' },
      { id: 'judder-free', title: 'Judder-free', interactive: 'motion-blur-compare' },
    ],
  },
  {
    number: 7, id: 'the-machine', title: 'The Machine', transition: 'default', sections: [
      { id: 'side-fire-tube', title: 'Side-fire tube', interactive: 'exploded-tube' },
      { id: 'dome-faceplate', title: 'Dome faceplate' },
      { id: 'faceplate-first-lens', title: 'Faceplate = first lens' },
      { id: 'the-gun', title: 'The gun', interactive: 'gun-shootout' },
      { id: 'focus-well-hexagons', title: 'Focus-Well Hexagons', interactive: 'beam-funnel' },
      { id: 'hexa-index', title: 'Hexa-Index', interactive: 'hexa-emission' },
      { id: 'density', title: 'Density', interactive: 'pitch-calc' },
    ],
  },
  {
    number: 8, id: 'wraparound-optics', title: 'Wraparound Optics', transition: 'rays', sections: [
      { id: 'cone-in-cone-out', title: 'Cone in, cone out', interactive: 'flat-vs-cone' },
      { id: 'monocentric-relay', title: 'Monocentric relay', interactive: 'rotate-eye' },
      { id: 'faceplate-is-first-lens', title: 'The faceplate is the first lens' },
      { id: 'optics-tiers', title: 'Optics tiers: Sony, G, G Master, G Master with ZEISS T*', interactive: 'tier-compare' },
      { id: 'field-curvature-match', title: 'Field-curvature match' },
      { id: 'per-beam-ca-prewarp', title: 'Per-beam chromatic-aberration pre-warp', interactive: 'fringe-toggle' },
      { id: 'pupil-swim-correction', title: 'Pupil-swim correction' },
      { id: 'eyebox-and-eye-relief', title: 'Eyebox and eye relief' },
      { id: 'glare-and-ghost-control', title: 'Glare and ghost control' },
      { id: 'honest-fov-note', title: 'Honest FOV note' },
      { id: 'no-screen-door-no-mura', title: 'No screen-door, no mura' },
      { id: 'varifocal-relay', title: 'Varifocal relay' },
    ],
  },
  {
    number: 9, id: 'safe-on-your-face', title: 'Safe on Your Face', transition: 'default', sections: [
      { id: 'high-voltage', title: 'High voltage' },
      { id: 'x-rays', title: 'X-rays' },
      { id: 'heat-and-power', title: 'Heat and power' },
      { id: 'weight-and-balance', title: 'Weight and balance' },
    ],
  },
  {
    number: 10, id: 'built-to-last', title: 'Built to Last', transition: 'default', sections: [
      { id: 'burn-in', title: 'Burn-in' },
      { id: 'vacuum-lifetime', title: 'Vacuum lifetime' },
      { id: 'durability', title: 'Durability' },
    ],
  },
  {
    number: 11, id: 'certified', title: 'Certified', transition: 'default', sections: [
      { id: 'badge-wall', title: 'Certifications', kind: 'badges', footnote: 'Measured at the faceplate.', items: [
        { label: 'VESA DisplayHDR 1400' }, { label: 'DisplayHDR True Black 1000' }, { label: 'ClearMR 21000' },
        { label: 'AdaptiveSync Display' }, { label: 'AMD FreeSync Premium Pro' }, { label: 'NVIDIA G-SYNC (Pulsar-class)' },
        { label: 'Pantone Validated + SkinTone Validated' }, { label: 'Calman Verified' },
        { label: 'TÜV Rheinland Low Blue Light (Hardware) + Eye Comfort' }] },
    ],
  },
  {
    number: 12, id: 'proof', title: 'Proof', transition: 'default', sections: [
      { id: 'versus', title: 'Versus', kind: 'comparison', interactive: 'comparison-table',
        columns: ['CRT-VR', 'Comparison A'], items: [] },
      { id: 'full-specs', title: 'Full specs', kind: 'specs', items: [] },
      { id: 'engineering-honesty', title: 'Engineering honesty' },
    ],
  },
];
