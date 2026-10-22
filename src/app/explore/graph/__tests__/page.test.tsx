import { render, screen } from '@testing-library/react'
import PublicGraphExplorerPage from '../page'

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
})

it('mounts the graph explorer only when the explicit build flag is true', () => {
	process.env[FLAG] = 'true'

	render(<PublicGraphExplorerPage />)

	expect(screen.getByTestId('graph-explorer')).toHaveTextContent('Explorer')
	expect(screen.queryByTestId('graph-explorer-disabled')).toBeNull()
})
