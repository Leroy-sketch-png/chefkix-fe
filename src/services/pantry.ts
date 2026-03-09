import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	PantryItem,
	PantryItemRequest,
	BulkPantryItemRequest,
	PantryRecipeMatch,
} from '@/lib/types/pantry'
import { API_ENDPOINTS } from '@/constants'

// ── CRUD ──────────────────────────────────────────────

export async function getPantryItems(
	category?: string,
	sort?: string,
): Promise<PantryItem[]> {
	const params: Record<string, string> = {}
	if (category) params.category = category
	if (sort) params.sort = sort
	const res = await api.get<ApiResponse<PantryItem[]>>(
		API_ENDPOINTS.PANTRY.BASE,
		{ params },
	)
	return res.data.data ?? []
}

export async function addPantryItem(
	item: PantryItemRequest,
): Promise<PantryItem> {
	const res = await api.post<ApiResponse<PantryItem>>(
		API_ENDPOINTS.PANTRY.BASE,
		item,
	)
	return res.data.data!
}

export async function bulkAddPantryItems(
	items: PantryItemRequest[],
): Promise<PantryItem[]> {
	const body: BulkPantryItemRequest = { items }
	const res = await api.post<ApiResponse<PantryItem[]>>(
		API_ENDPOINTS.PANTRY.BULK_ADD,
		body,
	)
	return res.data.data ?? []
}

export async function updatePantryItem(
	id: string,
	item: PantryItemRequest,
): Promise<PantryItem> {
	const res = await api.put<ApiResponse<PantryItem>>(
		API_ENDPOINTS.PANTRY.UPDATE(id),
		item,
	)
	return res.data.data!
}

export async function deletePantryItem(id: string): Promise<void> {
	await api.delete(API_ENDPOINTS.PANTRY.DELETE(id))
}

export async function clearExpiredItems(): Promise<number> {
	const res = await api.delete<ApiResponse<{ removed: number }>>(
		API_ENDPOINTS.PANTRY.CLEAR_EXPIRED,
	)
	return res.data.data?.removed ?? 0
}

// ── Recipe Matching ─────────────────────────────────────

export async function getMatchingRecipes(
	minMatch = 0.3,
	prioritizeExpiring = false,
): Promise<PantryRecipeMatch[]> {
	const res = await api.get<ApiResponse<PantryRecipeMatch[]>>(
		API_ENDPOINTS.PANTRY.MATCH_RECIPES,
		{ params: { minMatch, prioritizeExpiring } },
	)
	return res.data.data ?? []
}
