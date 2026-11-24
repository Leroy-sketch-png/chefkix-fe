import { api } from '@/lib/axios'
import type {
	ProductFoodCandidate,
	ProductFoodCompositionResponse,
	ProductFoodSearchResponse,
	ProductGraphProvenance,
} from '../types/productGraph'

export const PRODUCT_GRAPH_MANIFEST_SHA256 =
	'a187fe108dc2e716169344f3cb120c881a8e481b923351acfd49881cf5a6a01f'
export const PRODUCT_GRAPH_NODES_SHA256 =
	'ca26f6001a50c0ebe668019541fe392e6aee87cecd78c89b2429c3090ddbac94'
export const PRODUCT_GRAPH_EDGES_SHA256 =
	'd611e9effb7a0b2b7fd2d5bd9e09d78bb8822681d2955bb1f024cec39a8f403f'

const FOOD_ID = /^[1-9]\d{0,18}$/
const FOOD_NODE_ID = /^foodb:1\.0:food-id:[1-9]\d{0,18}$/
const COMPOUND_NODE_ID = /^foodb:1\.0:compound-id:[1-9]\d{0,18}$/

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function unwrap(value: unknown): unknown {
	if (isRecord(value) && 'data' in value) return value.data
	return value
}

function provenance(value: unknown): ProductGraphProvenance {
	if (
		!isRecord(value) ||
		value.manifestSha256 !== PRODUCT_GRAPH_MANIFEST_SHA256 ||
		value.nodesSha256 !== PRODUCT_GRAPH_NODES_SHA256 ||
		value.edgesSha256 !== PRODUCT_GRAPH_EDGES_SHA256 ||
		value.source !== 'FooDB 1.0' ||
		value.releaseDate !== '2020-04-07' ||
		value.license !== 'CC BY-NC 4.0' ||
		typeof value.scope !== 'string' ||
		typeof value.interpretation !== 'string'
	) {
		throw new Error('The product graph did not match its pinned source manifest.')
	}
	return value as unknown as ProductGraphProvenance
}

function candidate(value: unknown): ProductFoodCandidate {
	if (
		!isRecord(value) ||
		typeof value.foodId !== 'string' ||
		!FOOD_ID.test(value.foodId) ||
		typeof value.name !== 'string' ||
		!value.name.trim()
	) {
		throw new Error('The product graph returned an invalid Food identity.')
	}
	return { foodId: value.foodId, name: value.name }
}

export async function searchProductFoods(query: string, limit = 10) {
	const term = query.trim()
	if (!term || term.length > 120 || limit < 1 || limit > 20) {
		throw new Error('Enter a food name to search the source graph.')
	}
	const response = await api.get('/knowledge/product/foods', {
		params: { q: term, limit },
	})
	const payload = unwrap(response.data)
	if (!isRecord(payload) || !Array.isArray(payload.foods)) {
		throw new Error('The product graph search response is invalid.')
	}
	return {
		provenance: provenance(payload.provenance),
		foods: payload.foods.map(candidate),
	} satisfies ProductFoodSearchResponse
}

export async function getProductFoodComposition(foodId: string) {
	if (!FOOD_ID.test(foodId)) throw new Error('The selected source Food ID is invalid.')
	const response = await api.get(
		`/knowledge/product/foods/${encodeURIComponent(foodId)}/compounds`,
	)
	const payload = unwrap(response.data)
	const status = isRecord(payload) ? payload.status : undefined
	if (
		!isRecord(payload) ||
		(status !== 'AVAILABLE' &&
			status !== 'NO_ELIGIBLE_RELATION_UNKNOWN' &&
			status !== 'UNKNOWN_OR_OUT_OF_SCOPE') ||
		!Array.isArray(payload.compounds) ||
		typeof payload.filteredKnownRelationCount !== 'number' ||
		payload.filteredKnownRelationCount < 0
	) {
		throw new Error('The product graph response is invalid.')
	}
	const food = payload.food
	if (
		food !== null &&
		(!isRecord(food) ||
			typeof food.id !== 'string' ||
			!FOOD_NODE_ID.test(food.id) ||
			typeof food.name !== 'string' ||
			food.type !== 'Food')
	) {
		throw new Error('The product graph returned an invalid Food node.')
	}
	const compounds = payload.compounds.map(item => {
		if (
			!isRecord(item) ||
			typeof item.id !== 'string' ||
			!COMPOUND_NODE_ID.test(item.id) ||
			typeof item.name !== 'string' ||
			item.predicate !== 'has_compound' ||
			item.presence !== 'PRESENT' ||
			typeof item.contentRowSupport !== 'number' ||
			typeof item.exportEligibleSupport !== 'number' ||
			item.exportEligibleSupport < 1 ||
			item.exportEligibleSupport > item.contentRowSupport
		) {
			throw new Error('The product graph returned an invalid source relation.')
		}
		return item as unknown as ProductFoodCompositionResponse['compounds'][number]
	})
	return {
		status: status as ProductFoodCompositionResponse['status'],
		provenance: provenance(payload.provenance),
		food: food as ProductFoodCompositionResponse['food'],
		compounds,
		filteredKnownRelationCount: payload.filteredKnownRelationCount,
	} satisfies ProductFoodCompositionResponse
}
