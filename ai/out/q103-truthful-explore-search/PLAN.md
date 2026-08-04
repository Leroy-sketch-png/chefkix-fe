# Q103 Plan - Truthful Explore Search Results

## Goal

Make Explore cards render only authoritative search proof while preserving complete browse cards and existing actions.

## Files

- `src/lib/search-result.ts`
- `src/app/(main)/explore/ExploreClient.tsx`
- `src/components/recipe/RecipeCardEnhanced.tsx`
- focused tests in the existing search-result and recipe-card suites

## Order

1. Extend the canonical sparse search result with only fields present in RecipeSearchDoc.
2. Normalize full browse Recipes into the same Explore card view model.
3. Make only the grid card's evidence fields optional and omit empty metadata rows.
4. Route both initial and paginated search through the canonical mapper; render save state from the settled Set.
5. Run focused tests, local/systemic sweeps, full frontend gates, and production build.

## Risks

1. Difficulty uses API vocabulary in RecipeCardEnhanced and display vocabulary in the Search page.
2. Browse conversion could accidentally discard rich recipe metadata.
3. Optional grid metadata could affect non-Explore grid callers if defaults are handled incorrectly.
