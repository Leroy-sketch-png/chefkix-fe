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

// ── Create ──────────────────────────────────────────────────────

export async function createFromMealPlan(
	req: CreateFromMealPlanRequest,
): Promise<ShoppingListResponse> {
	const res = await api.post<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.FROM_MEAL_PLAN,
		req,
	)
	return res.data.data!
}

export async function createFromRecipe(
	req: CreateFromRecipeRequest,
): Promise<ShoppingListResponse> {
	const res = await api.post<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.FROM_RECIPE,
		req,
	)
	return res.data.data!
}

export async function createCustomList(
	req: CreateCustomListRequest,
): Promise<ShoppingListResponse> {
	const res = await api.post<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.CUSTOM,
		req,
	)
	return res.data.data!
}

// ── Read ────────────────────────────────────────────────────────

export async function getUserShoppingLists(): Promise<ShoppingListSummary[]> {
	const res = await api.get<ApiResponse<ShoppingListSummary[]>>(
		API_ENDPOINTS.SHOPPING_LISTS.BASE,
	)
	return res.data.data ?? []
}

export async function getShoppingListById(
	id: string,
): Promise<ShoppingListResponse> {
	const res = await api.get<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.GET(id),
	)
	return res.data.data!
}

export async function getSharedShoppingList(
	shareToken: string,
): Promise<ShoppingListResponse> {
	const res = await api.get<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.SHARED(shareToken),
	)
	return res.data.data!
}

// ── Item Operations ─────────────────────────────────────────────

export async function toggleShoppingItem(
	listId: string,
	itemId: string,
): Promise<ShoppingListResponse> {
	const res = await api.put<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.TOGGLE_ITEM(listId, itemId),
	)
	return res.data.data!
}

export async function addCustomItem(
	listId: string,
	req: AddCustomItemRequest,
): Promise<ShoppingListResponse> {
	const res = await api.post<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.ADD_ITEM(listId),
		req,
	)
	return res.data.data!
}

export async function removeShoppingItem(
	listId: string,
	itemId: string,
): Promise<ShoppingListResponse> {
	const res = await api.delete<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.REMOVE_ITEM(listId, itemId),
	)
	return res.data.data!
}

// ── Delete ──────────────────────────────────────────────────────

export async function deleteShoppingList(listId: string): Promise<void> {
	await api.delete(API_ENDPOINTS.SHOPPING_LISTS.DELETE(listId))
}

// ── Share ───────────────────────────────────────────────────────

export async function regenerateShareToken(
	listId: string,
): Promise<ShoppingListResponse> {
	const res = await api.post<ApiResponse<ShoppingListResponse>>(
		API_ENDPOINTS.SHOPPING_LISTS.SHARE(listId),
	)
	return res.data.data!
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
	const res = await api.post<ApiResponse<CheckoutResult>>(
		`${API_ENDPOINTS.SHOPPING_LISTS.BASE}/${listId}/checkout?provider=${encodeURIComponent(provider)}`,
	)
	return res.data.data!
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
	} catch {
		return {} // Graceful degradation — no buy links if service unavailable
	}
}
