import {
	createIntegrationPendingResponse,
	getVoiceCopilotEndpoint,
	normalizeVoiceCopilotResponse,
} from '../services/voiceCopilotService'

describe('voice copilot service contract', () => {
	it('stays explicit while the Leader endpoint is not configured', () => {
		delete process.env.NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT
		expect(getVoiceCopilotEndpoint()).toBeNull()
		expect(createIntegrationPendingResponse()).toMatchObject({
			status: 'integration-pending',
			source: 'integration-pending',
		})
	})

	it('normalizes the Leader answer, interventions, and graph evidence', () => {
		expect(
			normalizeVoiceCopilotResponse({
				data: {
					answer: 'Lower the heat.',
					speech_text: 'Lower the heat.',
					interventions: [
						{
							id: 'heat-1',
							severity: 'warning',
							title: 'Pan is hot',
							message: 'The oil may be smoking.',
							suggestedAction: 'Lower the heat.',
						},
					],
					graphEvidence: [
						{ id: 'g-1', label: 'Sautéing', source: 'recipe-graph' },
					],
				},
			}),
		).toMatchObject({
			status: 'ready',
			answer: 'Lower the heat.',
			speechText: 'Lower the heat.',
			source: 'leader-api',
			interventions: [{ id: 'heat-1', severity: 'warning' }],
			evidence: [{ id: 'g-1', source: 'recipe-graph' }],
		})
	})
})
