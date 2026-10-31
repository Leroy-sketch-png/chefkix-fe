import {
	initEventTracker,
	destroyEventTracker,
	trackSearch,
	trackRecipeSkipped,
	setTrackingOptOut,
} from '@/lib/eventTracker'
import { api } from '@/lib/axios'

jest.mock('@/lib/axios', () => ({
	api: {
		post: jest.fn().mockResolvedValue({ data: { accepted: 1, total: 1 } }),
		delete: jest.fn().mockResolvedValue({ data: {} }),
	},
}))

describe('Event Tracking Lifecycle — SEARCH_REFINED and RECIPE_SKIPPED', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		jest.useFakeTimers()
		setTrackingOptOut(false)
		destroyEventTracker()
		initEventTracker()
	})

	afterEach(() => {
		destroyEventTracker()
		jest.useRealTimers()
	})

	it('emits RECIPE_SEARCH for initial search and SEARCH_REFINED when modified within 60s', async () => {
		trackSearch('pasta', 12)
		jest.advanceTimersByTime(500)

		expect(api.post).not.toHaveBeenCalled() // still in queue until batch flush

		// Advance 10s to flush the first search batch
		jest.advanceTimersByTime(10_000)
		await Promise.resolve()

		expect(api.post).toHaveBeenCalledTimes(1)
		const firstBatch = (api.post as jest.Mock).mock.calls[0][1]
		expect(firstBatch.events).toHaveLength(1)
		expect(firstBatch.events[0]).toMatchObject({
			eventType: 'RECIPE_SEARCH',
			metadata: {
				query: 'pasta',
				resultCount: 12,
			},
		})

		// Refine search to 'pasta carbonara' 5 seconds later (within 60s window)
		jest.advanceTimersByTime(5_000)
		trackSearch('pasta carbonara', 5)
		jest.advanceTimersByTime(500)

		// Advance 10s to flush the second search batch
		jest.advanceTimersByTime(10_000)
		await Promise.resolve()

		expect(api.post).toHaveBeenCalledTimes(2)
		const secondBatch = (api.post as jest.Mock).mock.calls[1][1]
		expect(secondBatch.events).toHaveLength(1)
		expect(secondBatch.events[0]).toMatchObject({
			eventType: 'SEARCH_REFINED',
			metadata: {
				previousQuery: 'pasta',
				refinedQuery: 'pasta carbonara',
				resultCount: 5,
			},
		})
	})

	it('emits RECIPE_SKIPPED with recipeId and metadata on recipe skip', async () => {
		trackRecipeSkipped('recipe-101', {
			source: 'cook_plan_swap',
			replacementRecipeId: 'recipe-202',
		})

		// Advance to trigger periodic batch flush
		jest.advanceTimersByTime(10_000)
		await Promise.resolve()

		expect(api.post).toHaveBeenCalledTimes(1)
		const payload = (api.post as jest.Mock).mock.calls[0][1]
		expect(payload.events).toHaveLength(1)
		expect(payload.events[0]).toMatchObject({
			eventType: 'RECIPE_SKIPPED',
			entityId: 'recipe-101',
			entityType: 'recipe',
			metadata: {
				source: 'cook_plan_swap',
				replacementRecipeId: 'recipe-202',
			},
		})
	})
})
