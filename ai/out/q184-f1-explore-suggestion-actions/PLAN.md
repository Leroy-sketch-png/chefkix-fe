# Q184 / Q183-F1 - Explore Suggestion Actions

## Decision

Make Explore's no-result suggestion chips perform an immediate search and localize the shared suggestion caption through the existing search message contract.

## Product reality

- Human scene: a scroller reaches zero results and taps one of the recovery suggestions offered by the product.
- Current friction: the chip looks actionable but has no handler, so tapping it does nothing.
- Value: the no-result state becomes a useful recovery path instead of a dead end.
- Rejection trigger: a button visibly responds to hover/touch but produces no state change.

## Challenge

- Strongest alternative: remove the chips. Rejected because API-backed trending terms provide a useful low-effort recovery path.
- Selected approach: update both input and debounced search state, close autocomplete, and retain the current page and filters.
- Disconfirming evidence: another owner already handles these chips, or updating the query does not trigger the existing recipe fetch.
- Falsifier: the Explore callsite lacks `onSuggestionClick`, the handler does not update both search states, or the shared caption remains hardcoded English.
- Pre-mortem: the selected term waits through an unnecessary debounce, autocomplete obscures the result, or localization requires new catalog edits. Immediate state synchronization, closing autocomplete, and the existing `search.didYouMean` key address those risks.

## Scope

Explore, the shared empty-state caption, the existing search-signal contract, and evidence only. No API, filter, routing, or catalog mutation.
