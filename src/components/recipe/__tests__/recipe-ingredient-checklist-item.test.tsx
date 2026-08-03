import { fireEvent, render, screen } from '@testing-library/react'
import { RecipeIngredientChecklistItem } from '../RecipeIngredientChecklistItem'
import { RecipeStepCompletionControl } from '../RecipeStepCompletionControl'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string, values?: { name?: string }) =>
		values?.name ? `${key}: ${values.name}` : key,
}))

jest.mock('../SubstitutionButton', () => ({
	SubstitutionButton: () => <button type='button'>Find substitute</button>,
}))

describe('RecipeIngredientChecklistItem', () => {
	const ingredient = {
		quantity: '1',
		unit: 'tbsp',
		name: 'sesame oil',
	}

	it('exposes one named native checkbox and toggles once from its label', () => {
		const onToggle = jest.fn()

		render(
			<RecipeIngredientChecklistItem
				ingredient={ingredient}
				isChecked={false}
				onToggle={onToggle}
				recipeTitle='Noodle bowl'
				onBuy={jest.fn()}
			/>,
		)

		const checkbox = screen.getByRole('checkbox', {
			name: '1 tbsp sesame oil',
		})
		expect((checkbox as HTMLInputElement).checked).toBe(false)

		fireEvent.click(screen.getByText('sesame oil'))
		expect(onToggle).toHaveBeenCalledTimes(1)
	})

	it('keeps buy and substitution commands outside checklist state', () => {
		const onToggle = jest.fn()
		const onBuy = jest.fn()

		render(
			<RecipeIngredientChecklistItem
				ingredient={ingredient}
				isChecked
				onToggle={onToggle}
				buyLink='https://shop.example.test/sesame-oil'
				recipeTitle='Noodle bowl'
				onBuy={onBuy}
			/>,
		)

		expect(
			(
				screen.getByRole('checkbox', {
					name: '1 tbsp sesame oil',
				}) as HTMLInputElement
			).checked,
		).toBe(true)

		fireEvent.click(
			screen.getByRole('link', { name: 'buyIngredient: sesame oil' }),
		)
		fireEvent.click(screen.getByRole('button', { name: 'Find substitute' }))

		expect(onBuy).toHaveBeenCalledTimes(1)
		expect(onToggle).not.toHaveBeenCalled()
	})
})

describe('RecipeStepCompletionControl', () => {
	it('exposes step completion as one named native checkbox', () => {
		const onToggle = jest.fn()

		render(
			<RecipeStepCompletionControl
				step={{
					stepNumber: 2,
					title: 'Toast the spices',
					description: 'Stir until fragrant.',
					timerSeconds: 120,
				}}
				stepIndex={1}
				isCompleted={false}
				onToggle={onToggle}
			/>,
		)

		const checkbox = screen.getByRole('checkbox', {
			name: 'Toast the spices: done',
		})
		expect((checkbox as HTMLInputElement).checked).toBe(false)
		expect(screen.getByText('2 minTimer')).toBeTruthy()

		fireEvent.click(screen.getByText('Toast the spices'))
		expect(onToggle).toHaveBeenCalledTimes(1)
	})
})
