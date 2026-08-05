# Q115 Recipe Difficulty Badge Plan

## Decision

Restore the recipe hero difficulty signal with complete, statically discoverable
Tailwind classes. Keep difficulty semantics, hero geometry, animation, and recipe
data unchanged.

## AoE Boundary

1. Replace runtime class construction with one typed four-value authority.
2. Prove all four selectors survive a fresh production build.
3. Inspect the representative Expert route for contrast, containment, and runtime
   errors.
4. Rinse warnings discovered on that route through the owning shared component.

## Exit Criteria

- Focused and full regression suites pass.
- TypeScript, lint, formatting, production build, source sweeps, and Agent OS pass.
- Every difficulty selector is present in the final CSS artifact.
- Runtime evidence and any blocked evidence are reported separately.
