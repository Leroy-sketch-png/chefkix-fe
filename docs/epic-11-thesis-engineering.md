# Epic 11 thesis engineering handoff

The thesis evidence workspace is available at `/thesis`. It converts the Member Epic 11 checklist into a versioned manifest of chapter criteria, capture briefs, source routes, and data dependencies.

## Chapter coverage

| Chapter                                   | Workspace coverage                                                         | Primary source                                      |
| ----------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- |
| 1–3 · Introduction, Related Work, Food KG | Source-bound Lead handoff entries                                          | Current Lead chapter artifacts                      |
| 4–7 · M1–M4                               | Rejected/open model boundaries; M2 training progress separate from quality | Lead v101 / exact model evidence                    |
| 8 · Compound Explanation                  | UI screenshot, pipeline diagram, factual compound example                  | `/cook`, official FooDB export                      |
| 9 · Real LLM Allergen Benchmark           | Labeled illustration now; adjudicated comparison pending                   | `/demo/allergen-safety`, matched reviewed evidence  |
| 10 · Selective Abstention                 | Frozen protocol; no accepted candidate                                     | Lead protocol and future accepted result            |
| 11 · Photo → Intelligence Pipeline        | Scan UI and pending device/model evidence                                  | `/scan`, accepted M3/M4 endpoints                   |
| 12 · System Architecture                  | Stack diagram, deployment topology, hosting evidence                       | Repository topology and deployed runtime            |
| 13 · Evaluation & Ablation                | Feedback instrument, behavioral MRR, dashboard, figures and provenance     | `/cook`, `/admin/evaluation`, Lead detailed exports |
| 14 · Conclusion & Future Work             | Negative/open results and human rehearsal handoff                          | Lead draft and scored rehearsal                     |

This numbering follows the 14-chapter Lead v101 plan. Member Epic 11 owns capture/integration support; it does not mark Lead research or writing complete. Behavioral artifacts moved into Chapter 13. Artifact identifiers are updated to the canonical chapter numbers.

The manifest is intentionally data-driven at `src/features/thesis-engineering/data/thesisEvidenceManifest.ts`. New leader deliverables should add or update an artifact there rather than burying a claim inside a component.

## Evidence states

- `ready`: the UI or diagram can be captured now.
- `pending-data`: the surface exists, but a measured Leader export or deployment fact is required before it can support a thesis claim.
- `capture-needed`: the content is defined but still needs a final screenshot or figure capture.

The workspace never marks a pending result as verified. Evaluation and graph pages retain their existing placeholder/pending labels, and the chapter cards surface those dependencies before capture.

## Capture workflow

1. Open `/thesis` and select the chapter being written.
2. Open the linked product surface from the artifact card.
3. Follow the capture brief and keep the data-source/version label in frame.
4. Use the existing evaluation chart export controls for thesis figures.
5. When the Leader supplies data, replace it through the Epic 9/Epic 10 adapters and recapture only the affected artifacts.
