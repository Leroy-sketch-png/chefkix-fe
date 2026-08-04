# Q111 Diff Record

## Product Code

- Removed twelve per-interest gradient values from `InterestPicker`.
- Replaced category decoration with `bg-bg-elevated` and `bg-bg-hover` neutral surfaces.
- Reserved `bg-brand/15`, the existing brand border, and the existing checkmark for selected choices.
- Added synchronized `aria-pressed` semantics to every interest toggle.

## Regression Coverage

- Proves the Italian tile begins neutral and unpressed.
- Proves clicking it updates both brand selection treatment and `aria-pressed`.
- Proves the save count remains synchronized.
- Rejects future gradient/status vocabulary in the interest definitions and rejects restoration of `tile.gradient`.

## Deliberately Unchanged

- Optional Settings-only ownership.
- Preference IDs, API payload, persistence, legacy dietary filtering, dismissal, save/error behavior, emoji, labels, modal geometry, and header accent.
