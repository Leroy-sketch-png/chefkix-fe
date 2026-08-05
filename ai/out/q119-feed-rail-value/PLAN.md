# Q119 Feed Rail Consumer Value Plan

## Goal

Remove internal render-state telemetry from the live desktop feed rail while
preserving every real scroller action, friend-presence signal, feed mode, and
content behavior.

## Order

1. Verify the rail's sole caller, props, catalog keys, history, and product spec.
2. Remove only the Stream Snapshot card and its presentation-only props.
3. Delete only the eight feed-namespace strings orphaned by that card.
4. Protect Quick Moves and authenticated friend presence with a focused contract.
5. Run catalog, focused, application, build, source-sweep, and desktop runtime
   gates.

## Risks

- Removing the entire rail would erase useful navigation and presence value.
- Deleting similarly named keys in other namespaces would break unrelated rails.
- A broad `posts.length` assertion would reject honest content counts elsewhere.
- The shorter desktop rail could leave an incoherent visual balance at `xl`.
