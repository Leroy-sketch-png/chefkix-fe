# Q104 Diff - Skill-Tree Legibility

## Product Change

- Bronze, Silver, Gold, and Diamond use distinct static progression treatments; unknown tiers fall back to Bronze without changing node state.
- The aggregate filter now says `All paths (n)`, distinguishing path count from the achievement summary.
- Locked progress, hidden behavior, premium markers, unlock rules, and APIs are unchanged.

## Cluster Repair

- Registered medal and rarity variables in Tailwind v4's active `@theme` bridge. This also repairs existing medal utilities used by leaderboard surfaces.
- Replaced every invalid `*-color-error` component utility with the registered `error` token.
- Added a codebase component guard for invalid color-token construction and a theme-registration guard for progression colors.

## Rejected Scope

- Did not hide locked progress: backend normally blocks prerequisite-bound updates, but a nonzero value delivered by the API is persisted evidence and the UI must not silently erase it.
- Did not remove premium markers: premium progression remains canonical and its unresolved entitlement lifecycle is a separate product decision.
- Did not change hidden-achievement disclosure: Q104 had no approved evidence for a lifecycle change.

## Files

- `src/components/achievements/SkillTree.tsx`
- `src/app/globals.css`
- `messages/en.json`
- `src/components/social/Comment.tsx`
- `src/components/achievements/__tests__/skill-tree-presentation.test.tsx`
- `src/components/__tests__/design-token-contract.test.ts`
