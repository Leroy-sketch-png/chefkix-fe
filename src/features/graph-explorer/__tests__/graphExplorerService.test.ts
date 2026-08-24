import {
	mergeGraphData,
	normalizeGraphData,
} from '../services/graphExplorerService'

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
})
