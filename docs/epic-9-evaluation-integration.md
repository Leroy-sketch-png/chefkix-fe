# Epic 9 evaluation dashboard handoff

The evaluation dashboard is wired to typed JSON adapters so the Lead can replace the current local exports without changing the UI components.

## Data surfaces

| UI surface            | Current file                                                     | Leader dependency                           |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| Benchmark comparison  | `src/features/evaluation-dashboard/data/benchmark_results.json`  | Leader Epic 3 benchmark export              |
| Ablation chart        | `src/features/evaluation-dashboard/data/ablation_results.json`   | Leader Epic 3 ablation export               |
| Allergen safety chart | `src/features/evaluation-dashboard/data/allergen_benchmark.json` | Leader Epic 5 controlled benchmark          |
| Behavioral MRR card   | `src/features/evaluation-dashboard/data/behavioral_results.json` | Leader Epic 7 static-vs-feedback simulation |

The service boundary is `src/features/evaluation-dashboard/services/evaluationDashboardService.ts`. Keep the JSON field names and status values (`pending`, `placeholder`, or `complete`) when replacing an export. Missing metrics intentionally render as `Pending`; placeholder values remain labeled and are not presented as thesis evidence.

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
