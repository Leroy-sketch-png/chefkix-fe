import { api } from '@/lib/axios'
import { ApiResponse, Page } from '@/lib/types/common'
import {
	PantryItem,
	PantryItemRequest,
	BulkPantryItemRequest,
	PantryRecipeMatch,
} from '@/lib/types/pantry'
import { API_ENDPOINTS } from '@/constants'
import { logDevError } from '@/lib/dev-log'

// ── CRUD ──────────────────────────────────────────────

type PantryItemsPayload = PantryItem[] | Page<PantryItem>

function extractPantryItems(data: PantryItemsPayload | undefined): PantryItem[] {
	if (!data) return []
	if (Array.isArray(data)) return data
	return Array.isArray(data.content) ? data.content : []
}

function failureResponse<T>(message: string): ApiResponse<T> {
	return {
		success: false,
		statusCode: 500,
		message,
	}
}

function requireSuccess<T>(response: ApiResponse<T>, context: string): T {
	if (!response.success) {
		throw new Error(response.message || `${context} failed`)
	}
	if (response.data === undefined || response.data === null) {
		throw new Error(`No data returned from ${context}`)
	}
	return response.data
}

export async function getPantryItems(
	category?: string,
	sort?: string,
): Promise<ApiResponse<PantryItem[]>> {
	try {
		const params: Record<string, string> = {}
		if (category) params.category = category
		if (sort) params.sort = sort
		const res = await api.get<ApiResponse<PantryItemsPayload>>(
			API_ENDPOINTS.PANTRY.BASE,
			{ params },
		)
		if (!res.data.success) {
			logDevError('[Pantry] getPantryItems returned failure:', res.data)
			return {
				...res.data,
				data: undefined,
			}
		}
		return {
			...res.data,
			data: extractPantryItems(res.data.data),
		}
	} catch (err) {
		logDevError('[Pantry] getPantryItems failed:', err)
		return failureResponse('Failed to load pantry items')
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
		return requireSuccess(res.data, 'add pantry item')
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
		return requireSuccess(res.data, 'bulk add pantry items')
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
		return requireSuccess(res.data, 'update pantry item')
	} catch (err) {
		logDevError('[Pantry] updatePantryItem failed:', err)
		throw err
	}
}

export async function deletePantryItem(id: string): Promise<void> {
	try {
		const res = await api.delete<ApiResponse<void>>(API_ENDPOINTS.PANTRY.DELETE(id))
		if (res.data && !res.data.success) {
			throw new Error(res.data.message || 'delete pantry item failed')
		}
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
		return requireSuccess(res.data, 'clear expired pantry items').removed
	} catch (err) {
		logDevError('[Pantry] clearExpiredItems failed:', err)
		throw err
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
		return requireSuccess(res.data, 'get matching pantry recipes')
	} catch (err) {
		logDevError('[Pantry] getMatchingRecipes failed:', err)
		throw err
	}
}
