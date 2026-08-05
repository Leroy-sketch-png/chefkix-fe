# Q112 Diff Record

## Active Motion Authority

- Added 200ms fade-in, slide-in-down, and slide-in-up entrances.
- Reused the existing 300ms scale-in contract.
- Restored marquee and border-beam utilities in CSS-first Tailwind-v4 output.
- Preserved the global reduced-motion override for every restored animation.

## Call-Site Normalization

- Replaced `animate-fadeIn`, `animate-scaleIn`, `animate-slideInDown`, and `animate-slideInUp` with canonical kebab-case names.
- Updated Community, NotificationsPopup, and reusable modal/toast/empty-state surfaces without changing layout or state.

## Beam Geometry

- Replaced irrelevant `offset-distance` animation with `stroke-dashoffset`.
- Bound the target offset to the rendered SVG path length derived from `1000 + beamSize`.

## Regression Coverage

- Global contract rejects camelCase animation utilities and requires all six selectors/keyframes.
- Rendered BorderBeam test proves class, duration, path length, and dynamic travel distance.
