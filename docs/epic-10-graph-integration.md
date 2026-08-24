# Epic 10 graph explorer handoff

The graph explorer now treats the Leader API as the production data source. The local sample is available only when `NEXT_PUBLIC_GRAPH_EXPLORER_MOCK=true`; it is not silently used after an API failure.

## API contract

`src/features/graph-explorer/services/graphExplorerService.ts` calls `GET /knowledge/graph` through the existing API client with:

```text
?root=<canonical ingredient>&depth=1&limit=500&q=<optional search>
```

The initial request should return a bounded sample or first page. Selecting a node requests its neighborhood and merges the result into the current graph. This keeps a 16K-node graph out of the initial render.

The adapter accepts the current backend naming (`canonicalName`, `allergenFlags`) and the planned export naming (`canonical_name`, `allergen_flags`, `compound_data`, `nutritionalSnapshot`, `technique_context`). The UI remains stable while the leader moves from `graph_sample.json` to the full API response.

## Detail fields

Node payloads can provide:

- `compoundData.primaryCompounds`: top FooDB molecules, optionally with concentration and unit
- `compoundData.flavorProfile`: human-readable flavor summary
- `nutrition`: USDA snapshot with calories, protein, carbohydrates, and fat
- `allergenFlags`: normalized allergen flags

Edge payloads can provide:

- `compoundOverlap`: shared-compound ratio from the chemical engine
- `nutritionalComparison`: source/target delta summary
- `cookValidationCount`: validated cooking outcomes
- `techniqueContext.worksFor` and `techniqueContext.notRecommendedFor`, such as baking versus frying

Missing leader fields render as `Pending` and are never replaced with invented safety or chemistry claims.
