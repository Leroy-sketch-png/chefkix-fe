jest.mock('@/services/cookplan', () => ({
	getCurrentCookPlan: jest.fn(),
}))

jest.mock('@/services/shoppingList', () => ({
	createFromCookPlan: jest.fn(),
}))

import { getCurrentCookPlan } from '@/services/cookplan'
import { createFromCookPlan } from '@/services/shoppingList'
import { createShoppingListFromCurrentCookPlan } from '@/lib/current-cook-plan-shopping-list'

const getCurrentCookPlanMock = jest.mocked(getCurrentCookPlan)
const createFromCookPlanMock = jest.mocked(createFromCookPlan)

describe('createShoppingListFromCurrentCookPlan', () => {
	beforeEach(() => jest.clearAllMocks())

	it('returns null and does not create a list when no plan exists', async () => {
		getCurrentCookPlanMock.mockResolvedValue(null)

		await expect(
			createShoppingListFromCurrentCookPlan('2026-10-14'),
		).resolves.toBeNull()
		expect(getCurrentCookPlanMock).toHaveBeenCalledWith('2026-10-14')
		expect(createFromCookPlanMock).not.toHaveBeenCalled()
	})

	it('does not create a list for a plan without a persisted ID', async () => {
		getCurrentCookPlanMock.mockResolvedValue({
			id: null,
			planDate: '2026-10-14',
			mode: 'COOK_ONCE_TODAY',
			householdSize: 2,
			maxActiveMinutes: 60,
			pantryFirst: true,
			cookBatches: [],
			eatingOccasions: [],
			shoppingList: [],
			unmetConstraints: [],
		})

		await expect(
			createShoppingListFromCurrentCookPlan('2026-10-14'),
		).resolves.toBeNull()
		expect(createFromCookPlanMock).not.toHaveBeenCalled()
	})

	it('uses the persisted current plan ID to create its shopping list', async () => {
		getCurrentCookPlanMock.mockResolvedValue({
			id: 'cook-plan-42',
			planDate: '2026-10-14',
			mode: 'COOK_ONCE_TODAY',
			householdSize: 3,
			maxActiveMinutes: 60,
			pantryFirst: true,
			cookBatches: [],
			eatingOccasions: [],
			shoppingList: [],
			unmetConstraints: [],
		})
		createFromCookPlanMock.mockResolvedValue(
			{} as Awaited<ReturnType<typeof createFromCookPlan>>,
		)

		await createShoppingListFromCurrentCookPlan('2026-10-14')

		expect(createFromCookPlanMock).toHaveBeenCalledWith({
			cookPlanId: 'cook-plan-42',
		})
	})

	it('does not hide current-plan lookup failures', async () => {
		getCurrentCookPlanMock.mockRejectedValue(new Error('network unavailable'))

		await expect(
			createShoppingListFromCurrentCookPlan('2026-10-14'),
		).rejects.toThrow('network unavailable')
		expect(createFromCookPlanMock).not.toHaveBeenCalled()
	})
})
