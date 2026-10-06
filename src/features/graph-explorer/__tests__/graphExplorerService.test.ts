import {
	getGraphCompoundOverlap,
	getGraphData,
	getGraphNodeDetail,
	mergeGraphData,
	normalizeGraphData,
} from '../services/graphExplorerService'
import { aiApi, api } from '@/lib/axios'

jest.mock('@/lib/axios', () => ({
	api: { get: jest.fn() },
	aiApi: { get: jest.fn(), post: jest.fn() },
}))

beforeEach(() => jest.clearAllMocks())

describe('graph explorer data contract', () => {
	it('normalizes leader graph exports into the UI detail contract', () => {
		const graph = normalizeGraphData(
			{
				total_node_count: 16077,
				has_more: true,
				nodes: [
					{
						canonical_name: 'butter',
						name: 'Butter',
						category: 'fat',
						allergen_flags: ['milk'],
						compound_data: {
							primary_compounds: [
								{ name: 'butyric acid', concentration: 2.4, unit: 'mg/kg' },
							],
							flavor_profile: 'rich, creamy',
						},
						nutritionalSnapshot: { calories: 717, protein_g: 0.9 },
					},
					{ id: 'coconut-oil', name: 'Coconut Oil', category: 'fat' },
				],
				edges: [
					{
						source: 'butter',
						target: 'coconut-oil',
						type: 'substitution',
						confidence: 0.91,
						compound_overlap: 0.73,
						cook_validation_count: 42,
						technique_context: {
							works_for: ['baking'],
							not_recommended_for: ['frying'],
						},
					},
				],
			},
			'leader-api',
			{ rootId: 'butter' },
		)

		expect(graph.source).toBe('leader-api')
		expect(graph.totalNodeCount).toBe(16077)
		expect(graph.hasMore).toBe(true)
		expect(graph.nodes[0]).toMatchObject({
			id: 'butter',
			allergenFlags: ['milk'],
			nutrition: { calories: 717, proteinGrams: 0.9 },
		})
		expect(graph.nodes[0].compoundData?.primaryCompounds[0]).toEqual({
			name: 'butyric acid',
			concentration: 2.4,
			unit: 'mg/kg',
		})
		expect(graph.edges[0]).toMatchObject({
			compoundOverlap: 0.73,
			cookValidationCount: 42,
			techniqueContext: {
				worksFor: ['baking'],
				notRecommendedFor: ['frying'],
			},
		})
	})

	it('normalizes the numeric ids and edge labels from the verified Lead sample', () => {
		const graph = normalizeGraphData(
			{
				nodes: [
					{ id: 4, name: 'acai' },
					{ id: 5, name: 'acerola' },
				],
				edges: [{ source: 4, target: 5, type: 'substitutes', confidence: 0.8 }],
			},
			'leader-sample',
		)

		expect(graph.nodes.map(node => node.id)).toEqual(['4', '5'])
		expect(graph.edges[0]).toMatchObject({
			source: '4',
			target: '5',
			type: 'substitution',
		})
	})

	it('merges neighborhood pages without duplicate nodes or edges', () => {
		const base = normalizeGraphData(
			{
				nodes: [{ id: 'butter', name: 'Butter', category: 'fat' }],
				edges: [],
			},
			'leader-api',
		)
		const neighborhood = normalizeGraphData(
			{
				nodes: [
					{
						id: 'butter',
						name: 'Butter',
						category: 'fat',
						detailStatus: 'complete',
					},
					{ id: 'coconut-oil', name: 'Coconut Oil', category: 'fat' },
				],
				edges: [
					{
						source: 'butter',
						target: 'coconut-oil',
						type: 'substitution',
						confidence: 0.9,
					},
				],
			},
			'leader-api',
			{ rootId: 'butter' },
		)

		const merged = mergeGraphData(base, neighborhood)
		expect(merged.nodes).toHaveLength(2)
		expect(merged.nodes.find(node => node.id === 'butter')?.detailStatus).toBe(
			'complete',
		)
		expect(merged.edges).toHaveLength(1)
		expect(merged.loadedRootId).toBe('butter')
	})

	it('preserves the global hasMore flag after loading a neighborhood', () => {
		const base = normalizeGraphData(
			{ nodes: [{ id: 'butter', name: 'Butter' }], edges: [], hasMore: true },
			'leader-api',
		)
		const neighborhood = normalizeGraphData(
			{ nodes: [{ id: 'butter', name: 'Butter' }], edges: [], hasMore: false },
			'leader-api',
		)
		expect(mergeGraphData(base, neighborhood).hasMore).toBe(true)
	})

	it('keeps the focused neighborhood inside the 500-node render limit', () => {
		const base = normalizeGraphData(
			{
				nodes: Array.from({ length: 500 }, (_, index) => ({
					id: `ingredient-${index}`,
					name: `Ingredient ${index}`,
				})),
				edges: [
					{
						source: 'ingredient-0',
						target: 'ingredient-1',
						type: 'substitution',
					},
				],
			},
			'leader-api',
		)
		const addition = normalizeGraphData(
			{
				nodes: [
					{ id: 'ingredient-0', name: 'Ingredient 0' },
					{ id: 'new', name: 'New Ingredient' },
				],
				edges: [
					{ source: 'ingredient-0', target: 'new', type: 'substitution' },
				],
			},
			'leader-api',
		)

		const merged = mergeGraphData(base, addition)
		expect(merged.nodes).toHaveLength(500)
		expect(merged.nodes.map(node => node.id)).toContain('ingredient-0')
		expect(merged.nodes.map(node => node.id)).toContain('new')
		expect(merged.edges).toHaveLength(1)
		expect(merged.edges[0].target).toBe('new')
		expect(merged.hasMore).toBe(true)
	})

	it('bounds a large API response before it reaches the force layout', () => {
		const graph = normalizeGraphData(
			{
				totalNodeCount: 16077,
				nodes: [
					{ id: 'root', name: 'Root', category: 'ingredient' },
					{ id: 'one', name: 'One', category: 'ingredient' },
					{ id: 'two', name: 'Two', category: 'ingredient' },
				],
				edges: [
					{
						source: 'root',
						target: 'one',
						type: 'substitution',
						confidence: 0.8,
					},
					{
						source: 'root',
						target: 'two',
						type: 'substitution',
						confidence: 0.7,
					},
				],
			},
			'leader-api',
			{ rootId: 'root', limit: 2 },
		)

		expect(graph.nodes.map(node => node.id)).toEqual(['root', 'one'])
		expect(graph.edges).toHaveLength(1)
		expect(graph.totalNodeCount).toBe(16077)
		expect(graph.hasMore).toBe(true)
	})

	it('does not display out-of-range edge scores as confidence or overlap', () => {
		const graph = normalizeGraphData(
			{
				nodes: [
					{ id: 'a', name: 'A' },
					{ id: 'b', name: 'B' },
				],
				edges: [
					{ source: 'a', target: 'b', confidence: 2, compoundOverlap: -1 },
				],
			},
			'leader-api',
		)
		expect(graph.edges[0].confidence).toBeUndefined()
		expect(graph.edges[0].compoundOverlap).toBeUndefined()
	})
})

describe('live graph API', () => {
	it('sends a bounded remote search and unwraps the graph response', async () => {
		;(api.get as jest.Mock).mockResolvedValue({
			data: {
				data: {
					nodes: [{ id: 'peanut', name: 'Peanut' }],
					edges: [],
					totalNodeCount: 24,
					hasMore: true,
				},
			},
		})

		const result = await getGraphData({ query: 'pea', depth: 0, limit: 20 })

		expect(api.get).toHaveBeenCalledWith(
			expect.stringContaining('/knowledge/graph'),
			{ params: { root: undefined, q: 'pea', depth: 0, limit: 20 } },
		)
		expect(result.nodes[0].id).toBe('peanut')
		expect(result.totalNodeCount).toBe(24)
	})

	it('loads real ingredient details and only grounded official compounds', async () => {
		;(api.get as jest.Mock).mockResolvedValue({
			data: {
				data: {
					id: 'mongo-document-id',
					canonicalName: 'butter',
					name: 'Butter',
					allergenFlags: ['milk'],
				},
			},
		})
		;(aiApi.get as jest.Mock).mockResolvedValue({
			data: {
				success: true,
				data: { is_grounded: true, compounds: [{ name: 'butyric acid' }] },
			},
		})

		const node = await getGraphNodeDetail('butter')

		expect(node).toMatchObject({
			id: 'butter',
			allergenFlags: ['milk'],
			compoundData: {
				primaryCompounds: ['butyric acid'],
				source: 'FooDB official presence profile',
			},
		})
		expect(aiApi.get).toHaveBeenCalledWith('/api/v1/compound/profile/butter')
	})

	it('keeps ingredient detail when official compounds are unavailable', async () => {
		;(api.get as jest.Mock).mockResolvedValue({
			data: { data: { canonicalName: 'butter', name: 'Butter' } },
		})
		;(aiApi.get as jest.Mock).mockRejectedValue(
			new Error('index not installed'),
		)

		const node = await getGraphNodeDetail('butter')

		expect(node?.id).toBe('butter')
		expect(node?.compoundData).toBeUndefined()
	})

	it('does not request compounds for an ingredient the knowledge API did not find', async () => {
		;(api.get as jest.Mock).mockResolvedValue({
			data: { success: false, data: null },
		})
		expect(await getGraphNodeDetail('missing')).toBeUndefined()
		expect(aiApi.get).not.toHaveBeenCalled()
	})

	it('accepts only grounded pair overlap with a valid fraction', async () => {
		;(aiApi.post as jest.Mock)
			.mockResolvedValueOnce({
				data: {
					success: true,
					data: {
						is_compound_grounded: true,
						overlap_percentage: 0.42,
						overlap_semantics: 'Jaccard of official presence profiles',
					},
				},
			})
			.mockResolvedValueOnce({
				data: { is_compound_grounded: false, overlap_percentage: 0 },
			})
			.mockResolvedValueOnce({
				data: { is_compound_grounded: true, overlap_percentage: 2 },
			})

		expect(await getGraphCompoundOverlap('Butter', 'Coconut Oil')).toEqual({
			compoundOverlap: 0.42,
			compoundOverlapSemantics: 'Jaccard of official presence profiles',
		})
		expect(aiApi.post).toHaveBeenCalledWith('/api/v1/compound/analyze-pair', {
			original: 'Butter',
			substitute: 'Coconut Oil',
		})
		expect(await getGraphCompoundOverlap('Butter', 'Unknown')).toBeUndefined()
		expect(await getGraphCompoundOverlap('Butter', 'Invalid')).toBeUndefined()
	})
})
