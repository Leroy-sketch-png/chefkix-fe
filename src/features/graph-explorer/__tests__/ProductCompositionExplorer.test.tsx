import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GraphExplorer } from '../components/GraphExplorer'
import {
	getProductFoodComposition,
	searchProductFoods,
	PRODUCT_GRAPH_EDGES_SHA256,
	PRODUCT_GRAPH_MANIFEST_SHA256,
	PRODUCT_GRAPH_NODES_SHA256,
} from '../services/productGraphService'

jest.mock('../services/productGraphService', () => ({
	...jest.requireActual('../services/productGraphService'),
	searchProductFoods: jest.fn(),
	getProductFoodComposition: jest.fn(),
}))
jest.mock('../components/GraphCanvas', () => ({
	GraphCanvas: () => <div data-testid='legacy-graph-canvas' />,
}))

const provenance = {
	manifestSha256: PRODUCT_GRAPH_MANIFEST_SHA256,
	nodesSha256: PRODUCT_GRAPH_NODES_SHA256,
	edgesSha256: PRODUCT_GRAPH_EDGES_SHA256,
	source: 'FooDB 1.0' as const,
	releaseDate: '2020-04-07' as const,
	license: 'CC BY-NC 4.0' as const,
	scope: 'selected profile subset',
	interpretation: 'presence only',
}

beforeEach(() => jest.clearAllMocks())

it('makes pinned product composition the default and shows only typed source relations', async () => {
	jest.mocked(searchProductFoods).mockResolvedValue({
		provenance,
		foods: [{ foodId: '42', name: 'Apple' }],
	})
	jest.mocked(getProductFoodComposition).mockResolvedValue({
		status: 'AVAILABLE',
		provenance,
		food: { id: 'foodb:1.0:food-id:42', name: 'Apple', type: 'Food' },
		compounds: [
			{
				id: 'foodb:1.0:compound-id:9',
				name: 'Source compound',
				predicate: 'has_compound',
				presence: 'PRESENT',
				contentRowSupport: 8,
				exportEligibleSupport: 8,
			},
		],
		filteredKnownRelationCount: 0,
	})

	render(<GraphExplorer />)
	expect(screen.getByRole('heading', { name: 'Food composition map' })).toBeInTheDocument()
	expect(screen.getByRole('button', { name: 'Legacy knowledge graph' })).toBeInTheDocument()
	expect(screen.queryByTestId('graph-content')).not.toBeInTheDocument()

	fireEvent.change(screen.getByRole('textbox', { name: 'Find a FooDB food' }), {
		target: { value: 'Apple' },
	})
	const result = await screen.findByRole('button', { name: /Apple.*FooDB Food 42/ })
	fireEvent.click(result)

	await waitFor(() =>
		expect(screen.getByText('Source compound')).toBeInTheDocument(),
	)
	expect(screen.getByText('→ compound present')).toBeInTheDocument()
	expect(screen.getByText(/Missing edges are unknown/)).toBeInTheDocument()
	expect(getProductFoodComposition).toHaveBeenCalledWith('42')
})
