# Epic 9 evaluation dashboard handoff

The evaluation dashboard is wired to typed JSON adapters so the Lead can replace the current local exports without changing the UI components.

## Data surfaces

| UI surface            | Current file                                                     | Leader dependency                           |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| Benchmark comparison  | `src/features/evaluation-dashboard/data/benchmark_results.json`  | Leader Epic 3 benchmark export              |
| Ablation chart        | `src/features/evaluation-dashboard/data/ablation_results.json`   | Leader Epic 3 ablation export               |
| Allergen safety chart | `src/features/evaluation-dashboard/data/allergen_benchmark.json` | Leader Epic 5 controlled benchmark          |
| Behavioral MRR card   | `src/features/evaluation-dashboard/data/behavioral_results.json` | Leader Epic 7 static-vs-feedback simulation |

The service boundary is `src/features/evaluation-dashboard/services/evaluationDashboardService.ts`. Both bundled and remote records pass through `evaluationDashboardSchema.ts`. Invalid/missing sections, duplicate identities, nonnumeric/out-of-range metrics and inconsistent behavioral deltas reject the entire load. Pending and placeholder numeric fields are suppressed before rendering; negative results retain their status and caveats.

For a live Leader manifest, set `NEXT_PUBLIC_EVALUATION_DATA_URL` to a trusted JSON endpoint returning either the dashboard object directly or `{ "data": <dashboard object> }`. Bundled records are used only when the variable is unset. A failed/malformed remote response shows an error, without falling back to old records. Status labels and schema validation do not verify source hashes or scientific authenticity.

The three matching `public/data/` filenames now serve the same dashboard records. Update both copies together; `publicEvaluationExports.test.ts` enforces equality. Retired synthetic benchmark/ablation files and the differently shaped historical label-concordance audit remain in Git history, not under active benchmark URLs. Consumers of those legacy raw shapes must migrate to the documented dashboard contract.

As of Lead v101, M2 has completed DPO and verified Stage-3 step 70/561, but no matched score. The old paper Mistral value is not a substitute for those predictions. Mistral small 2603's 208 raw allergen responses are distinct from the M2 trained model and carry no scored rate.

## Safety result acceptance

Every `complete` allergen row requires `violationRate` (0–100), positive integer `totalCases`, optional `caughtViolations` no larger than the case count, and:

```json
{
	"adjudication": {
		"protocol": "exact-frozen-protocol-id",
		"reviewerCount": 2,
		"status": "complete",
		"resultsSha256": "<64 hexadecimal characters from the actual scored artifact>"
	}
}
```

This is a transport check, not proof that reviewers were independent or that bytes reconstruct. The publisher must validate actual matched arms, reviews, adjudication and hashes. Detailed dataset/split/seed provenance, confidence intervals, independent artifact verification and provenance embedded in exported figures remain tracked as G6 in the member backlog.

All metric values are percentage points from `0` to `100`, including MRR. For example, an MRR delta of `8.4` renders as `8.40%`, not `0.084%`.

## Expected behavioral export

```json
{
	"version": "lead-export-v1",
	"updatedAt": "YYYY-MM-DD",
	"status": "complete",
	"metric": "mrr",
	"staticMrr": 31.2,
	"feedbackMrr": 39.6,
	"mrrDelta": 8.4,
	"note": "Held-out corpus and simulation configuration used for the thesis"
}
```

Each chart has an accessible SVG representation and an `Export image` action that downloads a 2x PNG suitable for thesis figures. The chart component owns the export implementation, so future data changes do not need page-level canvas code.

### Per-result provenance and standalone figures

Each benchmark model, ablation result, allergen model and behavioral result may carry `provenance` with required nonempty `dataset`, `split`, `protocol`, `claimLimits`; unique integer `seeds`; full `sourceSha256` and `predictionsSha256`; and `decision` (`accepted`, `rejected`, `pending`, `published`). Missing provenance remains explicitly unavailable. If supplied, the complete object must validate. This is a transport contract, not authentication of scientific evidence. The publisher must independently verify the referenced artifacts and decision.

Every bar-chart export embeds result labels/status, supplied notes, provenance and claim limits inside the SVG used to create the PNG. Export height grows with wrapped captions. Full hashes are retained. Records using different protocols must not be interpreted as a matched comparison. Confidence intervals, abstention and matched strata remain pending until their scored Lead exports arrive.
