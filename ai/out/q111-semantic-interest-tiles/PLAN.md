# Q111 Plan - Semantic Interest-Tile Selection

## Decision

Replace the twelve arbitrary cuisine/status gradients with one neutral themed tile surface. Reserve brand color for the selected state and expose that state with `aria-pressed`.

## Three-Pass Rinse

1. Epicenter: remove the per-tile gradient authority and keep food identity in the existing emoji and label.
2. Blast radius: preserve the modal, save lifecycle, legacy dietary filtering, keyboard focus, selected border/checkmark, and Settings-only ownership; add rendered pressed-state coverage.
3. Systemic sweep: inspect every InterestPicker caller and remaining status-gradient match. Reject a broad color purge because the remaining matches encode real warning, error, completion, reward, or operational states rather than taste identity.

## Verification

- Focused rendered Jest contract.
- Full Jest suite, TypeScript, ESLint, Prettier, and production build.
- Interest-tile source sweep, caller sweep, diff check, and Agent OS gate.
- Attempt authenticated visual review only when reachable without bypass, account creation, or preference mutation.

## Stop Conditions

Stop if selection loses visible or accessible state, legacy safety filtering changes, any cuisine retains decorative status meaning, or the exact-source frontend fails a required gate.
