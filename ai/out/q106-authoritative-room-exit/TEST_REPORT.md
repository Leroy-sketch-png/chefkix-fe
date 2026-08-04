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

- Two authenticated users across a live room were not available under a safe credential and cleanup contract.
- Host transfer, peer-visible departure timing, and representative perception therefore remain E3 UNKNOWN.
- No demo or user data was created, reset, or mutated to conceal this gap.
