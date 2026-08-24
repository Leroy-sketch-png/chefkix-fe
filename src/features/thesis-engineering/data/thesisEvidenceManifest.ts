import type { ThesisEvidenceManifest } from '../types'

export const thesisEvidenceManifest: ThesisEvidenceManifest = {
	version: 'epic-11-v1',
	updatedAt: '2026-08-24',
	chapters: [
		{
			id: '5',
			title: 'Compound Explanation',
			focus:
				'Make chemistry-grounded substitution reasoning visible and defensible.',
			criteria: [
				'Screenshot the compound explanation UI',
				'Document the explanation pipeline',
				'Capture a user-facing compound example from the Leader export',
			],
			artifacts: [
				{
					id: 'chapter-5-compound-ui',
					chapterId: '5',
					title: 'Compound explanation UI screenshot',
					kind: 'screenshot',
					description:
						'Show confidence, shared compounds, nutrition, and safety in one substitution card.',
					route: '/cook',
					dependency:
						'Existing CompoundExplanation surface; real Epic 4 payload for final values',
					status: 'ready',
					captureBrief: [
						'Use a substitution with the expanded explanation visible.',
						'Include the chemistry-grounded badge and nutritional comparison.',
					],
				},
				{
					id: 'chapter-5-pipeline',
					chapterId: '5',
					title: 'Compound explanation pipeline diagram',
					kind: 'diagram',
					description:
						'Trace FooDB and FlavorDB data through the compound engine into the substitution response.',
					dependency: 'Leader Epic 4 compound engine contract',
					status: 'ready',
					captureBrief: [
						'Use the architecture diagram as the base.',
						'Annotate the compound-index and shared-overlap stages.',
					],
				},
				{
					id: 'chapter-5-example',
					chapterId: '5',
					title: 'User-facing chemistry example',
					kind: 'example',
					description:
						'Record one complete substitution explanation with named molecules and a measurable overlap.',
					dependency: 'Leader Epic 4 compound explanation export',
					status: 'pending-data',
					captureBrief: [
						'Replace the pending values with the exported compound profile.',
						'Cite the source dataset and units in the thesis caption.',
					],
				},
			],
		},
		{
			id: '6',
			title: 'Allergen Safety',
			focus:
				'Show the hard safety constraint and the evidence behind the comparison.',
			criteria: [
				'Screenshot safety indicators',
				'Capture the IRON CHEF versus GPT-4o comparison',
				'Include controlled violation-rate evidence',
			],
			artifacts: [
				{
					id: 'chapter-6-safety-ui',
					chapterId: '6',
					title: 'Safety comparison UI screenshot',
					kind: 'screenshot',
					description:
						'Show safe, check, and blocked states with the specific allergen reason.',
					route: '/demo/allergen-safety',
					dependency:
						'Existing allergen safety surface; real Epic 5 guard output for final claims',
					status: 'ready',
					captureBrief: [
						'Use the peanut-butter scenario.',
						'Keep the specific allergen warning and comparison columns visible.',
					],
				},
				{
					id: 'chapter-6-head-to-head',
					chapterId: '6',
					title: 'Head-to-head safety evidence',
					kind: 'figure',
					description:
						'Export the controlled IRON CHEF, GPT-4o, and Gemini violation-rate comparison.',
					route: '/admin/evaluation#safety',
					dependency: 'Leader Epic 5 allergen_benchmark.json',
					status: 'pending-data',
					captureBrief: [
						'Use the allergen chart export control.',
						'Include the benchmark version and test-case count in the caption.',
					],
				},
				{
					id: 'chapter-6-constraint',
					chapterId: '6',
					title: 'Allergen constraint flow',
					kind: 'diagram',
					description:
						'Show profile lookup, candidate filtering, and blocked-reason presentation.',
					dependency:
						'Existing allergen-safety resolver and Leader guard contract',
					status: 'ready',
					captureBrief: [
						'Use a three-step flow: profile → guard → UI state.',
						'Label blocked candidates as excluded from primary suggestions.',
					],
				},
			],
		},
		{
			id: '7',
			title: 'Behavioral Learning',
			focus:
				'Explain how cooking feedback becomes training signal without overstating results.',
			criteria: [
				'Screenshot the feedback instrument flow',
				'Document the data-capture architecture',
				'Show the static-versus-feedback MRR result when exported',
			],
			artifacts: [
				{
					id: 'chapter-7-feedback-ui',
					chapterId: '7',
					title: 'Feedback instrument screenshot',
					kind: 'screenshot',
					description:
						'Show the explicit substitution outcome and taste feedback controls in the cooking flow.',
					route: '/cook',
					dependency: 'Existing CookingPlayer feedback instrument',
					status: 'ready',
					captureBrief: [
						'Capture the outcome choices and optional taste feedback.',
						'Avoid including private user/session identifiers.',
					],
				},
				{
					id: 'chapter-7-capture-flow',
					chapterId: '7',
					title: 'Feedback data-capture architecture',
					kind: 'diagram',
					description:
						'Trace a user choice through the API event and into the behavioral simulation export.',
					dependency:
						'Substitution feedback event contract and Leader Epic 7 simulation',
					status: 'ready',
					captureBrief: [
						'Show the user action, persisted event, replay corpus, and MRR evaluation.',
						'Mark feedback as an input signal, not proof of model improvement by itself.',
					],
				},
				{
					id: 'chapter-7-mrr',
					chapterId: '7',
					title: 'Behavioral MRR figure',
					kind: 'figure',
					description:
						'Export static HGAT versus feedback-updated HGAT MRR and delta.',
					route: '/admin/evaluation#behavioral',
					dependency: 'Leader Epic 7 behavioral simulation export',
					status: 'pending-data',
					captureBrief: [
						'Export the behavioral chart after the held-out corpus values arrive.',
						'Report simulation configuration beside the delta.',
					],
				},
			],
		},
		{
			id: '8',
			title: 'Multi-Modal Pipeline',
			focus:
				'Show the investor-facing path from camera input to graph-grounded recipes.',
			criteria: [
				'Capture the photo pipeline UI',
				'Show ingredient detection flowing into graph query',
				'Keep model readiness and fallbacks explicit',
			],
			artifacts: [
				{
					id: 'chapter-8-scan',
					chapterId: '8',
					title: 'Photo pipeline screenshot',
					kind: 'screenshot',
					description:
						'Show camera capture, front/back camera control, detection states, and recipe handoff.',
					route: '/scan',
					dependency:
						'Existing scan surface; real YOLOv8 and CLIP endpoints remain leader dependencies',
					status: 'ready',
					captureBrief: [
						'Use a clean permission-granted camera state.',
						'Include the explicit model/source status in the frame.',
					],
				},
				{
					id: 'chapter-8-flow',
					title: 'Detection-to-graph demo flow',
					chapterId: '8',
					kind: 'demo',
					description:
						'Demonstrate detected ingredients becoming a bounded graph neighborhood query.',
					route: '/scan',
					dependency:
						'Leader YOLOv8 detection and cross-modal retrieval endpoints',
					status: 'pending-data',
					captureBrief: [
						'Record detection output, confidence, and graph request in sequence.',
						'Do not present sample detections as trained-model evidence.',
					],
				},
				{
					id: 'chapter-8-architecture',
					title: 'Multi-modal pipeline diagram',
					chapterId: '8',
					kind: 'diagram',
					description:
						'Show image capture, detection, recipe retrieval, graph reasoning, and UI presentation.',
					dependency: 'Leader Epic 6/8 model endpoint plan',
					status: 'ready',
					captureBrief: [
						'Keep pending endpoints visually distinct.',
						'Show the graph neighborhood boundary rather than the full graph.',
					],
				},
			],
		},
		{
			id: '10',
			title: 'System Architecture',
			focus:
				'Make the complete IRON CHEF v3 stack and deployment assumptions easy to defend.',
			criteria: [
				'Include the full stack architecture diagram',
				'Document deployment boundaries',
				'Identify the $0-hosting assumptions that must be verified',
			],
			artifacts: [
				{
					id: 'chapter-10-stack',
					title: 'IRON CHEF v3 stack diagram',
					chapterId: '10',
					kind: 'diagram',
					description:
						'Present FE, monolith, AI service, model registry, and leader export boundaries.',
					dependency: 'Current repository topology and leader integration plan',
					status: 'ready',
					captureBrief: [
						'Use the embedded architecture diagram.',
						'Caption every arrow with the data contract it carries.',
					],
				},
				{
					id: 'chapter-10-deployment',
					title: 'Deployment topology',
					chapterId: '10',
					kind: 'diagram',
					description:
						'Document browser hosting, API hosting, AI runtime, storage, and environment boundaries.',
					dependency:
						'Infrastructure repository and final deployment configuration',
					status: 'pending-data',
					captureBrief: [
						'Replace assumptions with the deployed URLs and regions.',
						'Record the runtime and storage cost evidence.',
					],
				},
				{
					id: 'chapter-10-cost',
					title: '$0-hosting evidence note',
					chapterId: '10',
					kind: 'example',
					description:
						'List free-tier assumptions and the boundaries where paid capacity begins.',
					dependency: 'Final infrastructure plan; not a claim until verified',
					status: 'pending-data',
					captureBrief: [
						'Cite provider free-tier terms at defense time.',
						'Separate current cost from projected production cost.',
					],
				},
			],
		},
		{
			id: '11',
			title: 'Evaluation Figures',
			focus:
				'Export thesis-ready evidence without confusing placeholders with measured results.',
			criteria: [
				'Export dashboard charts as figures',
				'Include benchmark, ablation, allergen, and behavioral captions',
				'Preserve dataset version and provenance',
			],
			artifacts: [
				{
					id: 'chapter-11-dashboard',
					title: 'Evaluation dashboard screenshot',
					chapterId: '11',
					kind: 'screenshot',
					description:
						'Show the thesis evidence command center and readiness state.',
					route: '/admin/evaluation',
					dependency: 'Existing Epic 9 dashboard',
					status: 'ready',
					captureBrief: [
						'Capture the dashboard with the dataset status visible.',
						'Keep the schema/version footer in frame.',
					],
				},
				{
					id: 'chapter-11-figures',
					title: 'Thesis-ready chart exports',
					chapterId: '11',
					kind: 'figure',
					description:
						'Export benchmark, ablation, allergen, and behavioral figures at 2x PNG resolution.',
					route: '/admin/evaluation',
					dependency: 'Leader Epic 3, 5, and 7 result exports',
					status: 'pending-data',
					captureBrief: [
						'Use the per-chart Export image action.',
						'Name files with the metric, version, and date.',
					],
				},
				{
					id: 'chapter-11-provenance',
					title: 'Figure provenance checklist',
					chapterId: '11',
					kind: 'example',
					description:
						'Attach dataset version, update date, evaluation split, and placeholder status to every figure.',
					dependency: 'Leader export metadata',
					status: 'ready',
					captureBrief: [
						'Copy the schema/version footer into the thesis notes.',
						'Do not remove pending labels from illustrative values.',
					],
				},
			],
		},
	],
}
