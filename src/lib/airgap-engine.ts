import { useTelemetryStore } from './ghost-driver'

const MOCK_RECIPES = {
	status: 'success',
	data: [
		{
			id: 'recipe-1',
			title: 'Seared Scallops with Truffle Risotto',
			chef: 'Gordon Ramsay',
			difficulty: 'Hard',
			time: '45 mins',
			ingredients: ['Scallops', 'Arborio Rice', 'Truffle Oil', 'Butter', 'Parmesan', 'White Wine'],
			steps: [
				'Sear the scallops on high heat.',
				'Toast the arborio rice in butter.',
				'Slowly incorporate chicken stock.'
			]
		}
	]
}

const MOCK_TASTE_DNA = {
	status: 'success',
	data: {
		spicy: 80,
		sweet: 20,
		savory: 95,
		sour: 40,
		bitter: 10,
		tonightsPick: {
			id: 'recipe-2',
			title: 'Spicy Garlic Noodles',
			matchScore: 98
		}
	}
}

const MOCK_CREATOR_STATS = {
	status: 'success',
	data: {
		totalCooks: 12450,
		completionRate: 85,
		stepDropoffs: [
			{ step: 1, remaining: 100 },
			{ step: 2, remaining: 98 },
			{ step: 3, remaining: 92 },
			{ step: 4, remaining: 85 }
		]
	}
}

export function initializeAirGap() {
	if (typeof window === 'undefined') return
	if ((window as any).__AIRGAP_INITIALIZED) return
	;(window as any).__AIRGAP_INITIALIZED = true

	const originalFetch = window.fetch
	useTelemetryStore.getState().addLog('AIRGAP', 'warn', 'INITIALIZING AIR-GAP ENGINE. NETWORK SEVERED.')

	window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
		
		useTelemetryStore.getState().addLog('AIRGAP', 'info', `Intercepted: ${url}`)

		// Simulate network latency (ultra fast for demo)
		await new Promise(r => setTimeout(r, 10 + Math.random() * 20))

		let mockResponse: any = { status: 'success' }

		if (url.includes('/api/recipes')) mockResponse = MOCK_RECIPES
		else if (url.includes('/api/taste-profile')) mockResponse = MOCK_TASTE_DNA
		else if (url.includes('/api/creator/stats')) mockResponse = MOCK_CREATOR_STATS
		else if (url.includes('/api/chat')) {
			mockResponse = {
				status: 'success',
				reply: 'Absolutely! You can substitute butter for olive oil in a 1:1 ratio. It will give the risotto a richer, nuttier flavor.'
			}
		}

		useTelemetryStore.getState().addLog('AIRGAP', 'success', `Injected synthetic payload for ${url.split('/').pop()}`)

		return new Response(JSON.stringify(mockResponse), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}
