# Epic 11 thesis engineering handoff

The thesis evidence workspace is available at `/thesis`. It converts the Member Epic 11 checklist into a versioned manifest of chapter criteria, capture briefs, source routes, and data dependencies.

## Chapter coverage

| Chapter                  | Workspace coverage                                         | Primary source                            |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------- |
| 5 · Compound Explanation | UI screenshot, pipeline diagram, user-facing example       | `/cook`, Epic 4 compound export           |
| 6 · Allergen Safety      | safety screenshot, head-to-head figure, constraint flow    | `/demo/allergen-safety`, Epic 5 benchmark |
| 7 · Behavioral Learning  | feedback screenshot, capture architecture, MRR figure      | `/cook`, Epic 7 simulation export         |
| 8 · Multi-Modal          | scan screenshot, detection-to-graph demo, pipeline diagram | `/scan`, Epic 8 model endpoints           |
| 10 · System Architecture | stack diagram, deployment topology, hosting note           | repository topology, infrastructure plan  |
| 11 · Evaluation          | dashboard screenshot, chart exports, provenance checklist  | `/admin/evaluation`, Epic 3/5/7 exports   |

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
