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
import { logDevError } from '@/lib/dev-log'

// ── Create ──────────────────────────────────────────────────────

export async function createFromMealPlan(
	req: CreateFromMealPlanRequest,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.FROM_MEAL_PLAN,
			req,
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('createFromMealPlan failed:', error)
		return null
	}
}

export async function createFromRecipe(
	req: CreateFromRecipeRequest,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.FROM_RECIPE,
			req,
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('createFromRecipe failed:', error)
		return null
	}
}

export async function createCustomList(
	req: CreateCustomListRequest,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.CUSTOM,
			req,
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('createCustomList failed:', error)
		return null
	}
}

// ── Read ────────────────────────────────────────────────────────

export async function getUserShoppingLists(): Promise<ShoppingListSummary[]> {
	try {
		const res = await api.get<ApiResponse<ShoppingListSummary[]>>(
			API_ENDPOINTS.SHOPPING_LISTS.BASE,
		)
		return res.data.data ?? []
	} catch (error) {
		logDevError('getUserShoppingLists failed:', error)
		return []
	}
}

export async function getShoppingListById(
	id: string,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.get<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.GET(id),
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('getShoppingListById failed:', error)
		return null
	}
}

export async function getSharedShoppingList(
	shareToken: string,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.get<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.SHARED(shareToken),
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('getSharedShoppingList failed:', error)
		return null
	}
}

// ── Item Operations ─────────────────────────────────────────────

export async function toggleShoppingItem(
	listId: string,
	itemId: string,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.put<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.TOGGLE_ITEM(listId, itemId),
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('toggleShoppingItem failed:', error)
		return null
	}
}

export async function addCustomItem(
	listId: string,
	req: AddCustomItemRequest,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.ADD_ITEM(listId),
			req,
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('addCustomItem failed:', error)
		return null
	}
}

export async function removeShoppingItem(
	listId: string,
	itemId: string,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.delete<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.REMOVE_ITEM(listId, itemId),
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('removeShoppingItem failed:', error)
		return null
	}
}

// ── Delete ──────────────────────────────────────────────────────

export async function deleteShoppingList(listId: string): Promise<boolean> {
	try {
		await api.delete(API_ENDPOINTS.SHOPPING_LISTS.DELETE(listId))
		return true
	} catch (error) {
		logDevError('deleteShoppingList failed:', error)
		return false
	}
}

// ── Share ───────────────────────────────────────────────────────

export async function regenerateShareToken(
	listId: string,
): Promise<ShoppingListResponse | null> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.SHARE(listId),
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('regenerateShareToken failed:', error)
		return null
	}
}

// ── Commerce (W5.5+W5.8: Grocery Affiliate) ────────────────────

export interface GroceryProviderInfo {
	id: string
	displayName: string
}

export interface CheckoutResult {
	orderId: string
	checkoutUrl: string | null
	provider: string
	itemCount: number
	estimatedTotal: number
	status: string
}

export async function getGroceryProviders(): Promise<GroceryProviderInfo[]> {
	try {
		const res = await api.get<ApiResponse<GroceryProviderInfo[]>>(
			`${API_ENDPOINTS.SHOPPING_LISTS.BASE}/grocery-providers`,
		)
		return res.data.data ?? []
	} catch (error) {
		logDevError('getGroceryProviders failed:', error)
		return []
	}
}

export async function checkoutShoppingList(
	listId: string,
	provider: string = 'affiliate',
): Promise<CheckoutResult | null> {
	try {
		const res = await api.post<ApiResponse<CheckoutResult>>(
			`${API_ENDPOINTS.SHOPPING_LISTS.BASE}/${listId}/checkout?provider=${encodeURIComponent(provider)}`,
		)
		return res.data.data ?? null
	} catch (error) {
		logDevError('checkoutShoppingList failed:', error)
		return null
	}
}
