# Q104 Plan - Skill-Tree Legibility

## Human Outcome

A cook can distinguish progression tiers and understand which numbers count achievements versus skill paths without decoding the implementation.

## Governed Scope

1. Replace the duplicate/generic tier backgrounds with static classes from ChefKix's established medal and rarity palette.
2. Add explicit localized path-unit copy around the category filters while retaining achievement-unit summary copy.
3. Add rendered tests for all four tiers, count units, fallback behavior, and preservation of real progress/premium state.
4. Register the existing medal and rarity variables in Tailwind v4's active `@theme` bridge, then prove the selectors exist in production CSS.
5. Rinse the component, achievement module, and codebase tier pattern; run focused and full frontend gates.

## Preserved By Decision

- Backend progression and prerequisite semantics.
- Nonzero progress supplied for any locked or in-progress node.
- Hidden-achievement masking.
- Premium metadata and marker.
- Filter behavior, expansion, APIs, and product direction.

## Falsifier

Stop or reopen if generated tier classes are absent, unit copy is ambiguous or overflows, non-color labels disappear, or any achievement state behavior changes.
