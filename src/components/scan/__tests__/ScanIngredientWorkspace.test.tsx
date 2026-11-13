import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ScanIngredientWorkspace } from '@/components/scan/ScanIngredientWorkspace'
import { findRecipesFromIngredients } from '@/services/photo-intelligence'

jest.mock('next-intl', () => {
	const translate = (key: string, values?: Record<string, string>) =>
		values ? key.replace('{ingredient}', values.ingredient ?? '') : key
	return { useTranslations: () => translate }
})

jest.mock('@/services/photo-intelligence', () => ({
	findRecipesFromIngredients: jest.fn().mockResolvedValue({
		matches: [],
		queryIngredients: [],
		source: 'backend',
	}),
}))

jest.mock('@/components/scan/IngredientScanner', () => {
	const React = require('react')
	return {
		IngredientScanner: ({
			onConfirmedIngredientsChange,
		}: {
			onConfirmedIngredientsChange: (ingredients: string[]) => void
		}) =>
			React.createElement(
				'button',
				{
					type: 'button',
					onClick: () =>
						onConfirmedIngredientsChange(['Tofu', 'Carrot', 'tofu']),
				},
				'Use confirmed scan ingredients',
			),
	}
})

describe('ScanIngredientWorkspace', () => {
	beforeEach(() => jest.clearAllMocks())

	it('sends manual and confirmed scan ingredients to real recipe matching without duplicates', async () => {
		render(<ScanIngredientWorkspace />)
		const input = screen.getByLabelText('scanManualIngredientLabel')

		fireEvent.change(input, { target: { value: 'tofu' } })
		fireEvent.click(screen.getByRole('button', { name: 'scanAddIngredient' }))
		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenLastCalledWith(
				['tofu'],
				expect.any(AbortSignal),
			),
		)
		await screen.findByText('scanYouHaveIngredientsFor')
		expect(
			screen.getByRole('link', {
				name: 'scanSearchRecipesWithIngredients',
			}),
		).toHaveAttribute('href', '/search?q=tofu')

		fireEvent.click(
			screen.getByRole('button', { name: 'Use confirmed scan ingredients' }),
		)
		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenLastCalledWith(
				['Tofu', 'Carrot'],
				expect.any(AbortSignal),
			),
		)
		await screen.findByText('scanYouHaveIngredientsFor')
		expect(screen.getByText('Tofu')).toBeInTheDocument()
		expect(screen.getByText('Carrot')).toBeInTheDocument()

		fireEvent.click(
			screen.getByRole('button', { name: 'scanRemoveIngredient' }),
		)
		expect(
			screen.queryByRole('list', { name: 'scanManualIngredientList' }),
		).not.toBeInTheDocument()
		expect(findRecipesFromIngredients).toHaveBeenLastCalledWith(
			['Tofu', 'Carrot'],
			expect.any(AbortSignal),
		)
		await screen.findByText('scanYouHaveIngredientsFor')
	})
})
