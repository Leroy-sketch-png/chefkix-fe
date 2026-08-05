# Q114 Diff - Measured Post Caption Preview

## Product Surface

- Added `PostCaption`, a focused owner for preview/full rendering, measured overflow, cleanup, and inline expansion.
- Made reusable PostCard captions default to `preview`.
- Made the dedicated post route explicitly request `full`.
- Added localized `post.showFullCaption` copy.

## Regression Coverage

- Rendered tests cover short text, measured overflow, one-way expansion, content replacement, full mode, and the no-ResizeObserver fallback.
- The PostCard navigation contract now guards the summary default and detail override together.

## AoE Boundary

- Audited all seven production summary/list callers and the single detail caller.
- Preserved edit mode, tags, media, actions, whitespace, and permalink behavior.
- Left share/metadata string shortening alone because those are not rendered caption surfaces.
- No backend, API, schema, persistence, seed, or demo-data change.
