# Q115 Verification Report

Date: 2026-08-05

## Verified

- `npx prettier --check ...`: passed for all four changed source/test files.
- `npm run typecheck`: passed in 382.4 seconds.
- `npm run lint`: passed with zero warnings or errors in 470.8 seconds.
- `npm test -- --runInBand`: 137 suites and 557 tests passed. Jest retained its
  existing forced-worker-exit teardown warning.
- `npm run build`: Next.js 15.4.6 production build passed; 53/53 static pages
  generated and `/recipes/[id]` emitted.
- Final CSS `d4e56006464a009e.css`: `bg-success/80`, `bg-warning/80`,
  `bg-error/80`, and `bg-xp/80` selectors are all present. Each occurs twice in
  the optimized artifact; selector presence, not bundler deduplication, is the
  product invariant.
- Production source sweep: no literal-transparent color animation and no
  difficulty `replace`/`concat` surgery remain.
- `git diff --check`: passed before durable evidence updates.

## Runtime Evidence

- A supported local boot reached semantic frontend and monolith readiness. The
  overall infrastructure command remained nonzero because the separate AI
  service lacks `torch`.
- Expert Tonkotsu at `/recipes/6a2b9fafcef7d0a70f44bb1f` rendered the Expert
  badge with `bg-xp/80`; computed background alpha was 0.8, text was white, the
  hero image loaded, horizontal containment held at 1280 px, and no Next error
  overlay appeared.
- That review exposed eight IngredientCheck color-interpolation warnings. Their
  shared source mechanism is removed and regression-covered. A post-repair
  browser warning recount is tooling-blocked because browser control repeatedly
  reset during navigation; it is not claimed as runtime-verified.

## Residuals

- Representative preference and contrast across the full hero-photo corpus are
  E4/open.
- Final physical browser proof of zero IngredientCheck warnings remains open.
- AI-service startup and Jest teardown leakage are separate pre-existing
  operational debts, not concealed by this checkpoint.
