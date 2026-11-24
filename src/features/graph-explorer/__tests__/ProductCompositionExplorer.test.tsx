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
	scope: 'Top-255 profile scope; export-eligible edges only',
	interpretation:
		'Missing relations are unknown; presence is not quantity or substitution evidence.',
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
	expect(
		screen.getByRole('region', { name: 'FooDB food composition graph' }),
	).toBeInTheDocument()
	expect(
		screen.queryByRole('button', { name: 'Legacy knowledge graph' }),
	).toBeNull()
	expect(screen.queryByTestId('graph-content')).not.toBeInTheDocument()

	fireEvent.change(screen.getByRole('textbox', { name: 'Find a FooDB food' }), {
		target: { value: 'Apple' },
	})
	const result = await screen.findByRole('button', {
		name: /Apple.*FooDB Food 42/,
	})
	fireEvent.click(result)

	await waitFor(() =>
		expect(screen.getByText('Source compound')).toBeInTheDocument(),
	)
	expect(screen.getByText('→ compound present')).toBeInTheDocument()
	expect(screen.getByText(/Missing edges are unknown/)).toBeInTheDocument()
	expect(getProductFoodComposition).toHaveBeenCalledWith('42')
})

it('explains that sign-in is required when the protected product search returns 401', async () => {
	jest
		.mocked(searchProductFoods)
		.mockRejectedValue({ response: { status: 401 } })

	render(<GraphExplorer />)
	fireEvent.change(screen.getByRole('textbox', { name: 'Find a FooDB food' }), {
		target: { value: 'Apple' },
	})

	const alert = await screen.findByRole('alert')
	expect(alert).toHaveTextContent(
		'Sign in to search the pinned FooDB product data.',
	)
	expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
		'href',
		'/auth/sign-in?returnTo=%2Fexplore%2Fgraph',
	)
	expect(alert).not.toHaveTextContent('temporarily unavailable')
})

it('keeps access denial distinct from authentication and service failures', async () => {
	jest
		.mocked(searchProductFoods)
		.mockRejectedValue({ response: { status: 403 } })

	render(<GraphExplorer />)
	fireEvent.change(screen.getByRole('textbox', { name: 'Find a FooDB food' }), {
		target: { value: 'Apple' },
	})

	expect(await screen.findByRole('alert')).toHaveTextContent(
		'This account cannot access the pinned FooDB product data.',
	)
	expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
})

it('explains an out-of-scope selection instead of leaving a dead-looking result area', async () => {
	jest.mocked(searchProductFoods).mockResolvedValue({
		provenance,
		foods: [{ foodId: '42', name: 'Apple' }],
	})
	jest.mocked(getProductFoodComposition).mockResolvedValue({
		status: 'UNKNOWN_OR_OUT_OF_SCOPE',
		provenance,
		food: null,
		compounds: [],
		filteredKnownRelationCount: 0,
	})
	render(<GraphExplorer />)
	fireEvent.change(screen.getByRole('textbox', { name: 'Find a FooDB food' }), {
		target: { value: 'Apple' },
	})
	fireEvent.click(
		await screen.findByRole('button', { name: /Apple.*FooDB Food 42/ }),
	)

	expect(
		await screen.findByText(/outside the pinned graph scope/i),
	).toBeInTheDocument()
	expect(screen.getByRole('status')).toHaveTextContent(/unknown here/i)
})
