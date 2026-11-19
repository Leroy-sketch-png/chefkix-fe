import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import { ScanIngredientWorkspace } from '@/components/scan/ScanIngredientWorkspace'
import { findRecipesFromIngredients } from '@/services/photo-intelligence'
import { useScanIngredientDraftStore } from '@/store/scanIngredientDraftStore'

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
	beforeEach(() => {
		jest.clearAllMocks()
		useScanIngredientDraftStore.getState().clear()
		useScanIngredientDraftStore.getState().setOwnerId(null)
	})

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
		const showMatchesLink = screen.getByRole('link', {
			name: 'scanSearchRecipesWithIngredients',
		})
		expect(showMatchesLink).toHaveAttribute('href', '#ingredient-match-results')
		expect(
			document.getElementById('ingredient-match-results'),
		).toBeInTheDocument()
		fireEvent.click(showMatchesLink)
		expect(
			screen.getByRole('heading', { name: 'scanIngredientIntelligenceTitle' }),
		).toBeInTheDocument()

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
		const confirmedScanList = screen.getByRole('list', {
			name: 'scanConfirmedIngredientList',
		})
		expect(within(confirmedScanList).getByText('Tofu')).toBeInTheDocument()
		expect(within(confirmedScanList).getByText('Carrot')).toBeInTheDocument()

		fireEvent.click(
			within(
				screen.getByRole('list', { name: 'scanManualIngredientList' }),
			).getByRole('button', { name: 'scanRemoveIngredient' }),
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

	it('restores only confirmed selections across detail-style unmounts and honors remove/clear', async () => {
		const firstVisit = render(<ScanIngredientWorkspace />)
		fireEvent.click(
			screen.getByRole('button', { name: 'Use confirmed scan ingredients' }),
		)
		const input = screen.getByLabelText('scanManualIngredientLabel')
		fireEvent.change(input, { target: { value: 'Garlic' } })
		fireEvent.click(screen.getByRole('button', { name: 'scanAddIngredient' }))
		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenLastCalledWith(
				['Tofu', 'Carrot', 'Garlic'],
				expect.any(AbortSignal),
			),
		)
		firstVisit.unmount()

		jest.clearAllMocks()
		const restored = render(<ScanIngredientWorkspace />)
		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenCalledWith(
				['Tofu', 'Carrot', 'Garlic'],
				expect.any(AbortSignal),
			),
		)
		const restoredScanList = screen.getByRole('list', {
			name: 'scanConfirmedIngredientList',
		})
		expect(within(restoredScanList).getByText('Tofu')).toBeInTheDocument()
		expect(within(restoredScanList).getByText('Carrot')).toBeInTheDocument()
		expect(
			screen.getByRole('list', { name: 'scanManualIngredientList' }),
		).toHaveTextContent('Garlic')

		fireEvent.click(
			within(
				screen.getByRole('list', { name: 'scanManualIngredientList' }),
			).getByRole('button', { name: 'scanRemoveIngredient' }),
		)
		fireEvent.click(
			within(
				within(
					screen.getByRole('list', {
						name: 'scanConfirmedIngredientList',
					}),
				)
					.getByText('Tofu')
					.closest('li')!,
			).getByRole('button', { name: 'scanRemoveIngredient' }),
		)
		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenLastCalledWith(
				['Carrot'],
				expect.any(AbortSignal),
			),
		)

		restored.unmount()
		const revisit = render(<ScanIngredientWorkspace />)
		await waitFor(() =>
			expect(findRecipesFromIngredients).toHaveBeenLastCalledWith(
				['Carrot'],
				expect.any(AbortSignal),
			),
		)
		fireEvent.click(
			screen.getByRole('button', { name: 'scanClearIngredients' }),
		)
		expect(
			screen.queryByRole('list', { name: 'scanConfirmedIngredientList' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('list', { name: 'scanManualIngredientList' }),
		).not.toBeInTheDocument()
		expect(findRecipesFromIngredients).toHaveBeenLastCalledWith(
			['Carrot'],
			expect.any(AbortSignal),
		)
		revisit.unmount()
		render(<ScanIngredientWorkspace />)
		expect(
			screen.queryByRole('heading', {
				name: 'scanIngredientIntelligenceTitle',
			}),
		).not.toBeInTheDocument()
	})

	it('retains a maximum-length unbroken manual ingredient and its remove action', async () => {
		const ingredient = 'x'.repeat(120)
		render(<ScanIngredientWorkspace />)
		const input = screen.getByLabelText('scanManualIngredientLabel')

		expect(input).toHaveAttribute('maxLength', '120')
		fireEvent.change(input, { target: { value: ingredient } })
		fireEvent.click(screen.getByRole('button', { name: 'scanAddIngredient' }))

		const list = screen.getByRole('list', { name: 'scanManualIngredientList' })
		expect(within(list).getByText(ingredient)).toBeInTheDocument()
		fireEvent.click(
			screen.getByRole('button', {
				name: `scanRemoveIngredient`.replace('{ingredient}', ingredient),
			}),
		)
		await waitFor(() =>
			expect(screen.queryByText(ingredient)).not.toBeInTheDocument(),
		)
	})
})
