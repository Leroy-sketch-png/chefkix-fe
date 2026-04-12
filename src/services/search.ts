import { api } from '@/lib/axios'
import { ApiResponse } from '@/lib/types/common'
import {
	UnifiedSearchResponse,
	KnowledgeIngredient,
	KnowledgeTechnique,
	IngredientSubstitution,
	SearchType,
} from '@/lib/types/search'
import { API_ENDPOINTS } from '@/constants'
import { logDevError } from '@/lib/dev-log'
import type { AxiosError } from 'axios'

// ── Unified Search ──

export async function unifiedSearch(
	q: string,
	type: SearchType = 'all',
	limit = 10,
	page = 1,
): Promise<ApiResponse<UnifiedSearchResponse>> {
	try {
		const response = await api.get(API_ENDPOINTS.SEARCH.UNIFIED, {
			params: { q, type, limit, page },
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<UnifiedSearchResponse>>
		logDevError('[search] unifiedSearch failed', axiosError)
		return (
			axiosError.response?.data ?? {
				success: false,
				statusCode: 500,
				message: 'Search failed',
			}
		)
	}
}

export async function autocompleteSearch(
	q: string,
	type: SearchType = 'all',
	limit = 5,
): Promise<ApiResponse<UnifiedSearchResponse>> {
	try {
		const response = await api.get(API_ENDPOINTS.SEARCH.AUTOCOMPLETE, {
			params: { q, type, limit },
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<UnifiedSearchResponse>>
		logDevError('[search] autocomplete failed', axiosError)
		return (
			axiosError.response?.data ?? {
				success: false,
				statusCode: 500,
				message: 'Autocomplete failed',
			}
		)
	}
}

export async function getTrendingSearches(
	limit = 10,
): Promise<ApiResponse<string[]>> {
	try {
		const response = await api.get(API_ENDPOINTS.SEARCH.TRENDING, {
			params: { limit },
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<string[]>>
		logDevError('[search] trendingSearches failed', axiosError)
		return (
			axiosError.response?.data ?? {
				success: false,
				statusCode: 500,
				message: 'Trending searches failed',
			}
		)
	}
}

// ── Knowledge Graph: Ingredients ──

export async function searchIngredients(
	q?: string,
	category?: string,
): Promise<ApiResponse<KnowledgeIngredient[]>> {
	try {
		const response = await api.get(API_ENDPOINTS.KNOWLEDGE.INGREDIENTS, {
			params: { q, category },
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<KnowledgeIngredient[]>>
		logDevError('[knowledge] searchIngredients failed', axiosError)
		return (
			axiosError.response?.data ?? {
				success: false,
				statusCode: 500,
				message: 'Ingredient search failed',
			}
		)
	}
}

export async function getIngredientByName(
	name: string,
): Promise<ApiResponse<KnowledgeIngredient>> {
	try {
		const response = await api.get(API_ENDPOINTS.KNOWLEDGE.INGREDIENT(name))
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<KnowledgeIngredient>>
		logDevError('[knowledge] getIngredient failed', axiosError)
		return (
			axiosError.response?.data ?? {
				success: false,
				statusCode: 500,
				message: 'Ingredient not found',
			}
		)
	}
}

export async function getSubstitutions(
	ingredientName: string,
): Promise<ApiResponse<IngredientSubstitution[]>> {
	try {
		const response = await api.get(
			API_ENDPOINTS.KNOWLEDGE.SUBSTITUTIONS(ingredientName),
		)
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<
			ApiResponse<IngredientSubstitution[]>
		>
		logDevError('[knowledge] getSubstitutions failed', axiosError)
		return (
			axiosError.response?.data ?? {
				success: false,
				statusCode: 500,
				message: 'Substitutions not found',
			}
		)
	}
}

// ── Knowledge Graph: Techniques ──

export async function searchTechniques(
	q?: string,
	category?: string,
	difficulty?: string,
): Promise<ApiResponse<KnowledgeTechnique[]>> {
	try {
		const response = await api.get(API_ENDPOINTS.KNOWLEDGE.TECHNIQUES, {
			params: { q, category, difficulty },
		})
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<KnowledgeTechnique[]>>
		logDevError('[knowledge] searchTechniques failed', axiosError)
		return (
			axiosError.response?.data ?? {
				success: false,
				statusCode: 500,
				message: 'Technique search failed',
			}
		)
	}
}

export async function getTechniqueByName(
	name: string,
): Promise<ApiResponse<KnowledgeTechnique>> {
	try {
		const response = await api.get(API_ENDPOINTS.KNOWLEDGE.TECHNIQUE(name))
		return response.data
	} catch (error) {
		const axiosError = error as AxiosError<ApiResponse<KnowledgeTechnique>>
		logDevError('[knowledge] getTechnique failed', axiosError)
		return (
			axiosError.response?.data ?? {
				success: false,
				statusCode: 500,
				message: 'Technique not found',
			}
		)
	}
}
