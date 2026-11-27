/**
 * Act 11 · official certification marks, keyed by the badge label in crt-vr.ts.
 * Files and their source URLs: src/assets/crt-vr/certs/README.md.
 * Used by the badge wall (CertBadgeWall.astro) and the Act 11 seal transition.
 */
import hdr1400 from '../assets/crt-vr/certs/displayhdr-1400.png?url';
import tb1000 from '../assets/crt-vr/certs/displayhdr-true-black-1000.png?url';
import clearmr from '../assets/crt-vr/certs/clearmr-21000.jpg?url';
import adaptivesync from '../assets/crt-vr/certs/adaptivesync-display.jpg?url';
import freesync from '../assets/crt-vr/certs/freesync-premium-pro.png?url';
import gsync from '../assets/crt-vr/certs/g-sync.svg?url';
import pantone from '../assets/crt-vr/certs/pantone-validated.png?url';
import skintone from '../assets/crt-vr/certs/pantone-skintone-validated.png?url';
import calman from '../assets/crt-vr/certs/calman-verified.png?url';
import tuv from '../assets/crt-vr/certs/tuv-rheinland-certified.png?url';

export interface CertMark { src: string; alt: string; dark?: boolean; zoom?: number }

/** `dark: true` marks are drawn for dark backgrounds (white artwork). `zoom` offsets
 *  transparent padding baked into the official file. */
export const CERT_MARKS: Record<string, CertMark[]> = {
  'VESA DisplayHDR 1400': [{ src: hdr1400, alt: 'VESA DisplayHDR 1400 logo' }],
  'DisplayHDR True Black 1000': [{ src: tb1000, alt: 'VESA DisplayHDR True Black 1000 logo', zoom: 1.8 }],
  'ClearMR 21000': [{ src: clearmr, alt: 'VESA ClearMR 21000 logo' }],
  'AdaptiveSync Display': [{ src: adaptivesync, alt: 'VESA AdaptiveSync Display logo' }],
  'AMD FreeSync Premium Pro': [{ src: freesync, alt: 'AMD FreeSync Premium Pro logo', dark: true }],
  'NVIDIA G-SYNC (Pulsar-class)': [{ src: gsync, alt: 'NVIDIA G-SYNC logo', dark: true }],
  'Pantone Validated + SkinTone Validated': [
    { src: pantone, alt: 'Pantone Validated logo' },
    { src: skintone, alt: 'Pantone SkinTone Validated logo' },
  ],
  'Calman Verified': [{ src: calman, alt: 'Calman Verified logo' }],
  'TÜV Rheinland Low Blue Light (Hardware) + Eye Comfort': [{ src: tuv, alt: 'TÜV Rheinland Certified mark' }],
};
