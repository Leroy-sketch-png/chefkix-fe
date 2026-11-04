# Q111 Test Report - Semantic Interest-Tile Selection

## Result

The semantic-selection change passed E2; its 2026-10-22 layout follow-up now has authenticated local Chromium E3 evidence. Representative-user preference remains open.

## Executable Evidence

- Focused Jest: 1 suite, 3 tests passed.
- Full frontend Jest: 132 suites, 540 tests passed.
- TypeScript: `tsc --noEmit` passed.
- ESLint: zero warnings and zero errors.
- Prettier: both touched source files clean.
- Production build: Next.js 15.4.6 compiled successfully and generated 53/53 static pages.
- Source sweep: InterestPicker is the only tile owner; Settings is its only production caller; no tile definition retains gradient, status, streak, info, or accent-teal vocabulary.
- Diff checks: passed.
- Agent OS: 123/123 checks passed after the tracked queue/result update.

## AoE Findings

- Pass 1 removed twelve arbitrary mappings.
- Pass 2 preserved soft-taste versus dietary-safety ownership and added missing accessible toggle state.
- Pass 3 found no second cuisine/taste classifier using status gradients. Remaining repository status gradients were retained where they communicate warning, failure, completion, reward, or operational state.

## Honest Residue

- The current frontend request timed out and the probed backend health path returned 404, so no authenticated Settings screenshot is credited. No credentials, auth bypass, account creation, data reset, or preference save was introduced to force evidence.
- Representative light/dark preference, cross-platform emoji rendering, and real Settings comprehension remain unknown.
- Jest passed every test but reported its existing forced-worker-exit teardown warning. That operational issue is not caused or repaired by this visual cluster and remains separate follow-up evidence.
- The build repeated existing Browserslist-age and edge-runtime warnings; neither is attributed to Q111.

## Runtime AoE Follow-Up (2026-10-22)

The authenticated Settings surface revealed two visual defects missed by the earlier source/test-only pass: emoji and label collision in the 4:3 interest tiles, plus a modal that could exceed a short viewport. Inspection of the adjacent shared UI found the global ScrollToTop button on z-layer 9500 while modal surfaces use 9000, allowing that unrelated floating action to cover modal controls.

- The dialog is now bounded to the viewport; its header/footer remain fixed while the tile grid scrolls. Square tiles reserve separate emoji and opaque label regions. Compact mobile spacing reduces the 320x568 header to 152px while retaining all copy.
- ScrollToTop now uses the shared sticky layer (200), below modal surfaces. A focused shared-component test prevents restoring the notification layer.
- Authenticated local Next dev runtime at 390x844 and 320x568: all 12 tiles rendered; settled labels remained legible; the dialog stayed within viewport bounds; document width matched viewport; and hit-testing at the former short-screen collision resolved to the modal Save button. The 320x568 grid scrolls independently; a bottom-position check exposed the final row while keeping the footer fixed. Console/page errors: zero.
- A preference tile was toggled and the dialog dismissed through its accessible control. No taste/profile write or save was issued. Observed requests were fixture login, analytics, and presence only.
- Focused Jest: 2 suites, 4 tests passed. TypeScript, lint (zero warnings/errors), and Prettier checks passed.
- Screenshots: `runtime/390x844.png`, `runtime/320x568.png`, and `runtime/320x568-scrolled.png`.

This is E3 evidence for this local authenticated Chromium runtime, not evidence for representative-user preference, other browser engines, physical devices, or assistive-technology comprehension. Cross-platform emoji rendering remains unknown.
