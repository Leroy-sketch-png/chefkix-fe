import { api } from '@/lib/axios'
import {
	getProductFoodComposition,
	PRODUCT_GRAPH_EDGES_SHA256,
	PRODUCT_GRAPH_MANIFEST_SHA256,
	PRODUCT_GRAPH_NODES_SHA256,
	searchProductFoods,
} from '../services/productGraphService'

jest.mock('@/lib/axios', () => ({
	api: { get: jest.fn() },
	aiApi: { get: jest.fn(), post: jest.fn() },
}))

const provenance = {
	manifestSha256: PRODUCT_GRAPH_MANIFEST_SHA256,
	nodesSha256: PRODUCT_GRAPH_NODES_SHA256,
	edgesSha256: PRODUCT_GRAPH_EDGES_SHA256,
	source: 'FooDB 1.0',
	releaseDate: '2020-04-07',
	license: 'CC BY-NC 4.0',
	scope: 'selected profile subset',
	interpretation: 'presence only',
}

beforeEach(() => jest.clearAllMocks())

it('uses the product-only endpoint and verifies pinned search provenance', async () => {
	jest.mocked(api.get).mockResolvedValue({
		data: { success: true, data: { provenance, foods: [{ foodId: '42', name: 'Apple' }] } },
	})

	await expect(searchProductFoods('apple')).resolves.toEqual({
		provenance,
		foods: [{ foodId: '42', name: 'Apple' }],
	})
	expect(api.get).toHaveBeenCalledWith('/knowledge/product/foods', {
		params: { q: 'apple', limit: 10 },
	})
})

it('rejects a response from a different manifest instead of accepting a graph substitute', async () => {
	jest.mocked(api.get).mockResolvedValue({
		data: {
			success: true,
			data: { provenance: { ...provenance, manifestSha256: '0'.repeat(64) }, foods: [] },
		},
	})

	await expect(searchProductFoods('apple')).rejects.toThrow(
		'did not match its pinned source manifest',
	)
})

it('keeps filtered or missing relations explicitly unknown', async () => {
	jest.mocked(api.get).mockResolvedValue({
		data: {
			success: true,
			data: {
				status: 'NO_ELIGIBLE_RELATION_UNKNOWN',
				provenance,
				food: { id: 'foodb:1.0:food-id:42', name: 'Apple', type: 'Food' },
				compounds: [],
				filteredKnownRelationCount: 3,
			},
		},
	})

	await expect(getProductFoodComposition('42')).resolves.toMatchObject({
		status: 'NO_ELIGIBLE_RELATION_UNKNOWN',
		filteredKnownRelationCount: 3,
		compounds: [],
	})
	expect(api.get).toHaveBeenCalledWith('/knowledge/product/foods/42/compounds')
})
