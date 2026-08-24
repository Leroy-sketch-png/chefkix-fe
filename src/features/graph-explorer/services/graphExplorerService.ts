import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import { mockGraph } from '../data/mockGraph'
import type {
	CompoundMolecule,
	GraphData,
	GraphEdge,
	GraphNode,
	NutritionSnapshot,
	TechniqueContext,
} from '../types'

const SAMPLE_LIMIT = 500

export interface GraphQuery {
	rootId?: string
	query?: string
	depth?: number
	limit?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function unwrapData(value: unknown): unknown {
	if (isRecord(value) && 'data' in value) return value.data
	return value
}

function asString(value: unknown, fallback = '') {
	return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asStringArray(value: unknown) {
	return Array.isArray(value)
		? value.filter(item => typeof item === 'string')
		: []
}

function normalizeNutrition(value: unknown): NutritionSnapshot | undefined {
	if (!isRecord(value)) return undefined
	const nutrition: NutritionSnapshot = {
		servingSize: asString(value.servingSize || value.serving_size) || undefined,
		calories: asNumber(value.calories),
		proteinGrams: asNumber(value.proteinGrams ?? value.protein_g),
		carbohydratesGrams: asNumber(
			value.carbohydratesGrams ?? value.carbohydrates_g ?? value.carbs_g,
		),
		fatGrams: asNumber(value.fatGrams ?? value.fat_g),
	}
	return Object.values(nutrition).some(item => item !== undefined)
		? nutrition
		: undefined
}

function normalizeCompound(value: unknown): CompoundMolecule | string {
	if (!isRecord(value)) return asString(value)
	return {
		name: asString(value.name || value.compoundName || value.compound_name),
		concentration: asNumber(value.concentration),
		unit: asString(value.unit) || undefined,
	}
}

function normalizeTechniqueContext(
	value: unknown,
): TechniqueContext | undefined {
	if (!isRecord(value)) return undefined
	const context: TechniqueContext = {
		worksFor: asStringArray(value.worksFor ?? value.works_for),
		notRecommendedFor: asStringArray(
			value.notRecommendedFor ?? value.not_recommended_for,
		),
		note: asString(value.note) || undefined,
	}
	return Object.values(context).some(item =>
		Array.isArray(item) ? item.length > 0 : item !== undefined,
	)
		? context
		: undefined
}

export function normalizeGraphNode(value: unknown): GraphNode {
	const node = isRecord(value) ? value : {}
	const compound = isRecord(node.compoundData)
		? node.compoundData
		: isRecord(node.compound_data)
			? node.compound_data
			: undefined
	const compounds = compound?.primaryCompounds ?? compound?.primary_compounds
	return {
		id: asString(node.id || node.canonicalName || node.canonical_name),
		name: asString(node.name || node.canonicalName || node.canonical_name),
		category: asString(node.category, 'ingredient'),
		allergenFlags: asStringArray(node.allergenFlags ?? node.allergen_flags),
		compoundData: compound
			? {
					primaryCompounds: Array.isArray(compounds)
						? compounds.map(normalizeCompound).filter(item => item !== '')
						: [],
					flavorProfile: asString(
						compound.flavorProfile ?? compound.flavor_profile,
					),
					source: asString(compound.source) || undefined,
				}
			: undefined,
		nutrition: normalizeNutrition(node.nutrition ?? node.nutritionalSnapshot),
		detailStatus:
			node.detailStatus === 'complete' ||
			compound !== undefined ||
			normalizeNutrition(node.nutrition ?? node.nutritionalSnapshot) !==
				undefined
				? 'complete'
				: 'pending',
	}
}

export function normalizeGraphEdge(value: unknown): GraphEdge {
	const edge = isRecord(value) ? value : {}
	const source = isRecord(edge.source)
		? asString(edge.source.id || edge.source.canonicalName)
		: asString(edge.source)
	const target = isRecord(edge.target)
		? asString(edge.target.id || edge.target.canonicalName)
		: asString(edge.target)
	const comparison = isRecord(edge.nutritionalComparison)
		? edge.nutritionalComparison
		: isRecord(edge.nutritional_comparison)
			? edge.nutritional_comparison
			: undefined
	return {
		source,
		target,
		type: asString(edge.type, 'substitution') as GraphEdge['type'],
		confidence: Math.max(0, Math.min(1, asNumber(edge.confidence) ?? 0)),
		context: asString(edge.context) || undefined,
		compoundOverlap: asNumber(edge.compoundOverlap ?? edge.compound_overlap),
		nutritionalComparison: comparison
			? {
					summary: asString(comparison.summary) || undefined,
					caloriesDelta: asNumber(
						comparison.caloriesDelta ?? comparison.calories_delta,
					),
					proteinGramsDelta: asNumber(
						comparison.proteinGramsDelta ?? comparison.protein_g_delta,
					),
					carbohydratesGramsDelta: asNumber(
						comparison.carbohydratesGramsDelta ?? comparison.carbs_g_delta,
					),
					fatGramsDelta: asNumber(
						comparison.fatGramsDelta ?? comparison.fat_g_delta,
					),
				}
			: undefined,
		cookValidationCount: asNumber(
			edge.cookValidationCount ?? edge.cook_validation_count,
		),
		techniqueContext: normalizeTechniqueContext(
			edge.techniqueContext ?? edge.technique_context,
		),
	}
}

export function normalizeGraphData(
	value: unknown,
	source: GraphData['source'],
	query?: GraphQuery,
): GraphData {
	const payload = unwrapData(value)
	const graph = isRecord(payload) ? payload : {}
	const nodes = Array.isArray(graph.nodes)
		? graph.nodes.map(normalizeGraphNode)
		: []
	const edges = Array.isArray(graph.edges)
		? graph.edges.map(normalizeGraphEdge)
		: []
	const limit = query?.limit
	const boundedNodes =
		limit && nodes.length > limit
			? [
					...nodes.filter(node => node.id === query.rootId),
					...nodes.filter(node => node.id !== query.rootId),
				].slice(0, limit)
			: nodes
	const boundedIds = new Set(boundedNodes.map(node => node.id))
	return {
		nodes: boundedNodes,
		edges: edges.filter(
			edge => boundedIds.has(edge.source) && boundedIds.has(edge.target),
		),
		source,
		totalNodeCount:
			asNumber(graph.totalNodeCount ?? graph.total_node_count) ?? nodes.length,
		hasMore:
			Boolean(graph.hasMore ?? graph.has_more) ||
			boundedNodes.length < nodes.length,
		loadedRootId: query?.rootId,
	}
}

export function mergeGraphData(
	base: GraphData,
	addition: GraphData,
): GraphData {
	const nodes = new Map(base.nodes.map(node => [node.id, node]))
	addition.nodes.forEach(node => {
		const previous = nodes.get(node.id)
		nodes.set(node.id, {
			...previous,
			...node,
			allergenFlags: node.allergenFlags.length
				? node.allergenFlags
				: (previous?.allergenFlags ?? []),
			compoundData: node.compoundData ?? previous?.compoundData,
			nutrition: node.nutrition ?? previous?.nutrition,
			detailStatus:
				node.detailStatus === 'complete' ||
				previous?.detailStatus === 'complete'
					? 'complete'
					: 'pending',
		})
	})
	const edges = new Map(
		base.edges.map(edge => [
			`${edge.source}:${edge.target}:${edge.type}`,
			edge,
		]),
	)
	addition.edges.forEach(edge =>
		edges.set(`${edge.source}:${edge.target}:${edge.type}`, {
			...edges.get(`${edge.source}:${edge.target}:${edge.type}`),
			...edge,
		}),
	)
	return {
		nodes: [...nodes.values()],
		edges: [...edges.values()],
		source: addition.source ?? base.source,
		totalNodeCount: Math.max(
			base.totalNodeCount ?? 0,
			addition.totalNodeCount ?? 0,
		),
		hasMore: addition.hasMore ?? base.hasMore,
		loadedRootId: addition.loadedRootId ?? base.loadedRootId,
	}
}

const useMock = process.env.NEXT_PUBLIC_GRAPH_EXPLORER_MOCK === 'true'

function getMockData(query?: GraphQuery): GraphData {
	const graph = normalizeGraphData(mockGraph, 'local-sample', query)
	if (!query?.rootId) return graph
	const connectedIds = new Set([query.rootId])
	graph.edges.forEach(edge => {
		if (edge.source === query.rootId) connectedIds.add(edge.target)
		if (edge.target === query.rootId) connectedIds.add(edge.source)
	})
	return {
		...graph,
		nodes: graph.nodes.filter(node => connectedIds.has(node.id)),
		edges: graph.edges.filter(
			edge => connectedIds.has(edge.source) && connectedIds.has(edge.target),
		),
		loadedRootId: query.rootId,
	}
}

export async function getGraphData(query?: GraphQuery): Promise<GraphData> {
	if (useMock) return getMockData(query)
	const response = await api.get(API_ENDPOINTS.KNOWLEDGE.GRAPH, {
		params: {
			root: query?.rootId,
			q: query?.query,
			depth: query?.depth ?? 1,
			limit: query?.limit ?? SAMPLE_LIMIT,
		},
	})
	return normalizeGraphData(response.data, 'leader-api', query)
}

export function getGraphNeighborhood(nodeId: string) {
	return getGraphData({ rootId: nodeId, depth: 1, limit: SAMPLE_LIMIT })
}

export async function getGraphNodeDetail(nodeId: string) {
	if (useMock) {
		const node = mockGraph.nodes.find(item => item.id === nodeId)
		return node ? normalizeGraphNode(node) : undefined
	}
	const response = await api.get(
		API_ENDPOINTS.KNOWLEDGE.INGREDIENT(encodeURIComponent(nodeId)),
	)
	return normalizeGraphNode(response.data)
}
