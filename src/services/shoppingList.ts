import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	ShoppingListResponse,
	ShoppingListSummary,
	CreateFromMealPlanRequest,
	CreateFromRecipeRequest,
	CreateCustomListRequest,
	AddCustomItemRequest,
} from '@/lib/types/shoppingList'
import { API_ENDPOINTS } from '@/constants'
import type { AxiosError } from 'axios'

function handleError<T>(error: unknown): T {
	const axiosError = error as AxiosError<ApiResponse<T>>
	if (axiosError.response?.data) {
		throw axiosError.response.data
	}
	throw error
}

// ── Create ──────────────────────────────────────────────────────

export async function createFromMealPlan(
	req: CreateFromMealPlanRequest,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.FROM_MEAL_PLAN,
			req,
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

export async function createFromRecipe(
	req: CreateFromRecipeRequest,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.FROM_RECIPE,
			req,
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

export async function createCustomList(
	req: CreateCustomListRequest,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.CUSTOM,
			req,
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

// ── Read ────────────────────────────────────────────────────────

export async function getUserShoppingLists(): Promise<ShoppingListSummary[]> {
	try {
		const res = await api.get<ApiResponse<ShoppingListSummary[]>>(
			API_ENDPOINTS.SHOPPING_LISTS.BASE,
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

export async function getShoppingListById(
	id: string,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.get<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.GET(id),
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

export async function getSharedShoppingList(
	shareToken: string,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.get<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.SHARED(shareToken),
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

// ── Item Operations ─────────────────────────────────────────────

export async function toggleShoppingItem(
	listId: string,
	itemId: string,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.put<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.TOGGLE_ITEM(listId, itemId),
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

export async function addCustomItem(
	listId: string,
	req: AddCustomItemRequest,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.ADD_ITEM(listId),
			req,
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

export async function removeShoppingItem(
	listId: string,
	itemId: string,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.delete<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.REMOVE_ITEM(listId, itemId),
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}

// ── Delete ──────────────────────────────────────────────────────

export async function deleteShoppingList(listId: string): Promise<void> {
	try {
		await api.delete(API_ENDPOINTS.SHOPPING_LISTS.DELETE(listId))
	} catch (error) {
		handleError(error)
	}
}

// ── Share ───────────────────────────────────────────────────────

export async function regenerateShareToken(
	listId: string,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.SHARE(listId),
		)
		return res.data.data!
	} catch (error) {
		return handleError(error)
	}
}
