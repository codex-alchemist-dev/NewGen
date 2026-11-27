/**
 * Act 8 · tier-compare
 * Optics tiers Sony, Sony G, G Master, "G Master with ZEISS T*". Qualitative ranks only
 * (no numbers), per the coordinator. Text labels only, no logos.
 * A bright test target on black shows sharpness (edge blur), flare (halo) and
 * transmission (brightness) for the selected tier.
 */
import { useId, useState } from 'react';
import type { VfxSlotProps } from '../../../lib/motion/types';
import { useTier } from './wraparound/shared';
import './wraparound/wraparound.css';

type TierKey = 'sony' | 'g' | 'gm' | 'zeiss';
interface OpticsTier {
  key: TierKey; label: string; panels: string; glass: string;
  /** Qualitative rank 1..4 (higher is better). */
  sharp: number; flare: number; trans: number;
  blur: number; halo: number; bright: number;   // render parameters only
}

const TIERS: OpticsTier[] = [
  { key: 'sony', label: 'Sony', panels: 'Entry panels', glass: 'Sony-quality aspherical glass', sharp: 1, flare: 1, trans: 1, blur: 1.5, halo: 0.42, bright: 0.84 },
  { key: 'g', label: 'Sony G', panels: 'Mid-range panels', glass: 'G-series elements and coatings', sharp: 2, flare: 2, trans: 2, blur: 0.95, halo: 0.28, bright: 0.89 },
  { key: 'gm', label: 'G Master', panels: 'High-end panels', glass: 'XA extreme-aspherical elements, Nano AR Coating II, full G Master coating stack', sharp: 4, flare: 3, trans: 3, blur: 0.3, halo: 0.14, bright: 0.94 },
  { key: 'zeiss', label: 'G Master with ZEISS T*', panels: 'Select flagship panels', glass: 'The full G Master relay with ZEISS T* coating', sharp: 4, flare: 4, trans: 4, blur: 0.3, halo: 0.06, bright: 0.98 },
];

const METRICS: Array<{ k: 'sharp' | 'flare' | 'trans'; label: string }> = [
  { k: 'sharp', label: 'Sharpness' },
  { k: 'flare', label: 'Flare control' },
  { k: 'trans', label: 'Transmission' },
];

export default function TierCompare(props: Partial<VfxSlotProps>) {
  const tier = useTier(props.tier ?? 'full');
  const [sel, setSel] = useState<TierKey>('gm');
  const uid = useId().replace(/:/g, '');
  const t = TIERS.find((x) => x.key === sel)!;
  const animate = tier !== 'static';
  const tr = animate ? 'all .5s cubic-bezier(.16,1,.3,1)' : 'none';

  // Siemens-star-ish spokes + fine bars: a target where blur and flare read instantly.
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a0 = (i * 15 * Math.PI) / 180, a1 = ((i * 15 + 7.5) * Math.PI) / 180;
    return `M160,120 L${160 + 82 * Math.cos(a0)},${120 + 82 * Math.sin(a0)} A82,82 0 0 1 ${160 + 82 * Math.cos(a1)},${120 + 82 * Math.sin(a1)} Z`;
  });

  return (
    <figure className="wo" data-tier={tier} aria-label="Optics tier comparator">
      <p className="wo__eyebrow">Interactive · Optics tiers</p>
      <div className="wo__seg" role="group" aria-label="Choose an optics tier">
        {TIERS.map((x) => (
          <button key={x.key} type="button" aria-pressed={x.key === sel} onClick={() => setSel(x.key)}>{x.label}</button>
        ))}
      </div>

      <div className="wo__grid2" style={{ marginTop: 14 }}>
        <div className="wo__panel">
          <h4>Through the relay · <b>{t.label}</b></h4>
          <svg className="wo__svg" viewBox="0 0 320 240" role="img" aria-label={`Test target seen through the ${t.label} relay`}>
            <defs>
              <filter id={`${uid}-b`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation={t.blur} />
              </filter>
              <radialGradient id={`${uid}-h`}>
                <stop offset="0" stopColor="#e8fbff" stopOpacity="1" />
                <stop offset=".25" stopColor="#c8f6ff" stopOpacity=".55" />
                <stop offset="1" stopColor="#c8f6ff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="320" height="240" fill="#020306" />
            <g filter={`url(#${uid}-b)`} style={{ opacity: t.bright, transition: tr }}>
              {spokes.map((d, i) => <path key={i} d={d} fill="#e9f3ff" />)}
              <circle cx="160" cy="120" r="6" fill="#020306" />
              {Array.from({ length: 9 }, (_, i) => (
                <rect key={i} x={262 + i * 4.6} y="40" width="2.3" height="56" fill="#e9f3ff" />
              ))}
              <circle cx="40" cy="196" r="3.2" fill="#ffffff" />
            </g>
            {/* veiling flare from the bright point source; lifts the black around it */}
            <circle cx="40" cy="196" r="70" fill={`url(#${uid}-h)`} style={{ opacity: t.halo * 1.6, transition: tr }} />
            <rect width="320" height="240" fill="#c8f6ff" style={{ opacity: t.halo * 0.12, transition: tr }} />
            <text x="12" y="228" fontSize="9" fill="#6a7fa8">point source</text>
            <text x="262" y="110" fontSize="9" fill="#6a7fa8">fine bars</text>
          </svg>
        </div>

        <div className="wo__panel">
          <h4>Qualitative rank · <b>{t.label}</b></h4>
          <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
            {METRICS.map((m) => (
              <div key={m.k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--wo-dim)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  <span>{m.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, marginTop: 5 }} aria-label={`${m.label}: rank ${t[m.k]} of 4`} role="img">
                  {[1, 2, 3, 4].map((s) => (
                    <span key={s} style={{
                      height: 10, borderRadius: 3,
                      background: s <= t[m.k] ? 'linear-gradient(90deg,#00e1ff,#c8f6ff)' : 'rgba(200,246,255,.08)',
                      boxShadow: s <= t[m.k] && tier === 'full' ? '0 0 10px rgba(0,225,255,.35)' : 'none',
                      transition: tr,
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <dl style={{ margin: '16px 0 0', display: 'grid', gap: 6 }}>
            <div><dt className="wo__readout"><span>For</span></dt><dd style={{ margin: 0, color: 'var(--wo-ice)' }}>{t.panels}</dd></div>
            <div><dt className="wo__readout"><span>Glass and coatings</span></dt><dd style={{ margin: 0, color: 'var(--wo-text)' }}>{t.glass}</dd></div>
          </dl>
        </div>
      </div>
      <p className="wo__note">Every tier keeps the same fixed spacing with no pancake folds, so <b>no ghosts and no sweet-spot loss</b> on any of them. Ranks are qualitative.</p>
    </figure>
  );
}
