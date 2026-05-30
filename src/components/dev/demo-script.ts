export interface DemoScriptBeat {
	beatId: string
	title: string
	objective: string
	mustSayNumbers: string[]
	prompts: string[]
	fallbackLine: string
}

export const DEMO_PITCH_SCRIPT: Record<string, DemoScriptBeat> = {
	'conversion-moat': {
		beatId: 'conversion-moat',
		title: '1. Conversion Moat',
		objective: 'Establish the core user value and zero-friction onboarding.',
		mustSayNumbers: ['60% lower CAC', 'Day 1 Retention > 40%'],
		prompts: [
			'Highlight the personalized Taste Graph generation.',
			'Show how quickly a new user finds a Hero Recipe.',
			'Emphasize that there is ZERO generic feed algorithm.'
		],
		fallbackLine: 'The magic is that within 30 seconds of install, the user is already looking at their perfect recipe.'
	},
	'taste-graph': {
		beatId: 'taste-graph',
		title: '2. The Taste Graph',
		objective: 'Showcase the AI-driven compatibility and semantic search.',
		mustSayNumbers: ['300M+ edges in the graph', '<200ms semantic retrieval'],
		prompts: [
			'Search for "cozy winter food".',
			'Point out the compatibility scores on the recipe cards.',
			'Explain how the vector DB matches flavor profiles, not just text tags.'
		],
		fallbackLine: 'We don\'t match keywords, we match palates. That\'s why our search feels telepathic.'
	},
	'viral-loop': {
		beatId: 'viral-loop',
		title: '3. Co-Cook & Viral Loop',
		objective: 'Demonstrate the multiplayer cooking experience.',
		mustSayNumbers: ['K-Factor of 1.4', 'Avg 45 mins session length'],
		prompts: [
			'Trigger the "Start Cooking" flow.',
			'Explain the invite mechanic (second screen syncs instantly).',
			'Show how shared progress creates built-in accountability and retention.'
		],
		fallbackLine: 'Cooking is inherently social. By bringing the multiplayer aspect into the kitchen, our users recruit their friends for us.'
	},
	'commerce-intent': {
		beatId: 'commerce-intent',
		title: '4. High-Intent Commerce',
		objective: 'Prove the monetization model via the Pantry.',
		mustSayNumbers: ['22% conversion on grocery integration', '$14 LTV bump'],
		prompts: [
			'Navigate to the Pantry view.',
			'Show the low-inventory warning on key ingredients.',
			'Highlight the one-click "Add to Cart" API integration.'
		],
		fallbackLine: 'Because we know exactly what they are cooking tonight, we own the highest-intent grocery funnel in the industry.'
	},
	'creator-engine': {
		beatId: 'creator-engine',
		title: '5. Creator Engine',
		objective: 'Show how supply is generated and rewarded.',
		mustSayNumbers: ['Top creators earn $2k/mo', '15% MoM supply growth'],
		prompts: [
			'Swap to the Creator Persona (chef_minh).',
			'Show the Heatmap and analytics dashboard.',
			'Explain the tipping/premium recipe unlock mechanics.'
		],
		fallbackLine: 'We give creators the best tools to monetize their recipes, ensuring the platform always has premium, exclusive content.'
	},
	'trust-layer': {
		beatId: 'trust-layer',
		title: '6. The Trust Layer (Admin)',
		objective: 'Demonstrate scalable moderation and safety.',
		mustSayNumbers: ['99.9% automated resolution', 'Zero toxic engagement'],
		prompts: [
			'Swap to the Admin Persona (admin_demo).',
			'Show the moderation queue.',
			'Explain how the AI pre-filters toxic recipe comments before humans see them.'
		],
		fallbackLine: 'Our community feels safe because our moderation engine scales sub-linearly with user growth.'
	}
}
