import {
	hasAppLocalBackDestination,
	navigateBackOrFallback,
} from '@/lib/safe-navigation'

describe('safe navigation', () => {
	it('allows back navigation only when the history destination is app-local', () => {
		expect(
			hasAppLocalBackDestination({
				historyLength: 2,
				referrer: 'https://chefkix.test/feed',
				origin: 'https://chefkix.test',
			}),
		).toBe(true)
	})

	it.each([
		['single-entry history', 1, 'https://chefkix.test/feed'],
		['missing referrer', 2, ''],
		['external referrer', 2, 'https://example.com/article'],
		['malformed referrer', 2, 'not a URL'],
	])('rejects %s', (_label, historyLength, referrer) => {
		expect(
			hasAppLocalBackDestination({
				historyLength,
				referrer,
				origin: 'https://chefkix.test',
			}),
		).toBe(false)
	})

	it('uses browser history for an app-local destination', () => {
		const router = { back: jest.fn(), push: jest.fn() }

		navigateBackOrFallback(router, '/feed', {
			historyLength: 3,
			referrer: 'https://chefkix.test/explore',
			origin: 'https://chefkix.test',
		})

		expect(router.back).toHaveBeenCalledTimes(1)
		expect(router.push).not.toHaveBeenCalled()
	})

	it('uses the product fallback when history is not app-local', () => {
		const router = { back: jest.fn(), push: jest.fn() }

		navigateBackOrFallback(router, '/feed', {
			historyLength: 3,
			referrer: 'https://example.com/shared-post',
			origin: 'https://chefkix.test',
		})

		expect(router.back).not.toHaveBeenCalled()
		expect(router.push).toHaveBeenCalledWith('/feed')
	})
})
