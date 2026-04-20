import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import { logDevError } from '@/lib/dev-log'
import {
	ShoppingListResponse,
	ShoppingListSummary,
	CreateFromMealPlanRequest,
	CreateFromRecipeRequest,
	CreateCustomListRequest,
	AddCustomItemRequest,
} from '@/lib/types/shoppingList'
import { API_ENDPOINTS } from '@/constants'

// ── Create ──────────────────────────────────────────────────────

export async function createFromMealPlan(
	req: CreateFromMealPlanRequest,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.FROM_MEAL_PLAN,
			req,
		)
		if (!res.data.data) throw new Error('No data returned')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] createFromMealPlan failed:', err)
		throw err
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
		if (!res.data.data) throw new Error('No data returned')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] createFromRecipe failed:', err)
		throw err
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
		if (!res.data.data) throw new Error('No data returned')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] createCustomList failed:', err)
		throw err
	}
}

// ── Read ────────────────────────────────────────────────────────

export async function getUserShoppingLists(): Promise<ShoppingListSummary[]> {
	try {
		const res = await api.get<ApiResponse<ShoppingListSummary[]>>(
			API_ENDPOINTS.SHOPPING_LISTS.BASE,
		)
		return res.data.data ?? []
	} catch (err) {
		logDevError('[ShoppingList] getUserShoppingLists failed:', err)
		return []
	}
}

export async function getShoppingListById(
	id: string,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.get<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.GET(id),
		)
		if (!res.data.data) throw new Error('Shopping list not found')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] getShoppingListById failed:', err)
		throw err
	}
}

export async function getSharedShoppingList(
	shareToken: string,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.get<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.SHARED(shareToken),
		)
		if (!res.data.data) throw new Error('Shared list not found')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] getSharedShoppingList failed:', err)
		throw err
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
		if (!res.data.data) throw new Error('No data returned')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] toggleShoppingItem failed:', err)
		throw err
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
		if (!res.data.data) throw new Error('No data returned')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] addCustomItem failed:', err)
		throw err
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
		if (!res.data.data) throw new Error('No data returned')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] removeShoppingItem failed:', err)
		throw err
	}
}

// ── Delete ──────────────────────────────────────────────────────

export async function deleteShoppingList(listId: string): Promise<void> {
	await api.delete(API_ENDPOINTS.SHOPPING_LISTS.DELETE(listId))
}

// ── Share ───────────────────────────────────────────────────────

export async function regenerateShareToken(
	listId: string,
): Promise<ShoppingListResponse> {
	try {
		const res = await api.post<ApiResponse<ShoppingListResponse>>(
			API_ENDPOINTS.SHOPPING_LISTS.SHARE(listId),
		)
		if (!res.data.data) throw new Error('No data returned')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] regenerateShareToken failed:', err)
		throw err
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
	const res = await api.get<ApiResponse<GroceryProviderInfo[]>>(
		`${API_ENDPOINTS.SHOPPING_LISTS.BASE}/grocery-providers`,
	)
	return res.data.data ?? []
}

export async function checkoutShoppingList(
	listId: string,
	provider: string = 'affiliate',
): Promise<CheckoutResult> {
	try {
		const res = await api.post<ApiResponse<CheckoutResult>>(
			`${API_ENDPOINTS.SHOPPING_LISTS.BASE}/${listId}/checkout?provider=${encodeURIComponent(provider)}`,
		)
		if (!res.data.data) throw new Error('No checkout data returned')
		return res.data.data
	} catch (err) {
		logDevError('[ShoppingList] checkoutShoppingList failed:', err)
		throw err
	}
}

// ── Per-Ingredient Buy Links ─────────────────────────────────────

export interface IngredientLinkRequest {
	itemId: string
	name: string
	quantity?: string
	unit?: string
	category?: string
}

/**
 * Get per-ingredient affiliate buy links for recipe detail page.
 * Returns map of ingredientName → affiliate URL.
 */
export async function getIngredientBuyLinks(
	ingredients: IngredientLinkRequest[],
	provider: string = 'affiliate',
): Promise<Record<string, string>> {
	try {
		const res = await api.post<ApiResponse<Record<string, string>>>(
			`${API_ENDPOINTS.SHOPPING_LISTS.INGREDIENT_LINKS}?provider=${encodeURIComponent(provider)}`,
			ingredients,
		)
		return res.data.data ?? {}
	} catch (error) {
		logDevError('[ShoppingList] ingredient links fetch failed:', error)
		return {}
	}
}
