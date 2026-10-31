import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import MealPlannerPage from '../page'
import { createCookPlan, getCurrentCookPlan } from '@/services/cookplan'
import { getAllSettings } from '@/services/settings'
import { createFromCookPlan } from '@/services/shoppingList'
import type { CookPlan } from '@/lib/types/cookplan'

jest.mock('@/services/cookplan', () => ({
	createCookPlan: jest.fn(),
	getCurrentCookPlan: jest.fn(),
	swapCookPlanDish: jest.fn(),
}))

jest.mock('@/services/settings', () => ({ getAllSettings: jest.fn() }))

jest.mock('@/services/shoppingList', () => ({ createFromCookPlan: jest.fn() }))

jest.mock('@/components/layout/PageContainer', () => ({
	PageContainer: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}))

jest.mock('@/components/layout/PageTransition', () => ({
	PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const mockTranslate = (key: string) =>
	({
		failedLoad: 'Could not load meal plan',
		failedLoadDesc: 'Check your connection and try again.',
		retryLoad: 'Try again',
		oneBatchNotTwentyOneMeals: 'Plan a cooking batch',
		emptyTodayDesc: 'Build a practical batch.',
		saveShoppingList: 'Save to shopping lists',
		savingShoppingList: 'Saving shopping list',
		shoppingListSaved: 'Shopping list saved',
		failedSaveShoppingList: 'Could not save shopping list',
		openShoppingList: 'Open shopping lists',
		activeMinutesSummary: '45 of 60 hands-on minutes',
		longestRecipeSummary: 'Longest recipe: 14h 30m',
		totalTime: 'Total time',
	})[key] ?? key

jest.mock('next-intl', () => ({
	useTranslations: () => mockTranslate,
}))

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }))

const mockedGetCurrentCookPlan = jest.mocked(getCurrentCookPlan)
const mockedCreateCookPlan = jest.mocked(createCookPlan)
const mockedGetAllSettings = jest.mocked(getAllSettings)
const mockedCreateFromCookPlan = jest.mocked(createFromCookPlan)
const planWithDuplicateIngredients: CookPlan = {
	id: 'plan-1',
	planDate: '2026-09-19',
	mode: 'COOK_ONCE_TODAY',
	householdSize: 2,
	maxActiveMinutes: 60,
	pantryFirst: true,
	cookBatches: [
		{
			id: 'batch-1',
			title: 'Family batch',
			activeMinutes: 45,
			totalMinutes: 60,
			dishes: [
				{
					recipeId: 'brisket',
					title: 'Texas Brisket',
					coverImageUrl: null,
					cuisineType: 'American',
					mealRole: 'MAIN',
					activeMinutes: 40,
					totalTimeMinutes: 870,
					sourceServings: 12,
					plannedServings: 4,
					pantryIngredientCount: 1,
					shoppingIngredientCount: 3,
				},
				{
					recipeId: 'banana-bread',
					title: 'Banana Bread',
					coverImageUrl: null,
					cuisineType: 'American',
					mealRole: 'DESSERT',
					activeMinutes: 5,
					totalTimeMinutes: 70,
					sourceServings: 8,
					plannedServings: 4,
					pantryIngredientCount: 0,
					shoppingIngredientCount: 6,
				},
			],
		},
	],
	eatingOccasions: [],
	shoppingList: [
		{
			ingredient: 'Rice',
			quantity: '500',
			unit: 'g',
			sourceRecipes: ['Rice bowl'],
		},
		{
			ingredient: 'Rice',
			quantity: '2',
			unit: 'cups',
			sourceRecipes: ['Soup'],
		},
	],
	unmetConstraints: [],
}

describe('meal planner load truth', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockedGetAllSettings.mockResolvedValue({ success: false } as Awaited<
			ReturnType<typeof getAllSettings>
		>)
	})

	it('shows elapsed recipe time separately from the hands-on budget', async () => {
		mockedGetCurrentCookPlan.mockResolvedValue(planWithDuplicateIngredients)
		render(<MealPlannerPage />)

		expect(await screen.findByText('Family batch')).not.toBeNull()
		expect(screen.getByText('45 of 60 hands-on minutes')).not.toBeNull()
		expect(screen.getByText('Longest recipe: 14h 30m')).not.toBeNull()
		expect(screen.getAllByText('Total time')).toHaveLength(2)
		expect(screen.getByText('14h 30m')).not.toBeNull()
	})

	it('shows a retryable failure instead of the legitimate empty state', async () => {
		mockedGetCurrentCookPlan.mockRejectedValueOnce(new Error('offline'))
		render(<MealPlannerPage />)

		expect((await screen.findByRole('alert')).textContent).toContain(
			'Could not load meal plan',
		)
		expect(screen.queryByText('Plan a cooking batch')).toBeNull()
	})

	it('clears the failure after a successful retry with no current plan', async () => {
		mockedGetCurrentCookPlan
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(null)
		render(<MealPlannerPage />)

		fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
		await waitFor(() => {
			expect(screen.queryByRole('alert')).toBeNull()
		})
		expect(await screen.findByText('Plan a cooking batch')).not.toBeNull()
	})

	it('checks same-name shopping additions independently by unit', async () => {
		mockedGetCurrentCookPlan.mockResolvedValue(planWithDuplicateIngredients)
		render(<MealPlannerPage />)

		const checkboxes = await screen.findAllByRole('checkbox', {
			name: 'toggleShoppingItem',
		})
		expect(checkboxes).toHaveLength(2)
		fireEvent.click(checkboxes[0])
		expect(checkboxes[0].getAttribute('aria-checked')).toBe('true')
		expect(checkboxes[1].getAttribute('aria-checked')).toBe('false')
	})

	it('clamps a saved active-time preference to the visible control range', async () => {
		mockedGetCurrentCookPlan.mockResolvedValue(null)
		mockedGetAllSettings.mockResolvedValue({
			success: true,
			data: { cooking: { defaultServings: 2, maxCookingTimeMinutes: 240 } },
		} as Awaited<ReturnType<typeof getAllSettings>>)
		render(<MealPlannerPage />)

		const slider = (await screen.findByRole('slider')) as HTMLInputElement
		expect(slider.max).toBe('180')
		expect(slider.value).toBe('180')
	})

	it('still renders a current plan when optional settings fail', async () => {
		mockedGetCurrentCookPlan.mockResolvedValue(planWithDuplicateIngredients)
		mockedGetAllSettings.mockRejectedValue(new Error('settings unavailable'))
		render(<MealPlannerPage />)

		expect(await screen.findByText('Family batch')).not.toBeNull()
		expect(screen.queryByRole('alert')).toBeNull()
	})

	it('persists the current plan once and exposes the durable list destination', async () => {
		mockedGetCurrentCookPlan.mockResolvedValue(planWithDuplicateIngredients)
		mockedCreateFromCookPlan.mockResolvedValue({ id: 'list-1' } as Awaited<
			ReturnType<typeof createFromCookPlan>
		>)
		render(<MealPlannerPage />)

		fireEvent.click(
			await screen.findByRole('button', { name: 'Save to shopping lists' }),
		)
		expect(
			await screen.findByRole('link', { name: 'Open shopping lists' }),
		).not.toBeNull()
		expect(mockedCreateFromCookPlan).toHaveBeenCalledTimes(1)
		expect(mockedCreateFromCookPlan).toHaveBeenCalledWith({
			cookPlanId: 'plan-1',
		})
	})

	it('returns the save command after persistence fails', async () => {
		mockedGetCurrentCookPlan.mockResolvedValue(planWithDuplicateIngredients)
		mockedCreateFromCookPlan.mockRejectedValue(new Error('offline'))
		render(<MealPlannerPage />)

		fireEvent.click(
			await screen.findByRole('button', { name: 'Save to shopping lists' }),
		)
		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: 'Save to shopping lists' }),
			).not.toBeNull()
		})
		expect(
			screen.queryByRole('link', { name: 'Open shopping lists' }),
		).toBeNull()
	})

	it('coalesces rapid save activation while persistence is unresolved', async () => {
		mockedGetCurrentCookPlan.mockResolvedValue(planWithDuplicateIngredients)
		let resolveSave: (
			value: Awaited<ReturnType<typeof createFromCookPlan>>,
		) => void
		mockedCreateFromCookPlan.mockReturnValue(
			new Promise(resolve => {
				resolveSave = resolve
			}),
		)
		render(<MealPlannerPage />)

		const save = await screen.findByRole('button', {
			name: 'Save to shopping lists',
		})
		fireEvent.click(save)
		fireEvent.click(save)
		expect(mockedCreateFromCookPlan).toHaveBeenCalledTimes(1)

		resolveSave!({ id: 'list-1' } as Awaited<
			ReturnType<typeof createFromCookPlan>
		>)
		expect(
			await screen.findByRole('link', { name: 'Open shopping lists' }),
		).not.toBeNull()
	})

	it('preserves checked progress and the saved destination when rebuild fails', async () => {
		mockedGetCurrentCookPlan.mockResolvedValue(planWithDuplicateIngredients)
		mockedCreateFromCookPlan.mockResolvedValue({ id: 'list-1' } as Awaited<
			ReturnType<typeof createFromCookPlan>
		>)
		mockedCreateCookPlan.mockRejectedValue(new Error('offline'))
		render(<MealPlannerPage />)

		const checkboxes = await screen.findAllByRole('checkbox', {
			name: 'toggleShoppingItem',
		})
		fireEvent.click(checkboxes[0])
		fireEvent.click(
			screen.getByRole('button', { name: 'Save to shopping lists' }),
		)
		await screen.findByRole('link', { name: 'Open shopping lists' })

		fireEvent.click(screen.getByRole('button', { name: 'rebuildToday' }))
		await waitFor(() => {
			expect(mockedCreateCookPlan).toHaveBeenCalledTimes(1)
			expect(
				screen.getByRole('button', { name: 'rebuildToday' }),
			).not.toBeNull()
		})
		expect(checkboxes[0].getAttribute('aria-checked')).toBe('true')
		expect(
			screen.getByRole('link', { name: 'Open shopping lists' }),
		).not.toBeNull()
	})
})
