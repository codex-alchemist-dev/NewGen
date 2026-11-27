# Gaze-Cone optics trace

2D meridional Snell ray trace behind the Act 8 ray-tracer, rotate-eye, flat-vs-cone and
exploded-relay diagrams. Even-asphere surfaces, two cemented aspheric doublets (drawn as
four elements of matched index), 4 mm pupil 10 mm ahead of the eye's centre of rotation,
virtual image at 1.75 m, curved phosphor field. Units: mm.

- `trace.py`: tracer and a Nelder-Mead optimiser (needs numpy and scipy).
- `export.py`: traces the chosen design and writes `gazecone.json`, which was converted into
  `src/components/interactives/crt-vr/wraparound/gazecone-data.ts`.

Traced blur of the drawn design (peak-to-peak spot, arcmin at the eye): about 0.8′ at 0°,
1.3′ at 25° and 2.6′ at 50° eye rotation. The core field ends at about ±50–55°; the
Periphery Ring covers 55°–80°. The drawing compresses depth (illustrative, not to scale).
The design is a long, thick proof of focus, not a packaged headset prescription.
