# Q103 Diff - Truthful Explore Search Results

## Cluster

- Replaced Explore's sparse Typesense-to-full-Recipe coercion with the canonical `toRecipeSearchResult` mapper.
- Added one Explore card view model so complete Mongo browse results retain real metadata without weakening the sparse contract.
- Made only the shared grid card's evidence fields optional and omitted absent difficulty and stats instead of rendering defaults.
- Made Explore's settled `savedRecipes` Set the sole rendered save-state authority.
- Preserved search and browse pagination, navigation, cook/save actions, descriptions, media, XP, skill tags, badges, and author avatars when supplied.

## AoE Rinse

- Pass 1: removed invented `0 min`, Beginner, zero rating, placeholder author data, fake entity arrays, and false saved state from Explore search hits.
- Pass 2: checked initial and paginated search, initial and paginated browse, rich grid rendering, sparse grid rendering, and sibling grid callers.
- Pass 3: swept every `RecipeSearchDoc` consumer and fabrication marker. Collection, Story, and meal-plan autocomplete consumers already omit absent evidence. `CollectionBuilder`'s Beginner value is a user-authored learning-stage default, not recipe proof.

## Scope Boundaries

- No backend, index schema, route, product direction, or non-grid card contract changed.
- No batch recipe enrichment was added; doing so would require measured latency and a batch API.
- Production sparsity frequency and representative preference for omission versus an explicit unavailable label remain unknown.
