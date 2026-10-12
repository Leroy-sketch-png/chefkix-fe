import type { ShoppingListResponse } from '@/lib/types/shoppingList'
import {
	resolveStableShoppingListShare,
	shoppingListShareUrl,
} from '@/lib/shopping-list-sharing'

function list(shareToken: string | null): ShoppingListResponse {
	return {
		id: 'list-1',
		name: 'Friday groceries',
		items: [],
		source: 'Custom',
		sourceMealPlanId: null,
		sourceRecipeId: null,
		shareToken,
		totalItems: 0,
		checkedItems: 0,
		createdAt: '2026-09-19T00:00:00.000Z',
		updatedAt: '2026-09-19T00:00:00.000Z',
	}
}

describe('shopping-list sharing', () => {
	it('reuses an existing token without rotating the link', async () => {
		const existing = list('stable-token')
		const provision = jest.fn()

		await expect(
			resolveStableShoppingListShare(existing, provision),
		).resolves.toBe(existing)
		expect(provision).not.toHaveBeenCalled()
	})

	it('provisions one token for a legacy list that has none', async () => {
		const provisioned = list('first-token')
		const provision = jest.fn().mockResolvedValue(provisioned)

		await expect(
			resolveStableShoppingListShare(list(null), provision),
		).resolves.toBe(provisioned)
		expect(provision).toHaveBeenCalledTimes(1)
		expect(provision).toHaveBeenCalledWith('list-1')
	})

	it('builds the public URL from the resolved token', () => {
		expect(shoppingListShareUrl('https://chefkix.test', 'stable-token')).toBe(
			'https://chefkix.test/shopping-lists/shared/stable-token',
		)
	})
})
