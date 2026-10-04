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
