import { render, screen } from '@testing-library/react'
import {
	GraphEdgeDetailPanel,
	GraphEvidencePanel,
} from '../components/GraphDetailPanel'

it('labels an ungrounded compound comparison as unavailable', () => {
	render(
		<GraphEdgeDetailPanel
			edge={{ source: 'butter', target: 'oil', type: 'substitution' }}
		/>,
	)

	expect(screen.getByText('FooDB comparison unavailable')).toBeTruthy()
})

it('keeps backend unavailable and refused graph evidence states explicit', () => {
	const { rerender } = render(
		<GraphEvidencePanel
			state={{
				edgeKey: 'butter:oil:substitution',
				state: 'loaded',
				response: {
					contractVersion: 'graph-evidence.v1',
					status: 'UNAVAILABLE',
					unavailableReason: 'FEATURE_DISABLED',
				},
			}}
		/>,
	)

	expect(screen.getByRole('status')).toHaveTextContent(
		'Graph evidence unavailable: feature disabled.',
	)
	expect(screen.getByRole('status')).toHaveTextContent(
		'No substitution decision was made.',
	)

	rerender(
		<GraphEvidencePanel
			state={{
				edgeKey: 'butter:oil:substitution',
				state: 'loaded',
				response: {
					contractVersion: 'graph-evidence.v1',
					status: 'REFUSED',
					artifactIntegrity: { status: 'INVALID' },
				},
			}}
		/>,
	)

	expect(screen.getByRole('status')).toHaveTextContent(
		'Artifact integrity was refused.',
	)
})
