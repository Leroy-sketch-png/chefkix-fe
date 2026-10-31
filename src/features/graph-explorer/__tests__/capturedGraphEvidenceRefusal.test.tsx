import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { render, screen } from '@testing-library/react'
import { GraphEvidencePanel } from '../components/GraphDetailPanel'
import { normalizeGraphEvidence } from '../services/graphExplorerService'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) =>
		key === 'artifactManifestDeclaredSha256'
			? 'Manifest-declared SHA-256'
			: 'Observed artifact SHA-256',
}))

const capturedResponsePath = process.env.GRAPH_EVIDENCE_CAPTURED_RESPONSE
const expectedCaptureSha256_T154 =
	'e07f9f1987a619d75c07ec8243befddaf5e54c964f8f570e42f591447b8456b0'
const expectedCaptureSha256_20261030 =
	'6d1422ec15e8506e7e26fc9a629ebd6ed395e0c83ca599e0a4cb9353c34a9836'
const supportedCaptureSha256s = new Set([
	expectedCaptureSha256_T154,
	expectedCaptureSha256_20261030,
])
const capturedResponseDescribe = capturedResponsePath ? describe : describe.skip

capturedResponseDescribe(
	'captured T353 graph-evidence refusal response',
	() => {
		it('normalizes and renders the exact captured refusal without upgrading status', () => {
			if (!capturedResponsePath) {
				throw new Error(
					'GRAPH_EVIDENCE_CAPTURED_RESPONSE must name the captured JSON file.',
				)
			}

			const capturedBytes = readFileSync(capturedResponsePath)
			const capturedSha256 = createHash('sha256')
				.update(capturedBytes)
				.digest('hex')
			expect(supportedCaptureSha256s.has(capturedSha256)).toBe(true)

			const capturedJson = JSON.parse(capturedBytes.toString('utf8')) as unknown
			const response = normalizeGraphEvidence(capturedJson)

			expect(response.status).toBe('REFUSED')
			expect(response.artifactIntegrity?.expectedSha256).toBeTruthy()
			expect(response.artifactIntegrity?.observedSha256).toBeTruthy()

			render(
				<GraphEvidencePanel
					state={{
						edgeKey: 'captured-response',
						state: 'loaded',
						response,
					}}
				/>,
			)

			const status = screen.getByRole('status')
			expect(status).toHaveTextContent('Artifact integrity was refused.')
			expect(status).toHaveTextContent('Graph evidence was not rendered.')
			expect(status).toHaveTextContent('Manifest-declared SHA-256')
			expect(status).toHaveTextContent(
				response.artifactIntegrity!.expectedSha256!,
			)
			expect(status).toHaveTextContent('Observed artifact SHA-256')
			expect(status).toHaveTextContent(
				response.artifactIntegrity!.observedSha256!,
			)
			expect(status).not.toHaveTextContent('Train pair support:')
			expect(status).not.toHaveTextContent('Calibration status:')
			expect(status).not.toHaveTextContent('Decision: Abstain')
			expect(status).not.toHaveTextContent('Recommended substitute')
		})
	},
)
