# Q110 Test Report

Status: IMPLEMENTED - VERIFIED E2 + AUTHENTICATED LOCAL CHROME E3 (2026-10-22); REPRESENTATIVE ACCENT PREFERENCE OPEN

## Trigger Proof

- Fourteen production source sites contained undefined gaming/pink utility vocabulary across seven files.
- The Q109 production artifact emitted canonical token selectors but no gaming or pink utility selectors.
- The unique `bg-white/90 text-text-primary` pill becomes a near-white foreground on a near-white background in dark mode.

## Executable Evidence

- Focused design-token contract: 1 suite, 3 tests passed against final source.
- Full frontend: 132 suites, 539 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with zero warnings or errors.
- Targeted Prettier: executed; unrelated formatter churn was removed from the final diff.
- Final exact-source `npm run build`: passed in 706.6 seconds, compiled in 2.3 minutes, generated 53/53 pages.
- Generated CSS contains canonical XP, streak, level, combo, social-gradient, and `bg-black/65` selectors.
- Generated CSS contains zero gaming XP/streak/level and zero pink utility selectors.
- Source sweep: zero invalid utility or fixed-white/theme-text matches; both valid semantic PageHeader pink callers remain.
- Agent OS: 123/123 passed. Diff checks: clean.

## Contrast Evidence

- White text over 65% black composited onto a worst-case pure-white image produces RGB(89,89,89).
- WCAG relative-luminance calculation yields 7:1 contrast with white text.
- SCOPE's proposed 50% overlay was rejected after the first successful build because its worst-case contrast was approximately 4:1.

## Claim Limits

- Authenticated Collections and Profile > Collections were visually walked at 390x844 in light and dark modes; screenshot evidence is below. Taste, Recipe Detail, and Year in Cooking were not walked.
- Representative preference for combo accents remains unknown.
- InterestPicker's misuse of status colors is a separate taste/semantic cluster and was intentionally not hidden inside this mechanical repair.

## Current Authenticated Runtime (2026-10-22)

- Playwright Chromium signed in using the documented local `testuser` fixture and loaded the rebuilt production-local `http://localhost:3000` app.
- Light-mode `/collections` showed the `Collection` type label with `bg-combo/10 text-combo`; computed foreground was `rgb(236, 72, 153)`. Two real seeded collections were visible.
- The app's dark theme was selected in the isolated browser context. Profile > Collections rendered the profile cover type labels with `text-white` and `bg-black/65`; computed foreground was `rgb(255, 255, 255)` and background was black at 65% opacity over real seeded food imagery.
- At 390x844, document width matched viewport. Page errors, console errors, and HTTP >=400 responses were zero. Requests were limited to login, presence heartbeat, and existing analytics; no profile or collection content was changed.
- Captures: `%TEMP%\q110-collections-mobile.png` and `%TEMP%\q110-profile-collections-dark.png`.
- This verifies only local rendering in the exercised theme/image cases; representative accent preference and broader theme/device coverage remain unknown.
