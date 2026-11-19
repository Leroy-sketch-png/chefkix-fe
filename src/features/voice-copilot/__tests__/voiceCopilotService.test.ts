import { aiApi } from '@/lib/axios'
import {
	createIntegrationPendingResponse,
	getVoiceCopilotEndpoint,
	normalizeVoiceCopilotResponse,
	orchestrateVoiceCopilot,
} from '../services/voiceCopilotService'

jest.mock('@/lib/axios', () => ({
	aiApi: {
		post: jest.fn(),
	},
}))

describe('voice copilot service contract', () => {
	const originalEndpoint = process.env.NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT

	afterEach(() => {
		if (originalEndpoint !== undefined) {
			process.env.NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT = originalEndpoint
		} else {
			delete process.env.NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT
		}
		jest.clearAllMocks()
	})

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

	it('orchestrateVoiceCopilot returns integration-pending when endpoint is not configured', async () => {
		delete process.env.NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT
		const result = await orchestrateVoiceCopilot({
			command: 'What should I do?',
		})
		expect(result.status).toBe('integration-pending')
		expect(result.source).toBe('integration-pending')
		expect(aiApi.post).not.toHaveBeenCalled()
	})

	it('orchestrateVoiceCopilot calls configured endpoint and returns normalized response', async () => {
		process.env.NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT = '/api/v1/copilot/query'
		const mockPost = aiApi.post as jest.Mock
		mockPost.mockResolvedValueOnce({
			data: {
				answer: 'Maintain 165F internal temperature for poultry.',
				speechText: 'Maintain 165 degrees internal temperature for poultry.',
				interventions: [
					{
						id: 'usda-safety',
						severity: 'critical',
						title: 'Safe Minimum Temperature',
						message: 'Poultry must reach 165F.',
						suggestedAction: 'Use food thermometer.',
						source: 'usda-fsis',
					},
				],
				evidence: [
					{
						id: 'graph-chicken',
						label: 'Chicken Breast',
						source: 'recipe-graph',
						confidence: 0.95,
					},
				],
				requestId: 'req-123',
			},
		})

		const request = {
			command: 'Is the chicken done?',
			frameDataUrl: 'data:image/jpeg;base64,mockframe',
			context: {
				recipeId: 'rec-1',
				recipeTitle: 'Pan Seared Chicken',
				currentStep: 2,
				currentStepInstruction: 'Sear until golden brown',
			},
		}

		const result = await orchestrateVoiceCopilot(request)

		expect(mockPost).toHaveBeenCalledWith('/api/v1/copilot/query', request)
		expect(result.status).toBe('ready')
		expect(result.answer).toBe('Maintain 165F internal temperature for poultry.')
		expect(result.speechText).toBe(
			'Maintain 165 degrees internal temperature for poultry.',
		)
		expect(result.source).toBe('leader-api')
		expect(result.interventions).toHaveLength(1)
		expect(result.interventions[0]).toMatchObject({
			id: 'usda-safety',
			severity: 'critical',
			title: 'Safe Minimum Temperature',
		})
		expect(result.evidence).toHaveLength(1)
		expect(result.evidence[0]).toMatchObject({
			id: 'graph-chicken',
			label: 'Chicken Breast',
			source: 'recipe-graph',
		})
		expect(result.requestId).toBe('req-123')
	})

	it('orchestrateVoiceCopilot handles service failures gracefully', async () => {
		process.env.NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT = '/api/v1/copilot/query'
		const mockPost = aiApi.post as jest.Mock
		mockPost.mockRejectedValueOnce(
			new Error('Network error (503 Service Unavailable)'),
		)

		const result = await orchestrateVoiceCopilot({
			command: 'Can I swap butter for oil?',
		})

		expect(result.status).toBe('error')
		expect(result.source).toBe('client-error')
		expect(result.answer).toContain('unavailable')
		expect(result.errorMessage).toBe(
			'Network error (503 Service Unavailable)',
		)
	})
})
