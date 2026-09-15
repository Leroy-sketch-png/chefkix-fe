# Q184-F3 Creator Verification Truth

## Goal

Preserve server-owned creator verification consistently across recipe detail, recipe search, people search, Explore cards, collection cards, and draft summaries. Never infer or fabricate verification when authority is absent.

## Gate

- Risk tier: T2, user-facing trust metadata across identity, culinary, search, and frontend boundaries.
- Human scene: a scroller compares creators and recipes across Search, Explore, and Collections. A badge that disappears by surface makes ChefKix look inconsistent and makes the trust signal unreliable.
- Current workaround: users must open a creator profile to determine whether the creator is verified.
- Reason to switch: consistent public identity proof reduces ambiguity while browsing food and deciding what to cook.
- Vision anchors: viewer-first discovery, Content Gravity, creator health, and truthful claims.
- Evidence before change: E1 direct code inspection. Identity owned `BasicProfileInfo.verified`, but culinary DTO mapping and both Typesense document schemas dropped it; Explore and Collections hardcoded `false`.
- Strongest alternative: hide verification on every recipe surface until a dedicated public identity projection exists.
- Decision: preserve the existing identity authority and propagate it through current public DTO and search projections. Missing legacy data remains unbadged.
- Disconfirming evidence: SCOPE assumed recipe data already carried verification. Current DTOs and Typesense schemas disproved that assumption and expanded the implementation boundary.
- Falsifier: any badge renders from a literal, guessed value, or field with no server-owned source; or an authoritative verified value is dropped by a downstream mapping.
- Pre-mortem: schema migration succeeds but existing index documents remain sparse; frontend interprets absence as verified; draft mapping reintroduces loss; user search remains silently badge-less.
- Reversibility: high. Additive optional transport and index fields can be removed without data migration.
- Review trigger: identity verification semantics change, search indexing is replaced, or runtime reindex evidence contradicts these controlled tests.

## Perspective Coverage

- Scrollers: consistent trust signal while discovering recipes and people.
- Creators: verified status no longer disappears on recipe-led surfaces.
- Cooks: recipe attribution remains credible at the decision point.
- Accessibility: existing badge semantics and layout are unchanged.
- Cultural context: no identity inference from names, geography, cuisine, or popularity.
- Safety/privacy/abuse: only the existing public verification bit is propagated; no private identity evidence is exposed.
- Business/demo/support: removes a visibly inconsistent trust signal without inventing demo data.
- Engineering lifecycle: optional fields preserve compatibility with legacy API and index documents.

## Execution Order

1. Add verification to the culinary author response and identity mapping.
2. Preserve verification when draft summaries copy an author response.
3. Add optional recipe and user verification fields to Typesense schemas and startup migration.
4. Populate both fields during bulk and real-time indexing.
5. Type and preserve the fields in frontend search and recipe models.
6. Replace Explore and Collections hardcoded values with authoritative values.
7. Add focused regression tests and perform a three-pass AoE sweep.

## Risks

1. Existing Typesense documents remain without the new fields until startup sync or explicit reindex completes.
2. A future mapper may copy `AuthorResponse` without copying verification.
3. UI tests prove contract behavior, not the current production-like index contents or human-perceived badge clarity.
