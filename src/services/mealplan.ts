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

export async function generateMealPlan(
	req: GenerateMealPlanRequest,
	useAI = false,
): Promise<MealPlan | null> {
	try {
		const res = await api.post<ApiResponse<MealPlan>>(
			API_ENDPOINTS.MEAL_PLANS.GENERATE,
			req,
			{ params: useAI ? { useAI: true } : undefined },
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('generateMealPlan failed:', error)
		return null
	}
}

export async function getCurrentMealPlan(): Promise<MealPlan | null> {
	try {
		const res = await api.get<ApiResponse<MealPlan>>(
			API_ENDPOINTS.MEAL_PLANS.CURRENT,
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('getCurrentMealPlan failed:', error)
		return null
	}
}

export async function getMealPlanById(id: string): Promise<MealPlan | null> {
	try {
		const res = await api.get<ApiResponse<MealPlan>>(
			API_ENDPOINTS.MEAL_PLANS.GET(id),
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('getMealPlanById failed:', error)
		return null
	}
}

export async function deleteMealPlan(id: string): Promise<boolean> {
	try {
		await api.delete(API_ENDPOINTS.MEAL_PLANS.DELETE(id))
		return true
	} catch (error) {
		logDevError('deleteMealPlan failed:', error)
		return false
	}
}

export async function swapMeal(
	planId: string,
	day: string,
	mealType: string,
	req: SwapMealRequest,
): Promise<MealPlan | null> {
	try {
		const res = await api.put<ApiResponse<MealPlan>>(
			API_ENDPOINTS.MEAL_PLANS.SWAP_MEAL(planId, day, mealType),
			req,
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('swapMeal failed:', error)
		return null
	}
}

export async function getShoppingList(planId: string): Promise<ShoppingItem[]> {
	try {
		const res = await api.get<ApiResponse<ShoppingItem[]>>(
			API_ENDPOINTS.MEAL_PLANS.SHOPPING_LIST(planId),
		)
		return res.data.data ?? []
	} catch (error) {
		logDevError('getShoppingList failed:', error)
		return []
	}
}
