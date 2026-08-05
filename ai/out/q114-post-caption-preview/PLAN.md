# Q114 Plan - Measured Post Caption Preview

## Product Decision

PostCard is a summary surface by default. It owns a measured two-line preview and exposes an inline `More` command only when the rendered caption actually overflows. The dedicated post route explicitly requests the complete caption.

## Why This Shape

- A character threshold cannot account for card width, manual line breaks, emoji, or font metrics.
- Clamping PostCard globally would silently truncate the dedicated reading surface.
- Caller-by-caller preview flags would make every new summary surface responsible for remembering the product rule.
- Inline one-way expansion preserves context and avoids an unnecessary collapse control.

## Verification Plan

1. Render short, overflowing, updated, full-detail, and ResizeObserver-fallback states.
2. Prove every summary caller inherits preview mode and post detail explicitly requests full mode.
3. Run TypeScript, lint, full Jest, and a production build.
4. Boot with the supported infrastructure launcher and inspect authenticated feed plus public detail on live data.
5. Preserve missing long-caption runtime data as an explicit evidence gap rather than mutating demo fixtures.
