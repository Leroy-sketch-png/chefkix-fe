import { aiApi, api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import { mockGraph } from '../data/mockGraph'
import type {
	CompoundMolecule,
	GraphData,
	GraphEdge,
	GraphEvidenceResponse,
	GraphNode,
	NutritionSnapshot,
	TechniqueContext,
} from '../types'

const SAMPLE_LIMIT = 100
const RENDER_LIMIT = 500

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
	if (typeof value === 'string') return value
	if (typeof value === 'number' && Number.isFinite(value)) return String(value)
	return fallback
}

function asNumber(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asFraction(value: unknown) {
	const number = asNumber(value)
	return number !== undefined && number >= 0 && number <= 1 ? number : undefined
}

function asStringArray(value: unknown) {
	return Array.isArray(value)
		? value.filter(item => typeof item === 'string')
		: []
}

const SHA256 = /^[a-f\d]{64}$/i
const GRAPH_EVIDENCE_STATUSES = new Set(['AVAILABLE', 'UNAVAILABLE', 'REFUSED'])
const IDENTITY_STATUSES = new Set(['RESOLVED', 'UNKNOWN', 'AMBIGUOUS'])
const CALIBRATION_STATUSES = new Set([
	'ok',
	'uninformative',
	'vacuous',
	'no_guarantee',
	'abstain',
])
const ARTIFACT_INTEGRITY_STATUSES = new Set([
	'VERIFIED',
	'MISSING',
	'INVALID',
	'UNVERIFIED',
])

export function isGraphEvidenceEnabled() {
	return process.env.NEXT_PUBLIC_GRAPH_EVIDENCE_ENABLED === 'true'
}

export function normalizeGraphEvidence(value: unknown): GraphEvidenceResponse {
	const response = unwrapData(value)
	if (
		!isRecord(response) ||
		response.contractVersion !== 'graph-evidence.v1' ||
		typeof response.status !== 'string' ||
		!GRAPH_EVIDENCE_STATUSES.has(response.status)
	) {
		throw new Error('The graph evidence response is invalid.')
	}

	let artifactIntegrity: GraphEvidenceResponse['artifactIntegrity']
	if (response.artifactIntegrity !== undefined) {
		const integrity = response.artifactIntegrity
		if (
			!isRecord(integrity) ||
			typeof integrity.status !== 'string' ||
			!ARTIFACT_INTEGRITY_STATUSES.has(integrity.status)
		) {
			throw new Error('The graph evidence integrity record is invalid.')
		}
		const expectedSha256 = asString(integrity.expectedSha256) || undefined
		const observedSha256 = asString(integrity.observedSha256) || undefined
		if (
			integrity.status === 'VERIFIED' &&
			(!expectedSha256 ||
				!observedSha256 ||
				!SHA256.test(expectedSha256) ||
				!SHA256.test(observedSha256) ||
				expectedSha256.toLowerCase() !== observedSha256.toLowerCase())
		) {
			throw new Error('The graph evidence artifact fingerprint is invalid.')
		}
		artifactIntegrity = {
			status: integrity.status as NonNullable<
				GraphEvidenceResponse['artifactIntegrity']
			>['status'],
			expectedSha256:
				expectedSha256 && SHA256.test(expectedSha256)
					? expectedSha256
					: undefined,
			observedSha256:
				observedSha256 && SHA256.test(observedSha256)
					? observedSha256
					: undefined,
		}
	}

	const evidenceValue = isRecord(response.evidence)
		? response.evidence
		: undefined
	const identity = isRecord(evidenceValue?.identityResolution)
		? evidenceValue.identityResolution
		: undefined
	const trainPair = isRecord(evidenceValue?.trainPairEvidence)
		? evidenceValue.trainPairEvidence
		: undefined
	const calibration = isRecord(evidenceValue?.calibration)
		? evidenceValue.calibration
		: undefined
	const decision = isRecord(evidenceValue?.decision)
		? evidenceValue.decision
		: undefined
	const requestedSourceIngredientId =
		asString(identity?.requestedSourceIngredientId) || undefined
	const sourceIngredientId = asString(identity?.sourceIngredientId) || undefined
	const requestedCandidateIngredientId =
		asString(identity?.requestedCandidateIngredientId) || undefined
	const candidateIngredientId =
		asString(identity?.candidateIngredientId) || undefined
	const evidence = evidenceValue
		? {
				identityResolution:
					identity &&
					typeof identity.status === 'string' &&
					IDENTITY_STATUSES.has(identity.status)
						? {
								status: identity.status as 'RESOLVED' | 'UNKNOWN' | 'AMBIGUOUS',
								requestedSourceIngredientId,
								sourceIngredientId,
								requestedCandidateIngredientId,
								candidateIngredientId,
							}
						: undefined,
				trainPairEvidence: trainPair
					? {
							seenInTrain:
								typeof trainPair.seenInTrain === 'boolean'
									? trainPair.seenInTrain
									: null,
							trainCount:
								typeof trainPair.trainCount === 'number' &&
								Number.isSafeInteger(trainPair.trainCount) &&
								trainPair.trainCount >= 0
									? trainPair.trainCount
									: null,
							unit: asString(trainPair.unit) || undefined,
						}
					: undefined,
				calibration: calibration
					? { status: asString(calibration.status) || undefined }
					: undefined,
				decision:
					decision?.decision === 'ABSTAIN'
						? { decision: 'ABSTAIN' as const }
						: undefined,
			}
		: undefined
	const identityStatus = evidence?.identityResolution?.status
	const identityResolution = evidence?.identityResolution
	const seenInTrain = evidence?.trainPairEvidence?.seenInTrain
	const trainCount = evidence?.trainPairEvidence?.trainCount
	const calibrationStatus = evidence?.calibration?.status

	if (
		response.status === 'AVAILABLE' &&
		(artifactIntegrity?.status !== 'VERIFIED' ||
			identityStatus !== 'RESOLVED' ||
			!identityResolution?.requestedSourceIngredientId ||
			identityResolution.sourceIngredientId !==
				identityResolution.requestedSourceIngredientId ||
			!identityResolution.requestedCandidateIngredientId ||
			identityResolution.candidateIngredientId !==
				identityResolution.requestedCandidateIngredientId ||
			seenInTrain === null ||
			seenInTrain === undefined ||
			trainCount === null ||
			trainCount === undefined ||
			seenInTrain !== trainCount > 0 ||
			!calibrationStatus ||
			!CALIBRATION_STATUSES.has(calibrationStatus) ||
			evidence?.decision?.decision !== 'ABSTAIN')
	) {
		throw new Error('The available graph evidence response is incomplete.')
	}
	if (
		response.status === 'REFUSED' &&
		(!artifactIntegrity || artifactIntegrity.status === 'VERIFIED')
	) {
		throw new Error('The refused graph artifact has no valid integrity state.')
	}
	const unavailableReason = asString(response.unavailableReason) || undefined
	if (response.status === 'UNAVAILABLE' && !unavailableReason) {
		throw new Error('The unavailable graph evidence response has no reason.')
	}

	return {
		contractVersion: 'graph-evidence.v1',
		status: response.status as GraphEvidenceResponse['status'],
		unavailableReason,
		artifactIntegrity,
		evidence,
	}
}

function errorResponseData(error: unknown): unknown {
	if (!isRecord(error) || !isRecord(error.response)) return undefined
	return error.response.data
}

export async function getGraphEvidence(
	sourceIngredientId: string,
	candidateIngredientId: string,
): Promise<GraphEvidenceResponse | undefined> {
	if (!isGraphEvidenceEnabled()) return undefined

	let payload: unknown
	try {
		const response = await api.get(API_ENDPOINTS.KNOWLEDGE.GRAPH_EVIDENCE, {
			params: { sourceIngredientId, candidateIngredientId },
		})
		payload = response.data ?? response
	} catch (error) {
		payload = errorResponseData(error)
		if (payload === undefined) {
			throw error instanceof Error
				? error
				: new Error('Graph evidence could not be reached.')
		}
	}
	const normalized = normalizeGraphEvidence(payload)
	if (
		normalized.status === 'AVAILABLE' &&
		(normalized.evidence?.identityResolution?.requestedSourceIngredientId !==
			sourceIngredientId ||
			normalized.evidence?.identityResolution
				?.requestedCandidateIngredientId !== candidateIngredientId)
	) {
		throw new Error(
			'The graph evidence response does not match the requested ingredient pair.',
		)
	}
	return normalized
}

function normalizeEdgeType(value: unknown): GraphEdge['type'] {
	const type = asString(value).toLowerCase()
	if (type === 'chemical_similarity' || type === 'chemical-similarity') {
		return 'chemical_similarity'
	}
	if (type === 'co_occurrence' || type === 'co-occurrence') {
		return 'co_occurrence'
	}
	return 'substitution'
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
		id: asString(node.canonicalName ?? node.canonical_name ?? node.id),
		name: asString(node.name ?? node.canonicalName ?? node.canonical_name),
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
		? asString(edge.source.id ?? edge.source.canonicalName)
		: asString(edge.source)
	const target = isRecord(edge.target)
		? asString(edge.target.id ?? edge.target.canonicalName)
		: asString(edge.target)
	const comparison = isRecord(edge.nutritionalComparison)
		? edge.nutritionalComparison
		: isRecord(edge.nutritional_comparison)
			? edge.nutritional_comparison
			: undefined
	return {
		source,
		target,
		type: normalizeEdgeType(edge.type),
		confidence: asFraction(edge.confidence),
		substitutionRatio: asNumber(edge.substitutionRatio),
		context: asString(edge.context) || undefined,
		compoundOverlap: asFraction(edge.compoundOverlap ?? edge.compound_overlap),
		compoundOverlapSemantics:
			asString(edge.compoundOverlapSemantics ?? edge.overlap_semantics) ||
			undefined,
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
		nodes.delete(node.id)
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
	// ponytail: Keep the latest 500 nodes in the force layout; add paging if a larger view is needed.
	const boundedNodes = [...nodes.values()].slice(-RENDER_LIMIT)
	const visibleIds = new Set(boundedNodes.map(node => node.id))
	return {
		nodes: boundedNodes,
		edges: [...edges.values()].filter(
			edge => visibleIds.has(edge.source) && visibleIds.has(edge.target),
		),
		source: addition.source ?? base.source,
		totalNodeCount: Math.max(
			base.totalNodeCount ?? 0,
			addition.totalNodeCount ?? 0,
		),
		hasMore: Boolean(
			base.hasMore || addition.hasMore || nodes.size > RENDER_LIMIT,
		),
		loadedRootId: addition.loadedRootId ?? base.loadedRootId,
	}
}

const useMock = process.env.NEXT_PUBLIC_GRAPH_EXPLORER_MOCK === 'true'

function scopeGraphData(graph: GraphData, query?: GraphQuery): GraphData {
	const bounded = normalizeGraphData(
		graph,
		graph.source ?? 'leader-sample',
		query,
	)
	if (!query?.rootId) return bounded

	const rootId = String(query.rootId)
	const connectedIds = new Set([rootId])
	bounded.edges.forEach(edge => {
		if (edge.source === rootId) connectedIds.add(edge.target)
		if (edge.target === rootId) connectedIds.add(edge.source)
	})
	return {
		...bounded,
		nodes: bounded.nodes.filter(node => connectedIds.has(node.id)),
		edges: bounded.edges.filter(
			edge => connectedIds.has(edge.source) && connectedIds.has(edge.target),
		),
		loadedRootId: rootId,
	}
}

function getMockData(query?: GraphQuery): GraphData {
	return scopeGraphData(normalizeGraphData(mockGraph, 'local-sample'), query)
}

export async function getGraphData(query?: GraphQuery): Promise<GraphData> {
	if (useMock) return getMockData(query)
	try {
		const response = await api.get(API_ENDPOINTS.KNOWLEDGE.GRAPH, {
			params: {
				root: query?.rootId,
				q: query?.query,
				depth: query?.depth ?? 1,
				limit: query?.limit ?? SAMPLE_LIMIT,
			},
		})
		return normalizeGraphData(response.data, 'leader-api', query)
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error('The Leader graph API could not be reached.')
	}
}

export function getGraphNeighborhood(nodeId: string) {
	return getGraphData({ rootId: nodeId, depth: 1, limit: SAMPLE_LIMIT })
}

export async function getGraphNodeDetail(nodeId: string) {
	if (useMock) {
		const node = mockGraph.nodes.find(item => item.id === nodeId)
		return node ? normalizeGraphNode(node) : undefined
	}
	try {
		const response = await api.get(
			API_ENDPOINTS.KNOWLEDGE.INGREDIENT(encodeURIComponent(nodeId)),
		)
		const node = {
			...normalizeGraphNode(unwrapData(response.data)),
			detailStatus: 'complete' as const,
		}
		if (!node.id) return undefined
		try {
			const profile = await aiApi.get(
				`/api/v1/compound/profile/${encodeURIComponent(node.id)}`,
			)
			const result = unwrapData(profile.data)
			if (!isRecord(result)) return node
			if (result?.is_grounded !== true || !Array.isArray(result.compounds)) {
				return node
			}
			const compounds = result.compounds
				.map((compound: unknown) =>
					isRecord(compound) ? asString(compound.name) : '',
				)
				.filter(Boolean)
				.slice(0, 5)
			return compounds.length
				? {
						...node,
						compoundData: {
							primaryCompounds: compounds,
							flavorProfile: '',
							source: 'FooDB official presence profile',
						},
						detailStatus: 'complete' as const,
					}
				: node
		} catch {
			return node
		}
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error('The Leader ingredient detail API could not be reached.')
	}
}

export async function getGraphCompoundOverlap(
	original: string,
	substitute: string,
) {
	const response = await aiApi.post('/api/v1/compound/analyze-pair', {
		original,
		substitute,
	})
	const result = unwrapData(response.data)
	if (!isRecord(result)) return undefined
	const overlap = asFraction(result?.overlap_percentage)
	if (result?.is_compound_grounded !== true || overlap === undefined) {
		return undefined
	}
	return {
		compoundOverlap: overlap,
		compoundOverlapSemantics: asString(result.overlap_semantics) || undefined,
	}
}
