# Q184 / Q183-F2 - Search Total Truth

## Decision

Use the authoritative `found` totals already returned by unified search for the total-results label and each result tab. Fall back to the loaded hit count only when a response omits a total.

## Product reality

- Human scene: a scroller searches for a dish, person, or post and decides whether the result set is worth exploring.
- Current friction: the UI calls the loaded page the full result count, so a capped search can claim 20 results when many more exist.
- Value: search communicates the actual breadth of discovery and stays consistent with Explore.
- Rejection trigger: a user sees a plainly false result count or switches tabs and gets contradictory totals.

## Challenge

- Strongest alternative: implement pagination/load-more now. That improves completeness but expands this approved, isolated truth fix into interaction design and extra state.
- Selected approach: repair count authority first, using the existing backend field and a proven Explore pattern.
- Disconfirming evidence: backend `found` is absent or not per collection, or the UI contract intentionally means loaded hits rather than total matches.
- Falsifier: any tab or total still derives from `results.*.length` after a successful response.
- Pre-mortem: an old response briefly leaks stale counts, a missing `found` crashes rendering, or tracking counts regress. Counts reset with each query, nullish fallback is explicit, and tracking uses the same authoritative totals.

## Scope

`src/app/(main)/search/page.tsx`, the existing search truth contract, and evidence only. No backend, API, pagination, or product-direction changes.
