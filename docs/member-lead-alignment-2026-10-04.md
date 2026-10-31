# Member / Lead alignment — 2026-10-04

Reference: monolith `BACKLOG_LEAD.md`, Lead v101, source commit `e2e0dfc` dated 2026-10-02. The canonical strategy and atomic evidence ledger are absent from these checkouts. This is an engineering alignment against the committed handoff, not an independent scientific audit.

## Git checkpoint

- Monolith working branch `codex/epic10-bounded-graph` incorporated current `origin/master` without discarding the bounded-graph implementation.
- Existing final sprint reports and generation sources were committed/pushed as `bdd3a77`. Generated PNG review caches, font copies and Python bytecode remain local/ignored. Reports are preserved drafts, not newly certified thesis evidence.
- Frontend existing work was already pushed at `5825e7c`. AI service `9826adf` and infrastructure `f41d0c3` were clean and synchronized with their upstreams. AI's merged main has the same source tree.
- The rewritten monolith `BACKLOG_MEMBER.md` maps all 12 epics and G1–G10, separating code, missing integration, Lead artifacts and human review dependencies.

## First implementation: G1 and G2

Evaluation loads now validate at the shared boundary, suppress pending/placeholder numbers, reject invalid or inconsistent records and require adjudication metadata for completed safety rates. The remote error path does not silently substitute a bundled result. Public JSON serves the same current records; a regression check prevents drift.

The scoreboard no longer substitutes a paper Mistral number for M2's incomplete evaluation or assigns a cross-protocol winner. Mistral small 2603 raw safety capture remains pending scoring. The safety demo is a fixed, labeled illustration with no fake provider response or prompt execution.

The thesis workspace covers all 14 Lead chapters. Compound, safety, photo, architecture and evaluation now map to 8, 9, 11, 12 and 13; behavioral artifacts are part of Chapter 13. New Lead-dependent entries stay pending.

## Validation

- Focused evaluation/thesis Jest run: 4 suites, 12 tests passed, including malformed exports, pending-value suppression, metric bounds, duplicate IDs, inconsistent deltas, missing review metadata, remote failures, public-file parity and non-attributed demo rendering.
- `npm run typecheck`: passed. Targeted ESLint for changed services, views, manifest and regression tests: passed.
- `npm run build`: passed, including lint/type validation and generation of all 62 static pages. Existing Browserslist-age and next-intl webpack cache warnings did not fail the build.
- Browser: `/thesis` showed 14 ordered chapters, 27 artifacts and explicit pending evidence; selecting M2 showed verified step 70/561 without a model-quality claim. The safety route preserved its sign-in redirect; authenticated visual acceptance remains open, while the component regression passed.
- Screenshot: [Thesis alignment](evidence/member-lead-alignment-thesis.png).

## Remaining gaps

G3 is the next independent code task: substitution-card normalization currently turns missing nutrition/overlap into zero and retains unsupported illustrative chemistry wording. G4 covers tri-state/profile integration. G5 needs the exact graph manifest/import. G6 needs full result provenance, intervals and figure captions. G7–G10 cover feedback recovery, accepted photo models/device evidence, thesis/human evidence and optional Voice-Vision.

Schema acceptance is not cryptographic or clinical verification. Accepted M1/M3/M4 capabilities, final M2 predictions, scored safety comparisons and human review/study results remain unavailable. No weights were installed, training launched, reviews fabricated or production deployment performed in this alignment.

## Member integration follow-through — 2026-10-04

G3: Missing overlap and per-100g nutrition remain null/Unavailable. Percent fields use 0–100; the official pair API's `overlap_percentage` uses 0–1. Exactly 1% stays 1%. Degraded, mock and explicitly ungrounded payloads cannot produce measured evidence. Retired the fabricated butter examples. The AI pantry response now attaches the official compound evidence to each candidate, preserves its grounding and source fingerprint, and does not accept model-generated chemistry as evidence.

G4: SAFE/UNKNOWN/BLOCKED map to Safe/Check/Blocked. Missing/malformed policy and legacy `allergenSafe: true` remain Check. Local profile conflicts override contradictory Safe claims. Name matching alone never establishes safety; plant alternatives are not classified as dairy by the word “butter” or “milk”. Both substitution surfaces forward profile flags and disable blocked primary actions. The AI's bounded name policy returns Check, even when an LLM claims Safe. These are API/component regression checks, not an authenticated deployed acceptance certificate.

G6: Optional per-result provenance contains dataset, split, protocol, unique seeds, source/prediction SHA-256, decision and claim limits. Partial/invalid metadata rejects. The standalone SVG and PNG caption includes status, complete fingerprints, supplied caveats and an explicit missing-manifest notice. A supplied hash is not independent verification of its contents. No unknown scores, intervals, seeds or hashes have been invented.

Still required from Lead: canonical full graph export and manifest (schema, exact identities/hash/counts, edge semantics, source rights and deployment-use decision); detailed evaluation artifacts; accepted model/index handoffs. Local `models/graph_sample.json` has 500 sample nodes and no full-graph import manifest. FooDB's compound provenance is a separate presence-data artifact and does not authorize treating the sample as the canonical graph. No database import or collection replacement was performed.

Before graph import: validate hashes/schema/identity uniqueness/endpoints/counts/rights; stage a separate collection; compare bounded search/neighborhood responses and coverage; retain the current collection and its provenance for rollback; switch only after the staged checks pass. Do not convert research edge weights into cooking ratios or clinical safety labels.
