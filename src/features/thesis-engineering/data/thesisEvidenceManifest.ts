import type { ThesisEvidenceManifest } from '../types'

export const thesisEvidenceManifest: ThesisEvidenceManifest = {
	version: 'lead-v101-member-v2',
	updatedAt: '2026-10-04',
	chapters: [
		{
			id: '1',
			title: 'Introduction: Three Failures',
			focus:
				'Lead evidence collected; draft needed. Explain generalization, safety uncertainty, and explanation limits.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-1-lead-evidence',
					chapterId: '1',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Lead evidence collected; draft needed. Explain generalization, safety uncertainty, and explanation limits.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '2',
			title: 'Related Work',
			focus:
				'Lead draft exists. Audit citations and distinguish reproduced baselines from paper-reported results.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-2-lead-evidence',
					chapterId: '2',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Lead draft exists. Audit citations and distinguish reproduced baselines from paper-reported results.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '3',
			title: 'Multi-Signal Food KG',
			focus:
				'Graph reconstruction verified; USDA partial. Capture bounded graph coverage and source/license boundaries.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-3-lead-evidence',
					chapterId: '3',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Graph reconstruction verified; USDA partial. Capture bounded graph coverage and source/license boundaries.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '4',
			title: 'IRON CHEF GNN: Fusion Paradox & SAG (M1)',
			focus:
				'Corrected SAG and true-context dual encoder are verified negative results. An accepted model is absent.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-4-lead-evidence',
					chapterId: '4',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Corrected SAG and true-context dual encoder are verified negative results. An accepted model is absent.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '5',
			title: 'ChefKix-Mistral-7B (M2)',
			focus:
				'Lead v99: DPO complete; post-DPO SFT verified through 70/561. Step 140, predictions, scoring, and model quality remain unverified.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-5-lead-evidence',
					chapterId: '5',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Lead v99: DPO complete; post-DPO SFT verified through 70/561. Step 140, predictions, scoring, and model quality remain unverified.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '6',
			title: 'ChefKix-VLM (M3)',
			focus:
				'Historical mock adapter rejected. Fifty rights-bound candidates await two independent reviews; training is absent.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-6-lead-evidence',
					chapterId: '6',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Historical mock adapter rejected. Fifty rights-bound candidates await two independent reviews; training is absent.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '7',
			title: 'ChefKix-CLIP (M4)',
			focus:
				'Frozen-feature projection trained and rejected. Product serving requires a future accepted rights-cleared result.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-7-lead-evidence',
					chapterId: '7',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Frozen-feature projection trained and rejected. Product serving requires a future accepted rights-cleared result.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '10',
			title: 'Selective Abstention',
			focus:
				'Protocol frozen; accepted candidate absent. Do not report calibrated risk or coverage results.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-10-lead-evidence',
					chapterId: '10',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Protocol frozen; accepted candidate absent. Do not report calibrated risk or coverage results.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '14',
			title: 'Conclusion & Future Work',
			focus:
				'Lead draft exists. Preserve negative results and open gates; recorded/scored human defense rehearsal remains required.',
			criteria: [
				'Bind the chapter to the current Lead ledger and source artifacts',
				'Keep missing results and rejected candidates explicit',
			],
			artifacts: [
				{
					id: 'chapter-14-lead-evidence',
					chapterId: '14',
					title: 'Lead evidence handoff',
					kind: 'example',
					description:
						'Lead draft exists. Preserve negative results and open gates; recorded/scored human defense rehearsal remains required.',
					dependency:
						'Leader BACKLOG_LEAD.md v101 and hash-bound chapter artifacts',
					status: 'pending-data',
					captureBrief: [
						'Obtain the actual source artifact; a backlog summary is not independent verification.',
						'Record dataset, split, protocol, seed count, hashes, and claim limits where applicable.',
					],
				},
			],
		},
		{
			id: '8',
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
					id: 'chapter-8-compound-ui',
					chapterId: '8',
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
						'Include compound provenance; missing nutrition stays unavailable.',
					],
				},
				{
					id: 'chapter-8-pipeline',
					chapterId: '8',
					title: 'Compound explanation pipeline diagram',
					kind: 'diagram',
					description:
						'Trace official FooDB compound-presence records into the substitution response; functional suitability is not established.',
					dependency: 'Leader Epic 4 compound engine contract',
					status: 'ready',
					captureBrief: [
						'Use the architecture diagram as the base.',
						'Annotate the compound-index and shared-overlap stages.',
					],
				},
				{
					id: 'chapter-8-example',
					chapterId: '8',
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
			id: '9',
			title: 'Real LLM Allergen Benchmark',
			focus:
				'Show tri-state policy behavior and the limits of unadjudicated evidence.',
			criteria: [
				'Screenshot safety indicators',
				'Capture the clearly labeled interface illustration; comparative rates remain gated',
				'Include controlled violation-rate evidence',
			],
			artifacts: [
				{
					id: 'chapter-9-safety-ui',
					chapterId: '9',
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
						'Keep the illustration label and specific allergen warning visible.',
					],
				},
				{
					id: 'chapter-9-head-to-head',
					chapterId: '9',
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
					id: 'chapter-9-constraint',
					chapterId: '9',
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
			id: '11',
			title: 'Photo → Intelligence Pipeline',
			focus:
				'Show the investor-facing path from camera input to graph-grounded recipes.',
			criteria: [
				'Capture the photo pipeline UI',
				'Show ingredient detection flowing into graph query',
				'Keep model readiness and fallbacks explicit',
			],
			artifacts: [
				{
					id: 'chapter-11-scan',
					chapterId: '11',
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
					id: 'chapter-11-flow',
					title: 'Detection-to-graph demo flow',
					chapterId: '11',
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
					id: 'chapter-11-architecture',
					title: 'Multi-modal pipeline diagram',
					chapterId: '11',
					kind: 'diagram',
					description:
						'Show image capture, detection, recipe retrieval, graph reasoning, and UI presentation.',
					dependency:
						'Leader L29 offline-chain boundary and M3/M4 serving gates',
					status: 'ready',
					captureBrief: [
						'Keep pending endpoints visually distinct.',
						'Show the graph neighborhood boundary rather than the full graph.',
					],
				},
			],
		},
		{
			id: '12',
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
					id: 'chapter-12-stack',
					title: 'IRON CHEF v3 stack diagram',
					chapterId: '12',
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
					id: 'chapter-12-deployment',
					title: 'Deployment topology',
					chapterId: '12',
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
					id: 'chapter-12-cost',
					title: '$0-hosting evidence note',
					chapterId: '12',
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
			id: '13',
			title: 'Evaluation & Ablation',
			focus:
				'Export thesis-ready evidence without confusing placeholders with measured results.',
			criteria: [
				'Export dashboard charts as figures',
				'Include benchmark, ablation, allergen, and behavioral captions',
				'Preserve dataset version and provenance',
			],
			artifacts: [
				{
					id: 'chapter-13-feedback-ui',
					chapterId: '13',
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
					id: 'chapter-13-capture-flow',
					chapterId: '13',
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
					id: 'chapter-13-mrr',
					chapterId: '13',
					title: 'Behavioral MRR figure',
					kind: 'figure',
					description:
						'Export static HGAT versus feedback-updated HGAT MRR and delta.',
					route: '/admin/evaluation#behavioral',
					dependency:
						'Leader acceptance-proxy simulation export and rejected production gate',
					status: 'pending-data',
					captureBrief: [
						'Export the behavioral chart after the held-out corpus values arrive.',
						'Report simulation configuration beside the delta.',
					],
				},
				{
					id: 'chapter-13-dashboard',
					title: 'Evaluation dashboard screenshot',
					chapterId: '13',
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
					id: 'chapter-13-figures',
					title: 'Thesis-ready chart exports',
					chapterId: '13',
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
					id: 'chapter-13-provenance',
					title: 'Figure provenance checklist',
					chapterId: '13',
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

thesisEvidenceManifest.chapters.sort((a, b) => Number(a.id) - Number(b.id))
