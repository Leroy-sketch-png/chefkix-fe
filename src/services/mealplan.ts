import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	MealPlan,
	GenerateMealPlanRequest,
	SwapMealRequest,
	ShoppingItem,
} from '@/lib/types/mealplan'
import { API_ENDPOINTS } from '@/constants'

function requireData<T>(data: T | undefined | null, label: string): T {
	if (data == null) throw new Error(`No data returned from ${label}`)
	return data
}

export async function generateMealPlan(
	req: GenerateMealPlanRequest,
	useAI = false,
): Promise<MealPlan> {
	const res = await api.post<ApiResponse<MealPlan>>(
		API_ENDPOINTS.MEAL_PLANS.GENERATE,
		req,
		{ params: useAI ? { useAI: true } : undefined },
	)
	return requireData(res.data.data, 'generate meal plan')
}

export async function getCurrentMealPlan(): Promise<MealPlan | null> {
	const res = await api.get<ApiResponse<MealPlan>>(
		API_ENDPOINTS.MEAL_PLANS.CURRENT,
	)
	return res.data.data ?? null
}

export async function getMealPlanById(id: string): Promise<MealPlan> {
	const res = await api.get<ApiResponse<MealPlan>>(
		API_ENDPOINTS.MEAL_PLANS.GET(id),
	)
	return requireData(res.data.data, 'get meal plan')
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
	return requireData(res.data.data, 'swap meal')
}

export async function getShoppingList(planId: string): Promise<ShoppingItem[]> {
	const res = await api.get<ApiResponse<ShoppingItem[]>>(
		API_ENDPOINTS.MEAL_PLANS.SHOPPING_LIST(planId),
	)
	return res.data.data ?? []
}
