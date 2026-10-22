import fs from 'node:fs'
import path from 'node:path'

import {
	clampActiveMinutes,
	cookPlanCookingPath,
	cookPlanShoppingItemKey,
	MAX_ACTIVE_MINUTES,
	MIN_ACTIVE_MINUTES,
	reconcileCheckedShoppingItems,
} from '@/lib/cook-plan-ui'

describe('cook plan UI invariants', () => {
	it('builds an encoded recipe destination that enters guided cooking', () => {
		expect(cookPlanCookingPath('recipe/with spaces')).toBe(
			'/recipes/recipe%2Fwith%20spaces?cook=true',
		)
	})

	it('keeps dish inspection passive and wires the explicit command to cooking', () => {
		const page = fs.readFileSync(
			path.join(process.cwd(), 'src/app/(main)/meal-planner/page.tsx'),
			'utf8',
		)

		expect(page.split('href={`/recipes/${dish.recipeId}`}')).toHaveLength(3)
		expect(page).toContain('href={cookPlanCookingPath(dish.recipeId)}')
		expect(page).toContain("{t('startCooking')}")
	})

	it('clamps saved settings to the range the control can represent', () => {
		expect(clampActiveMinutes(5)).toBe(MIN_ACTIVE_MINUTES)
		expect(clampActiveMinutes(90)).toBe(90)
		expect(clampActiveMinutes(240)).toBe(MAX_ACTIVE_MINUTES)
	})

	it('keeps the same ingredient in different units independently addressable', () => {
		const grams = cookPlanShoppingItemKey({
			ingredient: 'Rice',
			quantity: '500',
			unit: 'g',
			sourceRecipes: ['Rice bowl'],
		})
		const cups = cookPlanShoppingItemKey({
			ingredient: 'Rice',
			quantity: '2',
			unit: 'cups',
			sourceRecipes: ['Soup'],
		})

		expect(grams).not.toBe(cups)
	})

	it('treats a changed quantity as a different grocery obligation', () => {
		const one = cookPlanShoppingItemKey({
			ingredient: 'Rice',
			quantity: '500',
			unit: 'g',
			sourceRecipes: [],
		})
		const two = cookPlanShoppingItemKey({
			ingredient: 'Rice',
			quantity: '1000',
			unit: 'g',
			sourceRecipes: [],
		})

		expect(one).not.toBe(two)
	})

	it('preserves only exact checked obligations present in the next plan', () => {
		const unchanged = {
			ingredient: 'Rice',
			quantity: '500',
			unit: 'g',
			sourceRecipes: ['Rice bowl'],
		}
		const changedQuantity = {
			...unchanged,
			quantity: '1000',
		}
		const removed = {
			ingredient: 'Lime',
			quantity: '2',
			unit: null,
			sourceRecipes: ['Soup'],
		}
		const checked = new Set([
			cookPlanShoppingItemKey(unchanged),
			cookPlanShoppingItemKey(removed),
		])

		expect([
			...reconcileCheckedShoppingItems(checked, [unchanged, changedQuantity]),
		]).toEqual([cookPlanShoppingItemKey(unchanged)])
	})
})
