import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AsyncComboboxOption } from '@/components/ui/async-combobox'
import { CookPlanDishSwapDialog } from '@/components/meal-planner/CookPlanDishSwapDialog'
import type { CookPlanDish } from '@/lib/types/cookplan'
import { autocompleteSearch } from '@/services/search'

jest.mock('next-intl', () => ({
	useTranslations:
		() => (key: string, values?: Record<string, string | number>) =>
			values?.title ? `${key}:${values.title}` : key,
}))

jest.mock('@/services/search', () => ({
	autocompleteSearch: jest.fn(),
}))

jest.mock('@/components/ui/async-combobox', () => ({
	AsyncCombobox: ({
		fetchOptions,
		onSelect,
		disabled,
	}: {
		fetchOptions: (query: string) => Promise<AsyncComboboxOption[]>
		onSelect: (option: AsyncComboboxOption) => void
		disabled?: boolean
	}) => (
		<button
			type='button'
			disabled={disabled}
			onClick={async () => {
				const options = await fetchOptions('pho')
				if (options[0]) onSelect(options[0])
			}}
		>
			search-recipes
		</button>
	),
}))

const currentDish: CookPlanDish = {
	recipeId: 'recipe-current',
	title: 'Current Pho',
	coverImageUrl: '/current.webp',
	cuisineType: 'Vietnamese',
	mealRole: 'MAIN',
	activeMinutes: 20,
	totalTimeMinutes: 45,
	sourceServings: 2,
	plannedServings: 4,
	pantryIngredientCount: 3,
	shoppingIngredientCount: 2,
}

const searchDocument = (id: string, title: string) => ({
	id,
	title,
	description: '',
	cuisine: 'Vietnamese',
	difficulty: 'EASY',
	totalTime: 30,
	cookCount: 0,
	avgRating: 0,
	ingredients: [],
	tags: [],
	authorId: 'author',
	coverImageUrl: '',
	createdAt: 1,
	xpReward: 50,
})

describe('CookPlanDishSwapDialog', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		jest.mocked(autocompleteSearch).mockResolvedValue({
			success: true,
			statusCode: 200,
			data: {
				recipes: {
					found: 2,
					hits: [
						{ document: searchDocument('recipe-current', 'Current Pho') },
						{ document: searchDocument('recipe-new', 'Weeknight Pho') },
					],
				},
			},
		})
	})

	it('excludes planned dishes and waits for explicit confirmation', async () => {
		const onSwap = jest.fn().mockResolvedValue(undefined)
		render(
			<CookPlanDishSwapDialog
				dish={currentDish}
				excludedRecipeIds={['recipe-current', 'recipe-side']}
				onSwap={onSwap}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'replaceDish' }))
		fireEvent.click(screen.getByRole('button', { name: 'search-recipes' }))

		expect(await screen.findByText('Weeknight Pho')).toBeTruthy()
		expect(screen.queryByText('Current Pho')).toBeNull()
		expect(onSwap).not.toHaveBeenCalled()

		fireEvent.click(screen.getByRole('button', { name: 'confirmReplacement' }))

		await waitFor(() => expect(onSwap).toHaveBeenCalledWith('recipe-new'))
		await waitFor(() => expect(screen.queryByText('Weeknight Pho')).toBeNull())
	})

	it('keeps a rejected replacement recoverable and blocks duplicate submission', async () => {
		let rejectSwap: ((reason: unknown) => void) | undefined
		const onSwap = jest.fn(
			() =>
				new Promise<void>((_resolve, reject) => {
					rejectSwap = reject
				}),
		)

		render(
			<CookPlanDishSwapDialog
				dish={currentDish}
				excludedRecipeIds={['recipe-current']}
				onSwap={onSwap}
			/>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'replaceDish' }))
		fireEvent.click(screen.getByRole('button', { name: 'search-recipes' }))
		await screen.findByText('Weeknight Pho')

		const confirm = screen.getByRole('button', { name: 'confirmReplacement' })
		fireEvent.click(confirm)
		fireEvent.click(confirm)
		expect(onSwap).toHaveBeenCalledTimes(1)

		rejectSwap?.({
			response: {
				status: 409,
				data: { message: 'That recipe exceeds your hands-on budget.' },
			},
		})

		expect((await screen.findByRole('alert')).textContent).toContain(
			'That recipe exceeds your hands-on budget.',
		)
		expect(screen.getByText('Weeknight Pho')).toBeTruthy()
		expect(
			(
				screen.getByRole('button', {
					name: 'confirmReplacement',
				}) as HTMLButtonElement
			).disabled,
		).toBe(false)
	})
})
