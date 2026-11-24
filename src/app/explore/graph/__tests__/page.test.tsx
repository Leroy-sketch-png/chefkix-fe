import { render, screen } from '@testing-library/react'
import PublicGraphExplorerPage from '../page'
import { PATHS } from '@/constants'

jest.mock('@/features/graph-explorer/components/GraphExplorer', () => ({
	GraphExplorer: () => <div data-testid='graph-explorer'>Explorer</div>,
}))

const FLAG = 'NEXT_PUBLIC_GRAPH_EXPLORER_ENABLED'

afterEach(() => {
	delete process.env[FLAG]
})

it('keeps the graph route off by default while verified data is unavailable', () => {
	delete process.env[FLAG]

	render(<PublicGraphExplorerPage />)

	expect(screen.getByTestId('graph-explorer-disabled')).toHaveTextContent(
		'Graph Explorer is disabled until verified graph data is configured.',
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
		screen.getByRole('heading', { name: 'Food composition map' }),
	).toBeInTheDocument()
	expect(screen.getByTestId('graph-explorer')).toHaveTextContent('Explorer')
	expect(screen.queryByTestId('graph-explorer-preview-boundary')).toBeNull()
	expect(screen.queryByText(/Preview ingredient relationships/)).toBeNull()
	expect(screen.queryByTestId('graph-explorer-disabled')).toBeNull()
	expect(screen.getByRole('link', { name: 'Back to Explore' })).toHaveAttribute(
		'href',
		PATHS.EXPLORE,
	)
})
