# Epic 10 graph explorer handoff

The public `/explore/graph` route is disabled unless `NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED=true`. While disabled it does not mount the Explorer or request graph data. The sample graph remains available only for local development with `NEXT_PUBLIC_GRAPH_EXPLORER_MOCK=true`.

## API contract

`src/features/graph-explorer/services/graphExplorerService.ts` calls `GET /knowledge/graph` through the existing API client with:

```text
?root=<canonical ingredient>&depth=1&limit=100
?q=<ingredient name or alias>&depth=0&limit=20
```

The API returns a bounded first page sorted by canonical name. `root` returns outgoing substitution neighbors to depth 0–2; `q` searches names and aliases. The allowed limit is 1–500. Selecting a node loads its neighborhood and detail; typing in search loads matching ingredients after a short debounce. The force layout retains at most 500 recent nodes. The response includes `totalNodeCount` and `hasMore`, and contains only edges whose endpoints are present in its node page.

The client requires `nodes` and `edges` arrays, nonblank ingredient IDs and display names, unique node IDs, and a recognized relationship type. It accepts `substitution` (plus the legacy `substitutes` alias), `chemical_similarity`/`chemical-similarity`, and `co_occurrence`/`co-occurrence`. A missing or unknown type fails the graph load visibly instead of being mislabeled as a substitution.

When a successful search returns no ingredients, the Explorer says the ingredient is not in the current graph and does not create a node. This empty result is distinct from a failed search, which keeps its visible error state.

Search failures use their own status state. A later successful query clears that search message, and clearing the query removes it; neither action clears an unrelated neighborhood or compound error. The graph SVG measures its map container and recomputes layout dimensions on resize, so narrow screens render the full map without the previous 620 px minimum-width overflow.

Zoom, zoom-out, and reset controls stay in the map header, outside the SVG area. This prevents the floating toolbar from covering a node label or intercepting a node click; the headed viewport regression checks both canvas fit and toolbar placement.

If compound-overlap detail returns no result, the Explorer releases its request marker so selecting the edge again can retry after the provider recovers. The component regression and headed browser case cover the empty-first-response, successful-retry path.

## Local live FE-to-Monolith smoke

`tests/e2e/graph-explorer-live.spec.ts` is an opt-in headed browser check with API route interception disabled. Build the FE with `NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED=true` and `NEXT_PUBLIC_BASE_URL=http://localhost:8080`, run the Monolith against an isolated Mongo database, and allow the E2E origin `http://localhost:3200` through `app.cors.allowed-origins`. Set both `CHEFKIX_LIVE_MONOLITH=true` and `NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED=true` in the Playwright process environment; the spec checks both flags at test time:

```powershell
$env:CHEFKIX_LIVE_MONOLITH = 'true'
$env:NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED = 'true'
```

Then run:

```powershell
npx playwright test --config=playwright.e2e.config.ts tests/e2e/graph-explorer-live.spec.ts --workers=1
```

The 2026-10-23 headed Chrome run passed on desktop and iPhone-sized Chromium. The isolated legacy seed returned 25 nodes and 5 edges, including the exact declared alias `lemon juice` resolving to canonical `lemon`; selecting Salt also loaded the `salt` root neighborhood with the `salt` → `lemon` edge through the repository alias query. An unknown search returned no nodes or edges. The responsive map regression failed before the sizing fix (620 px SVG in a 357 px mobile map viewport) and passes on both viewports after the map measures its container. Of 59 seeded substitution statements, 4 resolve through canonical names, 1 through an explicit alias, and 54 remain unresolved. The test verifies the unknown-identity behavior, exact alias edge, root expansion, and preview boundary. This is a local legacy API smoke check; it does not load or accept the hash-pinned Leader artifact, call the live shadow evidence provider, establish research identity mapping, or certify deployed behavior.

## Shadow evidence panel

`NEXT_PUBLIC_GRAPH_EVIDENCE_ENABLED` defaults to `false`. When enabled at build time, selecting an edge also requests `GET /api/v1/graph/evidence` with its exact source and candidate IDs. An available response must return matching requested and resolved IDs for both ingredients and declare the train count unit as `TRAIN_PAIRS`; the backend rejects mismatches and the client fails closed on either identity or unit errors. The panel displays a manifest hash only when the backend reports matching verified SHA-256 values, along with train-pair count, calibration status, and abstention. Typed unavailable/refused responses remain visible. The panel never recommends a substitute, and this client flag does not enable the backend endpoint. The monolith keeps its own graph-evidence flag disabled by default.

Evidence loading is bound to the currently selected edge. If the user selects another edge before an earlier request completes, the late response is ignored.

The headed browser regression in `tests/e2e/graph-explorer.spec.ts` also feeds the evidence panel an `AVAILABLE` response whose expected and observed SHA-256 values differ. The panel must show the unavailable state and omit both the manifest hash and any decision. The case runs in desktop and iPhone-sized Chromium with local API fixtures; it verifies client refusal behavior, not tampering against a live accepted graph artifact.

When explicitly enabled for local integration work, the Explorer map still uses the bounded legacy knowledge API. This is not an accepted M-C artifact load and must not be enabled as the product graph until the canonical hash-pinned artifact, its IDs, and the graph-product route are accepted and integrated. Shadow evidence may report an unknown identity; it must not resolve aliases or fall back to another graph.

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
