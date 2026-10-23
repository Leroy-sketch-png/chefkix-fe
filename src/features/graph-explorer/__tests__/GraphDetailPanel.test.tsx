import { render, screen } from '@testing-library/react'
import {
	GraphEdgeDetailPanel,
	GraphEvidencePanel,
} from '../components/GraphDetailPanel'
import type { GraphEvidenceLoadState } from '../types'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) =>
		key === 'artifactManifestDeclaredSha256'
			? 'Manifest-declared SHA-256'
			: 'Observed artifact SHA-256',
}))

function renderEvidencePanel(state: GraphEvidenceLoadState) {
	return render(<GraphEvidencePanel state={state} />)
}

it('labels an ungrounded compound comparison as unavailable', () => {
	render(
		<GraphEdgeDetailPanel
			edge={{ source: 'butter', target: 'oil', type: 'substitution' }}
		/>,
	)

	expect(screen.getByText('FooDB comparison unavailable')).toBeTruthy()
})

it('keeps backend unavailable and refused graph evidence states explicit', () => {
	const { rerender } = renderEvidencePanel({
		edgeKey: 'butter:oil:substitution',
		state: 'loaded',
		response: {
			contractVersion: 'graph-evidence.v1',
			status: 'UNAVAILABLE',
			unavailableReason: 'FEATURE_DISABLED',
		},
	})

	const unavailableStatus = screen.getByRole('status')
	expect(unavailableStatus).toHaveTextContent(
		'Graph evidence unavailable: feature disabled.',
	)
	expect(unavailableStatus).toHaveTextContent(
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

it.each([
	['equal hashes', 'a'.repeat(64), 'a'.repeat(64)],
	['mismatched hashes', 'a'.repeat(64), 'b'.repeat(64)],
])(
	'shows sanitized integrity digests without changing REFUSED status (%s)',
	(_label, expectedSha256, observedSha256) => {
		renderEvidencePanel({
			edgeKey: 'butter:oil:substitution',
			state: 'loaded',
			response: {
				contractVersion: 'graph-evidence.v1',
				status: 'REFUSED',
				artifactIntegrity: {
					status: 'INVALID',
					expectedSha256,
					observedSha256,
				},
			},
		})

		const status = screen.getByRole('status')
		expect(status).toHaveTextContent('Artifact integrity was refused.')
		expect(status).toHaveTextContent('Graph evidence was not rendered.')
		expect(status).toHaveTextContent('Manifest-declared SHA-256')
		expect(status).toHaveTextContent(expectedSha256)
		expect(status).toHaveTextContent('Observed artifact SHA-256')
		expect(status).toHaveTextContent(observedSha256)
		expect(screen.queryByText('Calibration status:')).not.toBeInTheDocument()
	},
)

it('omits missing or malformed digests from the REFUSED state', () => {
	renderEvidencePanel({
		edgeKey: 'butter:oil:substitution',
		state: 'loaded',
		response: {
			contractVersion: 'graph-evidence.v1',
			status: 'REFUSED',
			artifactIntegrity: {
				status: 'INVALID',
				expectedSha256: 'not-a-digest',
			},
		},
	})

	const status = screen.getByRole('status')
	expect(status).toHaveTextContent('Artifact integrity was refused.')
	expect(status).not.toHaveTextContent('Manifest-declared SHA-256')
	expect(status).not.toHaveTextContent('Observed artifact SHA-256')
	expect(
		screen.queryByText('Graph evidence was rendered.'),
	).not.toBeInTheDocument()
})
