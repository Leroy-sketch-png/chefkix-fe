import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GraphExplorer } from '../components/GraphExplorer'
import {
	getGraphCompoundOverlap,
	getGraphData,
	getGraphEvidence,
	getGraphEvidenceSnapshot,
} from '../services/graphExplorerService'
import type { GraphData, GraphEvidenceLoadState } from '../types'

jest.mock('../components/GraphCanvas', () => ({
	GraphCanvas: ({
		data,
		onEdgeSelect,
		graphEvidence,
	}: {
		data: GraphData
		onEdgeSelect?: (edge: GraphData['edges'][number]) => void
		graphEvidence?: GraphEvidenceLoadState
	}) => (
		<div data-testid='graph-content'>
			{data.nodes.map(node => node.id).join(',')}|
			{data.edges[0]?.compoundOverlap ?? 'pending'}|
			{graphEvidence?.state === 'loaded'
				? `${graphEvidence.response.status}:${graphEvidence.response.evidence?.decision?.decision ?? ''}`
				: (graphEvidence?.state ?? 'evidence-off')}
			<button
				type='button'
				onClick={() => data.edges[0] && onEdgeSelect?.(data.edges[0])}
			>
				Load compound overlap
			</button>
		</div>
	),
}))
jest.mock('../services/graphExplorerService', () => ({
	...jest.requireActual('../services/graphExplorerService'),
	getGraphData: jest.fn(),
	getGraphNeighborhood: jest.fn(),
	getGraphNodeDetail: jest.fn(),
	getGraphCompoundOverlap: jest.fn(),
	getGraphEvidence: jest.fn(),
	getGraphEvidenceSnapshot: jest.fn(),
}))

const base: GraphData = {
	nodes: [{ id: 'butter', name: 'Butter', category: 'fat', allergenFlags: [] }],
	edges: [],
	source: 'leader-api',
	totalNodeCount: 24,
	hasMore: true,
}

beforeEach(() => {
	jest.clearAllMocks()
	jest.mocked(getGraphEvidenceSnapshot).mockResolvedValue(undefined)
})

it('finds an ingredient by remote alias outside the initial page', async () => {
	jest.mocked(getGraphData).mockImplementation(async query =>
		query?.query
			? {
					...base,
					nodes: [
						{
							id: 'peanut',
							name: 'Peanut',
							category: 'legume',
							allergenFlags: ['peanut'],
						},
					],
				}
			: base,
	)

	render(<GraphExplorer />)
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain('butter'),
	)
	fireEvent.change(screen.getByPlaceholderText('Search ingredients…'), {
		target: { value: 'groundnut' },
	})

	await waitFor(() =>
		expect(getGraphData).toHaveBeenCalledWith({
			query: 'groundnut',
			depth: 0,
			limit: 20,
		}),
	)
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain('peanut'),
	)
	expect(screen.getByText('1 search matches')).toBeTruthy()
})

it('reports an unknown search without inventing a graph node', async () => {
	jest
		.mocked(getGraphData)
		.mockImplementation(async query =>
			query?.query ? { ...base, nodes: [], edges: [] } : base,
		)

	render(<GraphExplorer />)
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain('butter'),
	)
	fireEvent.change(screen.getByPlaceholderText('Search ingredients…'), {
		target: { value: 'unlisted spice' },
	})

	await waitFor(() =>
		expect(getGraphData).toHaveBeenCalledWith({
			query: 'unlisted spice',
			depth: 0,
			limit: 20,
		}),
	)
	expect(screen.getByTestId('graph-search-empty').textContent).toContain(
		'not in the current graph',
	)
	expect(screen.getByTestId('graph-content').textContent).toContain('butter')
	expect(screen.getByTestId('graph-content').textContent).not.toContain(
		'unlisted spice',
	)
})

it('clears a failed search message after a later search succeeds', async () => {
	jest.mocked(getGraphData).mockImplementation(async options => {
		if (!options?.query) return base
		if (options.query === 'temporary failure') {
			throw new Error('search unavailable')
		}
		return {
			...base,
			nodes: [
				{
					id: 'peanut',
					name: 'Peanut',
					category: 'legume',
					allergenFlags: ['peanut'],
				},
			],
		}
	})

	render(<GraphExplorer />)
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain('butter'),
	)
	fireEvent.change(screen.getByPlaceholderText('Search ingredients…'), {
		target: { value: 'temporary failure' },
	})
	await waitFor(() =>
		expect(screen.getByRole('status').textContent).toContain(
			'Ingredient search could not be loaded.',
		),
	)

	fireEvent.change(screen.getByPlaceholderText('Search ingredients…'), {
		target: { value: 'groundnut' },
	})
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain('peanut'),
	)
	expect(screen.queryByRole('status')).toBeNull()

	fireEvent.change(screen.getByPlaceholderText('Search ingredients…'), {
		target: { value: 'temporary failure' },
	})
	await waitFor(() => expect(screen.getByRole('status')).toBeTruthy())
	fireEvent.change(screen.getByPlaceholderText('Search ingredients…'), {
		target: { value: '' },
	})
	expect(screen.queryByRole('status')).toBeNull()
})

it('shows the grounded compound overlap after an edge is selected', async () => {
	jest.mocked(getGraphData).mockResolvedValue({
		...base,
		nodes: [
			...base.nodes,
			{
				id: 'coconut oil',
				name: 'Coconut Oil',
				category: 'fat',
				allergenFlags: [],
			},
		],
		edges: [
			{
				source: 'butter',
				target: 'coconut oil',
				type: 'substitution',
				substitutionRatio: 0.75,
			},
		],
	})
	jest.mocked(getGraphCompoundOverlap).mockResolvedValue({
		compoundOverlap: 0.42,
		compoundOverlapSemantics: 'Jaccard of official presence profiles',
	})

	render(<GraphExplorer />)
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain(
			'coconut oil',
		),
	)
	fireEvent.click(screen.getByText('Load compound overlap'))

	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain('0.42'),
	)
	expect(getGraphCompoundOverlap).toHaveBeenCalledWith('Butter', 'Coconut Oil')
	expect(getGraphEvidence).not.toHaveBeenCalled()
})

it('retries compound overlap after an empty result', async () => {
	jest.mocked(getGraphData).mockResolvedValue({
		...base,
		nodes: [
			...base.nodes,
			{
				id: 'coconut oil',
				name: 'Coconut Oil',
				category: 'fat',
				allergenFlags: [],
			},
		],
		edges: [{ source: 'butter', target: 'coconut oil', type: 'substitution' }],
	})
	jest
		.mocked(getGraphCompoundOverlap)
		.mockResolvedValueOnce(undefined)
		.mockResolvedValueOnce({
			compoundOverlap: 0.42,
			compoundOverlapSemantics: 'Jaccard of official presence profiles',
		})

	render(<GraphExplorer />)
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain(
			'coconut oil',
		),
	)

	fireEvent.click(screen.getByText('Load compound overlap'))
	await waitFor(() => expect(getGraphCompoundOverlap).toHaveBeenCalledTimes(1))
	fireEvent.click(screen.getByText('Load compound overlap'))

	await waitFor(() => expect(getGraphCompoundOverlap).toHaveBeenCalledTimes(2))
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain('0.42'),
	)
})

it('loads abstaining shadow evidence only when the explicit feature flag is on', async () => {
	process.env.NEXT_PUBLIC_GRAPH_EVIDENCE_ENABLED = 'true'
	jest.mocked(getGraphData).mockResolvedValue({
		...base,
		nodes: [
			...base.nodes,
			{
				id: 'coconut oil',
				name: 'Coconut Oil',
				category: 'oil',
				allergenFlags: [],
			},
		],
		edges: [{ source: 'butter', target: 'coconut oil', type: 'substitution' }],
	})
	jest.mocked(getGraphCompoundOverlap).mockResolvedValue(undefined)
	jest.mocked(getGraphEvidence).mockResolvedValue({
		contractVersion: 'graph-evidence.v1',
		status: 'AVAILABLE',
		evidence: {
			identityResolution: { status: 'RESOLVED' },
			trainPairEvidence: { seenInTrain: true, trainCount: 2 },
			calibration: { status: 'no_guarantee' },
			decision: { decision: 'ABSTAIN' },
		},
	})

	render(<GraphExplorer />)
	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain(
			'coconut oil',
		),
	)
	fireEvent.click(screen.getByText('Load compound overlap'))

	await waitFor(() =>
		expect(screen.getByTestId('graph-content').textContent).toContain(
			'AVAILABLE:ABSTAIN',
		),
	)
	expect(getGraphEvidence).toHaveBeenCalledWith('butter', 'coconut oil')
})
it('displays the verified artifact manifest hash in the footer when evidence is enabled', async () => {
	process.env.NEXT_PUBLIC_GRAPH_EVIDENCE_ENABLED = 'true'
	jest.mocked(getGraphData).mockResolvedValue(base)
	jest.mocked(getGraphEvidenceSnapshot).mockResolvedValue({
		contractVersion: 'graph-evidence.v1',
		status: 'AVAILABLE',
		artifactIntegrity: {
			status: 'VERIFIED',
			expectedSha256: 'ade85c3312b8d72c851c525d34869e70d759aec144b0d1c2d6d2be6f114c1ef1',
			observedSha256: 'ade85c3312b8d72c851c525d34869e70d759aec144b0d1c2d6d2be6f114c1ef1',
		},
		snapshot: {
			totalNodes: 6633,
			totalEdges: 23185,
			acceptanceState: 'PROVISIONAL_PRIVATE_CANDIDATE_ACCEPTED',
		},
	})

	render(<GraphExplorer />)
	await waitFor(() => {
		const el = screen.getByTestId('graph-artifact-footer-hash')
		expect(el).toBeInTheDocument()
		expect(el.textContent).toContain('Artifact: ade85c3312b8… (6633 nodes, 23185 edges)')
		expect(el).toHaveAttribute(
			'title',
			'Manifest SHA-256: ade85c3312b8d72c851c525d34869e70d759aec144b0d1c2d6d2be6f114c1ef1',
		)
	})
})
