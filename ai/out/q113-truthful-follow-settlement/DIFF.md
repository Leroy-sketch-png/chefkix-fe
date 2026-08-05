# Q113 Diff - Truthful Follow Suggestion Settlement

## Structural Review

[file:src/lib/types/social.ts] optional relationship state -> required `isFollowing` and `isFollowedBy` for toggle responses. This matches the existing backend response and changes no general `Profile` consumer.

[file:src/components/social/FollowSuggestionCard.tsx] envelope-only success and unconditional confetti -> confirmed follow settlement and confirmed reciprocity celebration. Parent callback remains after settlement and the child remains the sole command owner.

[file:src/components/social/FollowSuggestionCard.tsx] synchronous dismiss spinner -> direct local callback. Dismiss still performs no request and remains disabled while a follow command is pending.

[file:src/components/social/__tests__/follow-suggestion-card.test.tsx] no rendered command coverage -> six tests covering one-way, mutual, contradictory, missing-data, rejected, thrown, auth-denied, and dismiss paths.

[file:src/lib/__tests__/celebrationProportionality.test.ts] effect-name-only guard -> authoritative reciprocity and follow-state source guard.

## AoE Review

- Pass 1: repaired the false mutual celebration and unresolved card removal.
- Pass 2: verified all three shared-card consumers and both variants use the repaired boundary.
- Pass 3: inspected every `toggleFollow` caller. Search, hover card, and profile already reconcile returned state. Friend removal, notification follow-back, and generic follow-card behavior have distinct intent/confirmation/concurrency lifecycles and were not falsely certified by this card checkpoint.
- Final rinse: no `isDismissing` remains; mutual confetti has one caller and is nested under returned reciprocity; no parent gained a second toggle.
