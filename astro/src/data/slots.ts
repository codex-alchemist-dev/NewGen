/** visual: SVG/animatic (visuals/crt-vr). interactive: React or TS island (interactives/crt-vr). vfx: global or per-act VFX (vfx/). */
export type SlotKind = 'visual' | 'interactive' | 'vfx';

export type TransitionVariant = 'default' | 'eye' | 'warp' | 'six-beam' | 'rays';

/** Section content types. Body copy is placeholder until the coordinator supplies it. */
export type SectionKind = 'text' | 'hero' | 'stats' | 'badges' | 'comparison' | 'specs';
