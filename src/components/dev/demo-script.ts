export interface DemoScriptBeat {
	beatId: string
	title: string
	objective: string
	proofPoints: string[]
	prompts: string[]
	fallbackLine: string
}

export const DEMO_PITCH_SCRIPT: Record<string, DemoScriptBeat> = {
	'conversion-moat': {
		beatId: 'conversion-moat',
		title: '1. Kitchen Continuity',
		objective:
			'Establish the core value: discovery continues into a usable cooking session.',
		proofPoints: ['Personalized recipe reasons', 'Cook mode on a real recipe'],
		prompts: [
			'Point to the reasons ChefKix gives for the recipe recommendation.',
			'Open the hero recipe and start the actual guided cooking flow.',
			'Show that spoken guidance can be quiet without muting timer alerts.',
		],
		fallbackLine:
			'ChefKix earns trust by carrying one useful recipe from discovery into the hands-dirty moment.',
	},
	'taste-graph': {
		beatId: 'taste-graph',
		title: '2. Search And Taste Context',
		objective:
			'Show that search, explicit preferences, and cooking history form one product story.',
		proofPoints: ['Natural-language food intent', 'Real recipe destinations'],
		prompts: [
			'Search for "cozy winter food".',
			'Point out the preference context shown on the result surfaces.',
			'Open a result to prove the search path ends at a cookable recipe.',
		],
		fallbackLine:
			'People describe cravings, not database categories. ChefKix keeps that intent connected to what they can actually cook.',
	},
	'viral-loop': {
		beatId: 'viral-loop',
		title: '3. One-To-One Co-Cook',
		objective:
			'Demonstrate the implemented shared-cooking workflow without implying unbuilt multi-party scale.',
		proofPoints: [
			'1:1 shared cooking',
			'TURN relay readiness',
			'Audio-only fallback',
		],
		prompts: [
			'Keep camera, clap, and voice controls off unless the cockpit marks them green.',
			'Show the invite path and the explicit connection state.',
			'Lead with manual reconnect and audio-only fallback as the resilient path.',
		],
		fallbackLine:
			'The product proof today is a bounded one-to-one cooking session with explicit recovery when the network is imperfect.',
	},
	'commerce-intent': {
		beatId: 'commerce-intent',
		title: '4. Plan Today',
		objective:
			'Show a realistic household cooking batch grounded in pantry, effort, and yield.',
		proofPoints: ['2 planning modes', '2-4 compatible dishes per batch'],
		prompts: [
			'Choose Cook Once Today or Dinner With Leftovers.',
			'Adjust household size and active-time budget.',
			'Show that every dish opens a real recipe and rolls into one shopping list.',
		],
		fallbackLine:
			'The durable value is a plan a working household can execute; commerce is a future handoff, not a claim in this demo.',
	},
	'creator-engine': {
		beatId: 'creator-engine',
		title: '5. Creator Engine',
		objective:
			'Show the concrete feedback and trust tools available to a recipe creator.',
		proofPoints: ['Recipe-level analytics', 'Step-level completion evidence'],
		prompts: [
			'Swap to the Creator Persona (chef_minh).',
			'Show the Heatmap and analytics dashboard.',
			'Connect creator decisions to visible recipe and step performance.',
		],
		fallbackLine:
			'Creator value here is measurable feedback on what cooks complete, not an unproven earnings promise.',
	},
	'trust-layer': {
		beatId: 'trust-layer',
		title: '6. The Trust Layer (Admin)',
		objective:
			'Demonstrate the moderation workflow that is implemented and visible today.',
		proofPoints: ['Reports queue', 'Bans and appeals workflow'],
		prompts: [
			'Swap to the Admin Persona (admin_demo).',
			'Show the moderation queue.',
			'Open the adjacent ban and appeal controls.',
		],
		fallbackLine:
			'ChefKix has an explicit human-operable trust workflow; automation leverage is something production evidence must earn.',
	}
}
