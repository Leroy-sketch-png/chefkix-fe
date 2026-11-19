import { aiApi } from '@/lib/axios'
import { processRecipe } from '../ai'
import { handleDirectAiError } from '../directAiClient'

jest.mock('@/lib/axios', () => ({ aiApi: { post: jest.fn() } }))
jest.mock('../directAiClient', () => ({
	getDirectAiPreflightFailure: jest.fn(() => null),
	handleDirectAiError: jest.fn(() => ({
		success: false,
		message: 'request failed',
	})),
}))

describe('processRecipe cancellation', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('forwards the abort signal and preserves cancellation for the caller', async () => {
		const controller = new AbortController()
		const post = aiApi.post as jest.Mock
		post.mockImplementation(
			(_url, _payload, config) =>
				new Promise((_resolve, reject) => {
					config.signal.addEventListener('abort', () =>
						reject(new Error('request aborted')),
					)
				}),
		)

		const request = processRecipe('Recipe text', controller.signal)
		controller.abort()

		await expect(request).rejects.toThrow('request aborted')
		expect(post).toHaveBeenCalledWith(
			expect.any(String),
			{ raw_text: 'Recipe text' },
			{ signal: controller.signal },
		)
		expect(handleDirectAiError).not.toHaveBeenCalled()
	})
})
