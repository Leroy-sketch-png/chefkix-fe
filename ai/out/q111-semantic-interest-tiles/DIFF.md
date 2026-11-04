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
- Preference IDs, API payload, persistence, legacy dietary filtering, dismissal, save/error behavior, emoji, labels, and header accent. Modal geometry is adjusted in the follow-up below.

## Runtime Visual AoE Follow-Up (2026-10-22)

- Changed tile geometry from 4:3 to square, moved emoji into a reserved upper region, and rendered labels in a separate opaque bottom band to prevent food art colliding with text.
- Bounded the dialog to the dynamic viewport and made only the tile area scroll, retaining the header and actions on short screens.
- Reduced mobile header spacing/icon scale so more choices remain visible at 320x568; retained the desktop hierarchy and all header content.
- Changed the shared ScrollToTop control from `z-notification` (9500) to `z-sticky` (200). Its prior stacking level allowed a global navigation control to obscure Save inside modal surfaces (9000).
- Added layout assertions for tile geometry/label separation and a shared ScrollToTop stacking regression test.
- Runtime evidence and viewport screenshots, including the short-screen scrolled state, are recorded in `runtime/` and `TEST_REPORT.md`; no user preference was persisted.
