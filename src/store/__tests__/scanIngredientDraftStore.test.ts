import {
	MAX_SCAN_INGREDIENTS,
	useScanIngredientDraftStore,
} from '@/store/scanIngredientDraftStore'

describe('scanIngredientDraftStore', () => {
	afterEach(() => useScanIngredientDraftStore.getState().clear())

	it('keeps only bounded, validated names and clears state when the owner changes', () => {
		const store = useScanIngredientDraftStore.getState()
		store.setOwnerId('owner-a')
		store.setConfirmedScanIngredients('owner-a', [
			' Tofu  ',
			'tofu',
			'\u0000invalid',
			'x'.repeat(121),
			...Array.from(
				{ length: MAX_SCAN_INGREDIENTS },
				(_, index) => `item-${index}`,
			),
		])

		expect(
			useScanIngredientDraftStore.getState().confirmedScanIngredients,
		).toHaveLength(MAX_SCAN_INGREDIENTS)
		expect(
			useScanIngredientDraftStore.getState().confirmedScanIngredients[0],
		).toBe('Tofu')
		expect(store.addManualIngredient('owner-a', '  garlic   powder  ')).toBe(
			false,
		)

		useScanIngredientDraftStore.getState().setOwnerId('owner-b')
		expect(useScanIngredientDraftStore.getState()).toMatchObject({
			ownerId: 'owner-b',
			confirmedScanIngredients: [],
			manualIngredients: [],
		})
	})

	it('preserves scan and manual provenance separately and clears them together', () => {
		const store = useScanIngredientDraftStore.getState()
		store.setOwnerId('owner-a')
		store.setConfirmedScanIngredients('owner-a', ['Tofu'])
		expect(store.addManualIngredient('owner-a', 'Carrot')).toBe(true)
		expect(useScanIngredientDraftStore.getState()).toMatchObject({
			confirmedScanIngredients: ['Tofu'],
			manualIngredients: ['Carrot'],
		})

		useScanIngredientDraftStore.getState().clearSelection('owner-a')
		expect(useScanIngredientDraftStore.getState()).toMatchObject({
			confirmedScanIngredients: [],
			manualIngredients: [],
		})
	})
})
