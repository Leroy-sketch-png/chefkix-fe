# Q106 Authoritative Co-Cook Exit - Verification Report

Date: 2026-08-04

## Result

IMPLEMENTED - VERIFIED E2. Two-account E3 remains open.

Both visible room exits now settle one server/store leave command before navigation. Structured API rejection and thrown failure retain room membership and restore retry rather than manufacturing local success.

## AoE Rinse

### Pass 1 - Epicenter

- Replaced the room-header route-only Exit with the shared leave handler.
- Added a synchronous single-flight guard and disabled `Leaving...` state to both controls.

### Pass 2 - Blast Radius

- Found that the store ignored `success:false` and thrown failures.
- Changed `leaveRoom()` to return settlement truth, retain state on failure, and clear state only after success.
- Added rendered rapid-activation/retry coverage and store success/rejection/throw coverage.

### Pass 3 - Systemic Sweep

- Traced all `/cook-together` redirects in the room page.
- Preserved missing-room and room-dissolved redirects as separate server/event lifecycles.
- Preserved spectator-to-cook upgrade behavior.
- Verified explicit WebRTC close and unmount release media tracks; preserved unanswered-call preview for deliberate immediate retry.
- Found no second explicit room-exit control bypassing the shared command.

## Executable Evidence

- Focused plus adjacent Jest: 3 suites, 16 tests passed.
- Isolated `--detectOpenHandles`: 2 suites, 13 tests passed with no leaked handle.
- Full frontend Jest: 130 suites, 531 tests passed.
- TypeScript: passed.
- ESLint: passed with zero warnings or errors.
- Prettier check: passed.
- Production build: compiled successfully; 53/53 static pages generated.
- Agent OS: 123/123 passed before execution.
- Source sweep and `git diff --check`: passed.

The full Jest process reported an aggregate worker-shutdown warning after all tests passed. The changed suites pass an isolated open-handle run, so this cluster is not evidenced as its source.

## Open Evidence

- External-network/TURN behavior, physical devices, browser-termination cleanup, peer perception on separate networks, and representative preference remain unverified.
- The local two-account session/room data created for this test was intentionally mutated by the normal product flow, then cleaned up: the room dissolved and both exact test-created cooking sessions were confirmed abandoned. No pre-existing active session was present, and no user recipe, post, follow, or social content was changed.

## Local Two-Account Runtime Closure (2026-10-22)

- Separate authenticated `testuser` desktop and `sakura_kitchen` mobile browser contexts signed in through the visible UI on the production frontend at `localhost:3000`.
- As with ordinary successful sign-ins, account last-login metadata was updated. No credentials/tokens were written to files or printed.
- The host created a room through the real Tonight's Pick recipe page; the second account joined through `/cook-together?code=...`. Backend state confirmed two distinct participants before exit.
- Each explicit Leave action sent exactly one real leave request. The test delayed forwarding each request by 900 ms; during the delay both visible controls reported `Leaving...`, and neither page navigated before the real server response settled.
- After host exit, the room remained with one participant and `hostUserId` matched the remaining joiner. After the final participant exited, the room lookup returned 404, confirming dissolution.
- Both exact sessions created by this run were abandoned through the normal session endpoint; subsequent status reads confirmed `abandoned`, and both current-session reads were empty. No pre-existing session was present at preflight.
- Result: local same-host two-account E3 passes for pending state, one-command behavior, settled navigation, host transfer, and dissolution. This is not external TURN, independent-network, physical-device, or human-preference evidence.
