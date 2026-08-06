# Q121 Diff - Truthful Notification Attention State

[file:src/store/notificationStore.ts]
`fetchUnreadCount(): Promise<void>` -> `fetchUnreadCount(): Promise<number | null>` while retaining shared state updates, polling, logging, and nonnegative local decrement behavior.

[file:src/app/(main)/notifications/page.tsx]
Loaded-list `counts` object -> explicit unread-request readiness plus the shared settled unread value. Notification data, filtering, error, empty, mark-all, and single-read lifecycles remain.

[file:src/components/notifications/NotificationsCommandDeck.tsx]
Four slice-derived count channels and always-rendered zero reassurance -> count-free filters plus nullable authoritative unread status/action.

[file:src/components/notifications/NotificationsContextRail.tsx]
Loaded-slice health card, stats, and percentages -> retained Quick Moves navigation only.

[file:messages/en.json]
Ten telemetry-only strings -> removed after exact consumer sweep.

[file:src/components/notifications/__tests__/notification-context-value.test.tsx]
No focused boundary -> unknown/zero/positive unread, count-free filters, retained destinations, and systemic source contract.

[file:src/components/__tests__/command-stat-tone-contract.test.ts]
Notification rail required as stat-tone consumer -> removed only that retired consumer; real-stat consumers remain protected.

[file:src/store/__tests__/storeFailureLogging.test.ts]
Failure logging only -> explicit null-on-failure and authoritative value-on-success settlement checks.

Structural verification: formatting, TypeScript, lint, JSON parse, source sweeps, focused/full Jest, production build, diff check, and Agent OS pass. Runtime E3 remains open.
