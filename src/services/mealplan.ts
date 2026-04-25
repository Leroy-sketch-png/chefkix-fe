import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	MealPlan,
	GenerateMealPlanRequest,
	SwapMealRequest,
	ShoppingItem,
} from '@/lib/types/mealplan'
import { API_ENDPOINTS } from '@/constants'
import { logDevError } from '@/lib/dev-log'
import type { AxiosError } from 'axios'

export async function generateMealPlan(
	req: GenerateMealPlanRequest,
	useAI = false,
): Promise<MealPlan> {
	try {
		const res = await api.post<ApiResponse<MealPlan>>(
			API_ENDPOINTS.MEAL_PLANS.GENERATE,
			req,
			{ params: useAI ? { useAI: true } : undefined },
		)
		if (!res.data.data) throw new Error('No meal plan data returned')
		return res.data.data
	} catch (err) {
		logDevError('[MealPlan] generateMealPlan failed:', err)
		throw err
	}
}

export async function getCurrentMealPlan(): Promise<MealPlan | null> {
	try {
		const res = await api.get<ApiResponse<MealPlan>>(
			API_ENDPOINTS.MEAL_PLANS.CURRENT,
		)
		const payload = res.data.data
		if (!payload) return null

		if (!Array.isArray(payload.days)) {
			logDevError(
				'[MealPlan] getCurrentMealPlan received invalid payload:',
				payload,
			)
			return null
		}

		return {
			...payload,
			shoppingList: Array.isArray(payload.shoppingList)
				? payload.shoppingList
				: [],
		}
	} catch (err) {
		logDevError('[MealPlan] getCurrentMealPlan failed:', err)
		throw err
	}
}

export async function getMealPlanById(id: string): Promise<MealPlan> {
	try {
		const res = await api.get<ApiResponse<MealPlan>>(
			API_ENDPOINTS.MEAL_PLANS.GET(id),
		)
		if (!res.data.data) throw new Error('Meal plan not found')
		return res.data.data
	} catch (err) {
		logDevError('[MealPlan] getMealPlanById failed:', err)
		throw err
	}
}

export async function deleteMealPlan(id: string): Promise<void> {
	try {
		await api.delete(API_ENDPOINTS.MEAL_PLANS.DELETE(id))
	} catch (err) {
		logDevError('[MealPlan] deleteMealPlan failed:', err)
		throw err
	}
}

export async function swapMeal(
	planId: string,
	day: string,
	mealType: string,
	req: SwapMealRequest,
): Promise<MealPlan> {
	try {
		const res = await api.put<ApiResponse<MealPlan>>(
			API_ENDPOINTS.MEAL_PLANS.SWAP_MEAL(planId, day, mealType),
			req,
		)
		if (!res.data.data) throw new Error('No data returned from swap')
		return res.data.data
	} catch (err) {
		logDevError('[MealPlan] swapMeal failed:', err)
		throw err
	}
}

export async function getShoppingList(planId: string): Promise<ShoppingItem[]> {
	try {
		const res = await api.get<ApiResponse<ShoppingItem[]>>(
			API_ENDPOINTS.MEAL_PLANS.SHOPPING_LIST(planId),
		)
		return res.data.data ?? []
	} catch (err) {
		logDevError('[MealPlan] getShoppingList failed:', err)
		return []
	}
}
