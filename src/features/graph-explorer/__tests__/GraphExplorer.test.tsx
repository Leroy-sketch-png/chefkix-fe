import { render, screen } from '@testing-library/react'
import { GraphExplorer } from '../components/GraphExplorer'
import { getGraphData } from '../services/graphExplorerService'

jest.mock('../services/graphExplorerService', () => ({
	...jest.requireActual('../services/graphExplorerService'),
	getGraphData: jest.fn(),
}))

it('keeps the Explorer on the pinned product graph without a legacy fallback', () => {
	render(<GraphExplorer />)

	expect(
		screen.getByRole('region', { name: 'FooDB food record explorer' }),
	).toBeInTheDocument()
	expect(
		screen.getByRole('textbox', { name: 'Search FooDB foods' }),
	).toBeInTheDocument()
	expect(
		screen.queryByRole('button', { name: 'Legacy knowledge graph' }),
	).toBeNull()
	expect(getGraphData).not.toHaveBeenCalled()
})
