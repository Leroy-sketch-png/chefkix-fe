# Q121 Test Report - Truthful Notification Attention State

## Result

E2 implementation gates pass. Authenticated local responsive E3 was verified on 2026-10-22. Representative preference and physical-device/screen-reader experience remain unknown.

## Passed

- Focused notification/store/action/tone run: 4 suites, 14 tests.
- Final focused notification/store run after success-settlement coverage: 2 suites, 9 tests.
- Full Jest: 141 suites, 566 tests.
- TypeScript: `npm run typecheck`.
- ESLint: `npm run lint`, zero warnings/errors.
- Production build: 53/53 routes; `/notifications` compiled successfully.
- JavaScript JSON parse of `messages/en.json`.
- Exact live-source sweep: no `counts.*`, derived percentages, rail stat helper, telemetry keys, “Notification Health,” or “Attention Rail” in notification owners.
- `git diff --check`.
- Agent OS: 123/123 after canonical queue-state reconciliation.

## Findings During Verification

1. The first typecheck rejected `jest-dom` matcher types in the new test. Assertions were rewritten with core Jest and standard DOM properties; rerun passed.
2. PowerShell `ConvertFrom-Json` rejects existing case-distinct `modePrep`/`modePREP` keys. Application-equivalent `JSON.parse` passes; this was a verifier mismatch, not malformed JSON.
3. SHOT initially wrote a noncanonical queue state. `verify-agent-os.ps1` correctly failed 122/123. The queue was reconciled to the exact frozen contract and final verification passed.
4. Full Jest passes but reports a worker forced to exit after completion, consistent with pre-existing timer/teardown debt. This task did not claim that warning resolved.

## Experience Evidence

Historical limitation: `dev.bat -Status` then reported run `2026-08-05T16-03-01Z`, identity-verified monolith up, frontend `WARMING`, and AI service down, so that prior state could not certify the UI. Current local E3 evidence below supersedes only the missing layout/interaction walkthrough; representative comprehension or preference remains unknown.

### Current Authenticated Runtime (2026-10-22)

- Playwright Chromium signed in with the documented local `testuser` fixture and opened the rebuilt production-local `http://localhost:3000/notifications` route.
- `GET /api/v1/notification/unread-count` returned HTTP 200 with `data: 18` twice; the deck displayed `18 unread` and exposed Mark all as read after the request settled.
- All streams, Activity, Social, and Unread each became the sole `aria-pressed=true` filter when selected. No mark-read action was activated.
- At 390x844 and 1440x900, `documentElement.scrollWidth` equaled viewport width. Page errors, console errors, HTTP >=400 responses, and notification write requests were zero.
- Captures: `%TEMP%\q121-notifications-mobile.png` and `%TEMP%\q121-notifications-desktop.png`. Authentication may update normal login metadata/presence; no notification state was changed.
- This is local E3 interaction/rendering evidence, not representative-user preference, physical-device, or screen-reader certification.

## Remaining Gaps

- Physical-device and screen-reader experience.
- Representative preference for the reduced rail.
- Full notification-history pagination and category totals require a future server contract.
