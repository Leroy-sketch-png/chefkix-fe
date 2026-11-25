import { render, screen } from '@testing-library/react'
import Link from 'next/link'
import PublicGraphExplorerPage from '../page'
import { PATHS } from '@/constants'

jest.mock('@/features/graph-explorer/components/GraphExplorer', () => ({
	GraphExplorer: () => (
		<div data-testid='graph-explorer'>
			<Link href='/explore'>Back to Explore</Link>
			<h1>What do two foods have in common?</h1>
		</div>
	),
}))

const FLAG = 'NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED'

afterEach(() => {
	delete process.env[FLAG]
})

it('keeps the graph route off by default while verified data is unavailable', () => {
	delete process.env[FLAG]

	render(<PublicGraphExplorerPage />)

	expect(
		screen.getByRole('heading', { name: 'Food comparison is unavailable' }),
	).toBeInTheDocument()
	expect(screen.getByTestId('graph-explorer-disabled')).toHaveTextContent(
		'The pinned product graph is not available right now.',
	)
	expect(screen.queryByTestId('graph-explorer')).toBeNull()
	expect(screen.getByRole('link', { name: 'Back to Explore' })).toHaveAttribute(
		'href',
		PATHS.EXPLORE,
	)
})

it('mounts the graph explorer only when the explicit build flag is true', () => {
	process.env[FLAG] = 'true'

	render(<PublicGraphExplorerPage />)

	expect(
		screen.getByRole('heading', { name: 'What do two foods have in common?' }),
	).toBeInTheDocument()
	expect(screen.getByTestId('graph-explorer')).toHaveTextContent(
		'What do two foods have in common?',
	)
	expect(screen.queryByTestId('graph-explorer-preview-boundary')).toBeNull()
	expect(screen.queryByText(/Preview ingredient relationships/)).toBeNull()
	expect(screen.queryByTestId('graph-explorer-disabled')).toBeNull()
	expect(screen.getAllByRole('heading')).toHaveLength(1)
	expect(screen.getByRole('link', { name: 'Back to Explore' })).toHaveAttribute(
		'href',
		PATHS.EXPLORE,
	)
	expect(screen.getAllByRole('link', { name: 'Back to Explore' })).toHaveLength(
		1,
	)
})
