# Q109 Active Tailwind Color Authority

## Goal

Restore the existing ChefKix color vocabulary in Tailwind v4 and prevent source-used product tokens from silently compiling to nothing.

## Files

1. `src/app/globals.css` - register the complete source-used ChefKix palette in `@theme inline`.
2. `src/components/__tests__/design-token-contract.test.ts` - enforce the source-to-theme contract.
3. Root governance and this evidence directory - preserve decision and verification provenance.

## Order

1. Prove the current compiled selectors are absent and enumerate the full missing family.
2. Register the missing tokens without changing component call sites or palette values.
3. Replace the narrow progression assertion with a systemic production-source guard.
4. Run focused, static, full-suite, build, compiled-CSS, Agent OS, and diff verification.

## Risks

1. A partial registration leaves adjacent accessibility or gamification utilities dead.
2. A stale `.next` artifact falsely certifies emitted selectors.
3. Restored colors expose a runtime contrast problem that source/build checks cannot establish.
