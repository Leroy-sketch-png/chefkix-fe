import { API_ENDPOINTS } from '@/constants'
import { api } from '@/lib/axios'
import type { ApiResponse } from '@/lib/types/common'
import type {
	CookPlan,
	CreateCookPlanRequest,
} from '@/lib/types/cookplan'

export async function createCookPlan(
	request: CreateCookPlanRequest,
): Promise<CookPlan> {
	const response = await api.post<ApiResponse<CookPlan>>(
		API_ENDPOINTS.COOK_PLANS.BASE,
		request,
	)
	if (!response.data.data) {
		throw new Error('Cook plan response did not include data')
	}
	return response.data.data
}

export async function getCurrentCookPlan(
	planDate: string,
): Promise<CookPlan | null> {
	const response = await api.get<ApiResponse<CookPlan>>(
		API_ENDPOINTS.COOK_PLANS.CURRENT,
		{ params: { planDate } },
	)
	return response.data.data ?? null
}

export async function swapCookPlanDish(
	planId: string,
	batchId: string,
	dishRecipeId: string,
	replacementRecipeId: string,
): Promise<CookPlan> {
	const response = await api.put<ApiResponse<CookPlan>>(
		API_ENDPOINTS.COOK_PLANS.SWAP(
			planId,
			batchId,
			dishRecipeId,
		),
		{ recipeId: replacementRecipeId },
	)
	if (!response.data.data) {
		throw new Error('Cook plan swap did not include data')
	}
	return response.data.data
}
