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

it('guides a user from a source-food search to readable, honest composition details', async () => {
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
		screen.getByRole('region', { name: 'FooDB food record explorer' }),
	).toBeInTheDocument()
	expect(
		screen.queryByRole('button', { name: 'Legacy knowledge graph' }),
	).toBeNull()
	expect(screen.queryByTestId('graph-content')).not.toBeInTheDocument()

	fireEvent.change(
		screen.getByRole('textbox', { name: 'Search FooDB foods' }),
		{
			target: { value: 'Apple' },
		},
	)
	const result = await screen.findByRole('button', {
		name: /Apple.*View record/,
	})
	fireEvent.click(result)

	await waitFor(() =>
		expect(screen.getByText('Source compound')).toBeInTheDocument(),
	)
	expect(screen.getByText('Recorded present')).toBeInTheDocument()
	expect(screen.getByText('Recorded compound links')).toBeInTheDocument()
	expect(
		screen.getByText(
			/does not tell you how much is present or what it means for cooking/i,
		),
	).toBeInTheDocument()
	expect(screen.getByText(/Missing links are unknown/)).toBeInTheDocument()
	expect(screen.queryByText('foodb:1.0:food-id:42')).not.toBeInTheDocument()
	fireEvent.click(screen.getByRole('button', { name: 'Show source IDs' }))
	expect(screen.getByText('foodb:1.0:food-id:42')).toBeInTheDocument()
	expect(getProductFoodComposition).toHaveBeenCalledWith('42')
})

it('filters the selected source record list and reveals long lists progressively', async () => {
	const compounds = Array.from({ length: 14 }, (_, index) => ({
		id: `foodb:1.0:compound-id:${index + 1}`,
		name: index === 13 ? 'Unique filtered compound' : `Compound ${index + 1}`,
		predicate: 'has_compound' as const,
		presence: 'PRESENT' as const,
		contentRowSupport: 8,
		exportEligibleSupport: 8,
	}))
	jest.mocked(searchProductFoods).mockResolvedValue({
		provenance,
		foods: [{ foodId: '42', name: 'Apple' }],
	})
	jest.mocked(getProductFoodComposition).mockResolvedValue({
		status: 'AVAILABLE',
		provenance,
		food: { id: 'foodb:1.0:food-id:42', name: 'Apple', type: 'Food' },
		compounds,
		filteredKnownRelationCount: 4,
	})

	render(<GraphExplorer />)
	fireEvent.change(
		screen.getByRole('textbox', { name: 'Search FooDB foods' }),
		{
			target: { value: 'Apple' },
		},
	)
	fireEvent.click(
		await screen.findByRole('button', { name: /Apple.*View record/ }),
	)

	await screen.findByText('Compound 1')
	expect(screen.queryByText('Compound 13')).not.toBeInTheDocument()
	expect(
		screen.getByRole('button', { name: 'Show 2 more' }),
	).toBeInTheDocument()
	expect(
		screen.getByText(/4 additional source-present relation\(s\) were withheld/),
	).toBeInTheDocument()
	fireEvent.change(
		screen.getByRole('searchbox', { name: 'Filter recorded compound names' }),
		{
			target: { value: 'Unique filtered' },
		},
	)
	expect(screen.getByText('Unique filtered compound')).toBeInTheDocument()
	expect(screen.getByText(/1 of 14 listed compounds match/)).toBeInTheDocument()
	fireEvent.change(
		screen.getByRole('searchbox', { name: 'Filter recorded compound names' }),
		{
			target: { value: 'not listed' },
		},
	)
	expect(
		screen.getByText(/this does not show absence from FooDB/i),
	).toBeInTheDocument()
})

it('explains that sign-in is required when the protected product search returns 401', async () => {
	jest
		.mocked(searchProductFoods)
		.mockRejectedValue({ response: { status: 401 } })

	render(<GraphExplorer />)
	fireEvent.change(
		screen.getByRole('textbox', { name: 'Search FooDB foods' }),
		{
			target: { value: 'Apple' },
		},
	)

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
	fireEvent.change(
		screen.getByRole('textbox', { name: 'Search FooDB foods' }),
		{
			target: { value: 'Apple' },
		},
	)

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
	fireEvent.change(
		screen.getByRole('textbox', { name: 'Search FooDB foods' }),
		{
			target: { value: 'Apple' },
		},
	)
	fireEvent.click(
		await screen.findByRole('button', { name: /Apple.*View record/ }),
	)

	expect(
		await screen.findByText(/outside the pinned graph scope/i),
	).toBeInTheDocument()
	expect(screen.getByRole('status')).toHaveTextContent(/unknown here/i)
})
