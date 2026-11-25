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
		screen.getByRole('region', { name: 'Compare food records' }),
	).toBeInTheDocument()
	expect(
		screen.getByRole('heading', {
			name: 'What do two foods have in common?',
		}),
	).toBeInTheDocument()
	expect(
		screen.getByRole('textbox', { name: 'Search first food' }),
	).toBeInTheDocument()
	expect(
		screen.getByRole('textbox', { name: 'Search second food' }),
	).toBeInTheDocument()
	expect(
		screen.getByRole('button', { name: 'Show what they share' }),
	).toBeDisabled()
	expect(
		screen.queryByRole('button', { name: 'Legacy knowledge graph' }),
	).toBeNull()
	expect(getGraphData).not.toHaveBeenCalled()
})
