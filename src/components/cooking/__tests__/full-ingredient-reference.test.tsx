import fs from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { FullIngredientListDialog } from '@/components/cooking/FullIngredientListDialog'

jest.mock('next-intl', () => ({
	useTranslations:
		() => (key: string, values?: Record<string, string | number>) => {
			if (key === 'allIngredients') return 'All ingredients'
			if (key === 'allIngredientsFor') {
				return `${values?.count} ingredients for ${values?.recipe}`
			}
			if (key === 'quantityAsNeeded') return 'As needed'
			return key
		},
}))

const playerSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/cooking/CookingPlayer.tsx'),
	'utf8',
)

describe('full cooking ingredient reference', () => {
	it('renders every ingredient with normalized amount text', () => {
		render(
			<FullIngredientListDialog
				open
				onOpenChange={jest.fn()}
				recipeTitle='Weeknight Pho'
				ingredients={[
					{ name: 'rice noodles', quantity: '200', unit: 'g' },
					{ name: 'lime', quantity: '', unit: '' },
					{ name: 'fish sauce', quantity: '2', unit: 'tbsp' },
				]}
			/>,
		)

		expect(
			screen.getByRole('heading', { name: 'All ingredients' }),
		).toBeTruthy()
		expect(screen.getByText('3 ingredients for Weeknight Pho')).toBeTruthy()
		expect(screen.getByText('200 g')).toBeTruthy()
		expect(screen.getByText('As needed')).toBeTruthy()
		expect(screen.getByText('2 tbsp')).toBeTruthy()
		for (const name of ['rice noodles', 'lime', 'fish sauce']) {
			expect(screen.getByText(name)).toBeTruthy()
		}
	})

	it('returns close intent to the player owner', () => {
		const onOpenChange = jest.fn()
		render(
			<FullIngredientListDialog
				open
				onOpenChange={onOpenChange}
				recipeTitle='Rice'
				ingredients={[{ name: 'rice', quantity: '1', unit: 'cup' }]}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'Close' }))
		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('contains long recipes inside the dialog viewport', () => {
		const ingredients = Array.from({ length: 24 }, (_, index) => ({
			name: `ingredient ${index + 1}`,
			quantity: String(index + 1),
			unit: 'g',
		}))
		render(
			<FullIngredientListDialog
				open
				onOpenChange={jest.fn()}
				recipeTitle='Big Batch'
				ingredients={ingredients}
			/>,
		)

		expect(screen.getByText('ingredient 24')).toBeTruthy()
		expect(document.querySelector('.overflow-y-auto')).toBeTruthy()
		expect(screen.getByRole('dialog').className).toContain('max-h-')
	})

	it('keeps the complete list reachable without prep truncation', () => {
		expect(playerSource).toContain('hasFullIngredients &&')
		expect(playerSource).toContain('setShowIngredientList(true)')
		expect(playerSource).toContain('<FullIngredientListDialog')
		expect(playerSource).toContain('if (showIngredientList) return')
		expect(playerSource).not.toContain('.slice(0, 8)')
		expect(playerSource).not.toContain("t('moreIngredients'")
		expect(playerSource).toContain('.filter(Boolean)')
	})
})
