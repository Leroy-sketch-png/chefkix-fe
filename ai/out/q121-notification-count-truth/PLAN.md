# Q121 Plan - Truthful Notification Attention State

## Goal

Remove client-slice totals and percentages from the notification center, and render unread reassurance only from a successfully settled server unread-count request.

## Gate

- Risk: T2, user-facing and cross-component.
- Decision: PRESERVE the notification and RETURN pillars.
- Evidence ceiling before execution: E1.
- Strongest alternative: add paginated server totals and category aggregates; deferred because the current contract does not provide them.
- Falsifier: any unresolved request renders a zero claim, any slice count remains presented as a total, or notification actions/filtering regress.

## Files

1. `src/store/notificationStore.ts` - return unread probe settlement without changing polling callers.
2. `src/app/(main)/notifications/page.tsx` - track authoritative unread readiness and stop deriving visible totals from the loaded slice.
3. `src/components/notifications/NotificationsCommandDeck.tsx` - keep filters/actions, remove slice metrics, and model unknown/zero/positive unread states.
4. `src/components/notifications/NotificationsContextRail.tsx` - remove the telemetry card and retain Quick Moves.
5. `messages/en.json` - remove strings orphaned by telemetry removal.
6. `src/components/notifications/__tests__/notification-context-value.test.tsx` - pin rendered and source-level truth boundaries.

## Order

1. Change the store request to return `number | null` while preserving shared state updates and callers.
2. Thread `unreadCount: number | null` through the page and deck.
3. Remove deck and rail slice-derived metrics while preserving controls and navigation.
4. Remove only proven-orphaned catalog keys and imports.
5. Add focused tests for unknown, zero, positive, filters, rail links, store settlement, and systemic source absence.
6. Run focused, adjacent, application, build, source, diff, and Agent OS checks; attempt bounded responsive runtime review.

## Risks

1. Default store zero may leak before probe readiness; use an explicit nullable page authority.
2. Polling and popup callers may assume `Promise<void>`; returning a value must remain safe for ignored results.
3. Removing telemetry may accidentally remove useful navigation or filtering; pin both in rendered tests.
