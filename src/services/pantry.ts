import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	PantryItem,
	PantryItemRequest,
	BulkPantryItemRequest,
	PantryRecipeMatch,
} from '@/lib/types/pantry'
import { API_ENDPOINTS } from '@/constants'
import { logDevError } from '@/lib/dev-log'

// ── CRUD ──────────────────────────────────────────────

export async function getPantryItems(
	category?: string,
	sort?: string,
): Promise<PantryItem[]> {
	try {
		const params: Record<string, string> = {}
		if (category) params.category = category
		if (sort) params.sort = sort
		const res = await api.get<ApiResponse<PantryItem[]>>(
			API_ENDPOINTS.PANTRY.BASE,
			{ params },
		)
		return res.data.data ?? []
	} catch (err) {
		logDevError('[Pantry] getPantryItems failed:', err)
		return []
	}
}

export async function addPantryItem(
	item: PantryItemRequest,
): Promise<PantryItem> {
	try {
		const res = await api.post<ApiResponse<PantryItem>>(
			API_ENDPOINTS.PANTRY.BASE,
			item,
		)
		if (!res.data.data) throw new Error('No data returned from add pantry item')
		return res.data.data
	} catch (err) {
		logDevError('[Pantry] addPantryItem failed:', err)
		throw err
	}
}

export async function bulkAddPantryItems(
	items: PantryItemRequest[],
): Promise<PantryItem[]> {
	try {
		const body: BulkPantryItemRequest = { items }
		const res = await api.post<ApiResponse<PantryItem[]>>(
			API_ENDPOINTS.PANTRY.BULK_ADD,
			body,
		)
		return res.data.data ?? []
	} catch (err) {
		logDevError('[Pantry] bulkAddPantryItems failed:', err)
		throw err
	}
}

export async function updatePantryItem(
	id: string,
	item: PantryItemRequest,
): Promise<PantryItem> {
	try {
		const res = await api.put<ApiResponse<PantryItem>>(
			API_ENDPOINTS.PANTRY.UPDATE(id),
			item,
		)
		if (!res.data.data)
			throw new Error('No data returned from update pantry item')
		return res.data.data
	} catch (err) {
		logDevError('[Pantry] updatePantryItem failed:', err)
		throw err
	}
}

export async function deletePantryItem(id: string): Promise<void> {
	try {
		await api.delete(API_ENDPOINTS.PANTRY.DELETE(id))
	} catch (err) {
		logDevError('[Pantry] deletePantryItem failed:', err)
		throw err
	}
}

export async function clearExpiredItems(): Promise<number> {
	try {
		const res = await api.delete<ApiResponse<{ removed: number }>>(
			API_ENDPOINTS.PANTRY.CLEAR_EXPIRED,
		)
		return res.data.data?.removed ?? 0
	} catch (err) {
		logDevError('[Pantry] clearExpiredItems failed:', err)
		return 0
	}
}

// ── Recipe Matching ─────────────────────────────────────

export async function getMatchingRecipes(
	minMatch = 0.3,
	prioritizeExpiring = false,
): Promise<PantryRecipeMatch[]> {
	try {
		const res = await api.get<ApiResponse<PantryRecipeMatch[]>>(
			API_ENDPOINTS.PANTRY.MATCH_RECIPES,
			{ params: { minMatch, prioritizeExpiring } },
		)
		return res.data.data ?? []
	} catch (err) {
		logDevError('[Pantry] getMatchingRecipes failed:', err)
		return []
	}
}
