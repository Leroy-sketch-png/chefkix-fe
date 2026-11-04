import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { PantryIngredientBreakdown } from '@/components/pantry/PantryIngredientBreakdown'

jest.mock('next-intl', () => ({
	useTranslations:
		() => (key: string, values?: Record<string, string | number>) => {
			if (key === 'ingredientCoverage')
				return `${values?.matched} of ${values?.total} ingredients in your pantry`
			if (key === 'allIngredientsInPantry')
				return `All ${values?.count} ingredients in your pantry`
			if (key === 'showMissingIngredients')
				return `See ${values?.count} missing ingredients`
			if (key === 'missingIngredientsLabel') return 'Missing ingredients'
			return key
		},
}))

describe('PantryIngredientBreakdown', () => {
	it('shows coverage and reveals the exact missing ingredients on demand', () => {
		render(
			<PantryIngredientBreakdown
				matchedIngredients={['rice', 'chicken', 'ginger']}
				missingIngredients={['lime', 'cilantro']}
			/>,
		)

		expect(
			screen.getByText('3 of 5 ingredients in your pantry').textContent,
		).toBe('3 of 5 ingredients in your pantry')
		const disclosure = screen.getByText('See 2 missing ingredients')
		const details = disclosure.closest('details')
		const missingList = screen.getByText(/lime, cilantro/)
		expect(details?.open).toBe(false)
		expect(missingList.textContent).toBe('Missing ingredients: lime, cilantro')

		fireEvent.click(disclosure)

		expect(details?.open).toBe(true)
		expect(missingList.textContent).toBe('Missing ingredients: lime, cilantro')
	})

	it('states when every recipe ingredient is already in the pantry', () => {
		render(
			<PantryIngredientBreakdown
				matchedIngredients={['rice', 'chicken']}
				missingIngredients={[]}
			/>,
		)

		expect(
			screen.getByText('All 2 ingredients in your pantry').textContent,
		).toBe('All 2 ingredients in your pantry')
		expect(screen.queryByText(/See .* missing ingredients/)).toBeNull()
	})
})
