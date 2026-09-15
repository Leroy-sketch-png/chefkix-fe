# Q184 / Q183-F2 - Diff Record

## Cluster Fix

### AREA CLEARED: Search result count authority

- Trigger Finding: Search counted only the first 20 hits per category.
- Seed of Suspicion: the loaded-page array was being reused as both display data and server-owned result metadata.
- Blast Radius Findings (Pass 2): the total-results label, three tab counts, and search tracking all inherited the truncated count.
- Systemic Sweep (Pass 3): Explore already uses `found`; search was the only remaining unified-search surface discarding it.
- Total Eradications: 1 count-authority defect, 1 regression contract.

## Preserved

Loaded result rendering, query debounce, retry behavior, recent-search persistence, tab selection, and backend response shape remain unchanged.
