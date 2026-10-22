# Epic 10 graph explorer handoff

The graph explorer loads its graph from the monolith knowledge API. The local demo graph is used only when `NEXT_PUBLIC_GRAPH_EXPLORER_MOCK=true`.

## API contract

`src/features/graph-explorer/services/graphExplorerService.ts` calls `GET /knowledge/graph` through the existing API client with:

```text
?root=<canonical ingredient>&depth=1&limit=100
?q=<ingredient name or alias>&depth=0&limit=20
```

The API returns a bounded first page sorted by canonical name. `root` returns outgoing substitution neighbors to depth 0–2; `q` searches names and aliases. The allowed limit is 1–500. Selecting a node loads its neighborhood and detail; typing in search loads matching ingredients after a short debounce. The force layout retains at most 500 recent nodes. The response includes `totalNodeCount` and `hasMore`, and contains only edges whose endpoints are present in its node page.

The monolith ships a small seed set; production collection contents may differ. A full Leader graph import remains a separate data task; this contract keeps both the response and the rendered graph bounded when that data arrives.

The adapter accepts the backend naming (`canonicalName`, `allergenFlags`) and the planned export naming (`canonical_name`, `allergen_flags`, `compound_data`, `nutritionalSnapshot`, `technique_context`). The monolith's `substitutionRatio` is displayed as a quantity ratio; it is never converted into confidence.

## Detail fields

Node payloads can provide:

- `compoundData.primaryCompounds`: documented compounds from the authenticated AI compound profile endpoint, when its official index is installed and the response is grounded
- `compoundData.flavorProfile`: human-readable flavor summary
- `nutrition`: USDA snapshot with calories, protein, carbohydrates, and fat
- `allergenFlags`: normalized allergen flags

Edge payloads can provide:

- `compoundOverlap`: Jaccard overlap of official bounded compound-presence profiles from the authenticated AI pair endpoint, when grounded
- `nutritionalComparison`: source/target delta summary
- `cookValidationCount`: validated cooking outcomes
- `techniqueContext.worksFor` and `techniqueContext.notRecommendedFor`, such as baking versus frying

The official FooDB index is not included in Git; without it, compound details remain unavailable. The current monolith collection has no USDA nutrition, validated cook counts, or technique suitability fields. The UI leaves these pending and makes no safety or functional equivalence claim from compound presence.
