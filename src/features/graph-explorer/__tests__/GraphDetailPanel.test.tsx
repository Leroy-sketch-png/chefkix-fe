import { render, screen } from '@testing-library/react'
import englishMessages from '../../../../messages/en.json'
import {
	GraphEdgeDetailPanel,
	GraphEvidencePanel,
} from '../components/GraphDetailPanel'
import type { GraphEvidenceLoadState } from '../types'

jest.mock('next-intl', () => {
	const messages = require('../../../../messages/en.json').recipe
	return {
		useTranslations: () => (key: string) => messages[key] ?? key,
	}
})

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

it.each([
	['ok', 'researchCalibrationStateOk'],
	['uninformative', 'researchCalibrationStateUninformative'],
	['vacuous', 'researchCalibrationStateVacuous'],
	['no_guarantee', 'researchCalibrationStateNoGuarantee'],
	['abstain', 'researchCalibrationStateAbstain'],
])(
	'explains calibration state %s without making a recommendation',
	(status, messageKey) => {
		renderEvidencePanel({
			edgeKey: 'butter:oil:substitution',
			state: 'loaded',
			response: {
				contractVersion: 'graph-evidence.v1',
				status: 'AVAILABLE',
				evidence: {
					calibration: { status },
					decision: { decision: 'ABSTAIN' },
				},
			},
		})

		expect(
			screen.getByText(englishMessages.recipe[messageKey]),
		).toBeInTheDocument()
		expect(
			screen.getByText(
				englishMessages.recipe.researchOfflineCoverageIsSeparate,
			),
		).toBeInTheDocument()
		expect(screen.getByText('Decision: Abstain')).toBeInTheDocument()
	},
)

it.each([undefined, 'future_status'])(
	'fails closed for unknown calibration status %s',
	status => {
		renderEvidencePanel({
			edgeKey: 'butter:oil:substitution',
			state: 'loaded',
			response: {
				contractVersion: 'graph-evidence.v1',
				status: 'AVAILABLE',
				evidence: {
					calibration: status === undefined ? undefined : { status },
					decision: { decision: 'ABSTAIN' },
				},
			},
		})

		expect(
			screen.getByText(englishMessages.recipe.researchCalibrationStateUnknown),
		).toBeInTheDocument()
		expect(screen.getByText('Decision: Abstain')).toBeInTheDocument()
	},
)
