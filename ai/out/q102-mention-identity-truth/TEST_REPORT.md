# Q102 Mention Identity Truth - Verification Report

## Result

PASS at E2. Representative user preference and authenticated multi-account notification delivery remain E3-open.

## Eradicated Cluster

- Trigger: deleting a visible mention did not remove its hidden recipient ID.
- Local blast radius: external clears also retained hidden IDs; followed-user handles were fabricated from display names; Messages displayed autocomplete but discarded every selected ID.
- Systemic sweep: post, comment, and reply services trusted arbitrary recipient IDs without checking for a corresponding visible username token.
- Resolution: social composers insert canonical `@username` tokens and reconcile controlled text to selected IDs; all three backend write paths reconcile requested IDs against visible tokens and profile identity; Messages uses its truthful plain-text composer while preserving Enter submission and focus behavior.
- Preserved behavior: display names remain visible in suggestions; post/comment/reply mention delivery remains; reply-to-author notification remains an explicit reply lifecycle; no chat mention contract was invented.

## Executable Evidence

- Frontend focused: 3 suites, 13 tests passed.
- Frontend full: 127 suites, 519 tests passed.
- Frontend TypeScript: passed.
- Frontend ESLint: zero warnings or errors.
- Frontend production build: compiled, typechecked, and generated 53/53 static pages; `/messages` included.
- Monolith focused reactor: `MentionIdentityTest` 3/3 passed across the six-module dependency build.
- Monolith full social reactor: 48 tests passed, zero failures/errors.
- Source sweep: only the four API-backed social callers retain `MentionInput`; Messages has no mention import or hidden tag ref; every social notification write path receives reconciled IDs.
- Diff checks: passed in frontend and monolith.

## Prediction Errors And Corrections

- The initial Java punctuation character class was malformed. The focused test failed before checkpointing; frontend and backend now share a simpler Unicode-aware username continuation boundary, and both suites pass prefix-collision cases.
- The first production build wrote a fresh artifact but did not exit within the five-minute command bound. It was not credited. A clean rerun exited successfully in 268 seconds and is the certified build result.
- The initial diagnosis treated stale IDs as a frontend-only defect. Pass 3 disproved that: direct clients could bypass the UI, so the backend write boundary was added to the same cluster.

## Remaining Unknowns

- Representative preference for username tokens versus rich display-name mentions.
- Whether group cooking creates a validated need for chat mentions; adding them requires persistence, recipient policy, notification navigation, and lifecycle evidence.
- Production legacy profiles with blank or malformed usernames. Such profiles are omitted from autocomplete and unresolved IDs are dropped without blocking content publication.
