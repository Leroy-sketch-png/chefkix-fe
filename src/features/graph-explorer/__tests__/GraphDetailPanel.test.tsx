import { render, screen } from '@testing-library/react'
import { GraphEdgeDetailPanel } from '../components/GraphDetailPanel'

it('labels an ungrounded compound comparison as unavailable', () => {
	render(
		<GraphEdgeDetailPanel
			edge={{ source: 'butter', target: 'oil', type: 'substitution' }}
		/>,
	)

	expect(screen.getByText('FooDB comparison unavailable')).toBeTruthy()
})
