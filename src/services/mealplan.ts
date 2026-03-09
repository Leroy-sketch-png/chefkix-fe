import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	MealPlan,
	GenerateMealPlanRequest,
	SwapMealRequest,
	ShoppingItem,
} from '@/lib/types/mealplan'
import { API_ENDPOINTS } from '@/constants'

export async function generateMealPlan(
	req: GenerateMealPlanRequest,
): Promise<MealPlan> {
	const res = await api.post<ApiResponse<MealPlan>>(
		API_ENDPOINTS.MEAL_PLANS.GENERATE,
		req,
	)
	return res.data.data!
}

export async function getCurrentMealPlan(): Promise<MealPlan> {
	const res = await api.get<ApiResponse<MealPlan>>(
		API_ENDPOINTS.MEAL_PLANS.CURRENT,
	)
	return res.data.data!
}

export async function getMealPlanById(id: string): Promise<MealPlan> {
	const res = await api.get<ApiResponse<MealPlan>>(
		API_ENDPOINTS.MEAL_PLANS.GET(id),
	)
	return res.data.data!
}

export async function deleteMealPlan(id: string): Promise<void> {
	await api.delete(API_ENDPOINTS.MEAL_PLANS.DELETE(id))
}

export async function swapMeal(
	planId: string,
	day: string,
	mealType: string,
	req: SwapMealRequest,
): Promise<MealPlan> {
	const res = await api.put<ApiResponse<MealPlan>>(
		API_ENDPOINTS.MEAL_PLANS.SWAP_MEAL(planId, day, mealType),
		req,
	)
	return res.data.data!
}

export async function getShoppingList(planId: string): Promise<ShoppingItem[]> {
	const res = await api.get<ApiResponse<ShoppingItem[]>>(
		API_ENDPOINTS.MEAL_PLANS.SHOPPING_LIST(planId),
	)
	return res.data.data ?? []
}
