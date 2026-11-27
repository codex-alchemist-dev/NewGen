import type { ReactNode } from 'react';
import '../ix.css';

export function Frame(props: {
  id: string;
  eyebrow: string;
  title: string;
  hint?: ReactNode;
  controls?: ReactNode;
  readout?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
  wide?: boolean;
}) {
  return (
    <figure className={`crtvr ix${props.wide ? ' ix--wide' : ''}`} data-ix={props.id}>
      <span className="ix__corner ix__corner--tl" aria-hidden="true" />
      <span className="ix__corner ix__corner--br" aria-hidden="true" />
      <header className="ix__head">
        <p className="ix__eyebrow"><span className="ix__dot" aria-hidden="true" />{props.eyebrow}</p>
        <h4 className="ix__title">{props.title}</h4>
        {props.controls && <div className="ix__controls">{props.controls}</div>}
      </header>
      <div className={`ix__body${props.readout ? '' : ' ix__body--solo'}`}>
        <div className="ix__stage">
          {props.children}
          {props.hint && <p className="ix__hint">{props.hint}</p>}
        </div>
        {props.readout && <div className="ix__readout">{props.readout}</div>}
      </div>
      {props.foot && <figcaption className="ix__foot">{props.foot}</figcaption>}
    </figure>
  );
}

export function Readout(props: { k: string; v: ReactNode; unit?: string; note?: ReactNode; color?: string; big?: boolean }) {
  return (
    <div className={`ro${props.big ? ' ro--big' : ''}`} style={props.color ? ({ '--ro-c': props.color } as React.CSSProperties) : undefined}>
      <p className="ro__k">{props.k}</p>
      <p className="ro__v" aria-live="polite">{props.v}{props.unit && <span className="ro__u">{props.unit}</span>}</p>
      {props.note && <p className="ro__n">{props.note}</p>}
    </div>
  );
}

export function Slider(props: { id: string; label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; valueText?: string }) {
  const { min = 0, max = 100, step = 1 } = props;
  const pct = ((props.value - min) / (max - min)) * 100;
  return (
    <label className="sl" htmlFor={props.id}>
      <span className="sl__l">{props.label}{props.valueText && <b>{props.valueText}</b>}</span>
      <input
        id={props.id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={props.value}
        style={{ '--p': `${pct}%` } as React.CSSProperties}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Seg<T extends string>(props: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={props.value === o.v}
          className={props.value === o.v ? 'is-on' : ''}
          onClick={() => props.onChange(o.v)}
        >{o.l}</button>
      ))}
    </div>
  );
}

export function Legend(props: { items: { c: string; l: string }[] }) {
  return (
    <ul className="lg">
      {props.items.map((i) => (
        <li key={i.l}><span style={{ background: i.c, boxShadow: `0 0 8px ${i.c}` }} />{i.l}</li>
      ))}
    </ul>
  );
}

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
