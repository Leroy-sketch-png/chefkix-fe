import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SubstitutionButton } from '../SubstitutionButton'
import { parseResearchSubstitutionResponse } from '../research-substitution-contract'
import { calculateSubstitutionDialogPosition } from '../substitution-dialog-position'
import {
	fetchResearchSubstitutionEvidence,
	suggestSubstitutions,
} from '@/services/ai'
import type { ResearchSubstitutionResponse } from '@/services/ai'

const mockedRequireAuth = jest.fn(() => true)

jest.mock('next-intl', () => ({
	useTranslations:
		() => (key: string, values?: Record<string, string | number>) =>
			values ? `${key}:${Object.values(values).join(',')}` : key,
}))

jest.mock('@/services/ai', () => ({
	suggestSubstitutions: jest.fn(),
	fetchResearchSubstitutionEvidence: jest.fn(),
}))

jest.mock('@/services/cookingSession', () => ({
	submitSubstitutionFeedback: jest.fn(),
}))

jest.mock('@/hooks/useAuthActionGuard', () => ({
	useAuthActionGuard: () => ({ requireAuth: mockedRequireAuth }),
}))

const mockedSuggest = jest.mocked(suggestSubstitutions)
const mockedFetchResearch = jest.mocked(fetchResearchSubstitutionEvidence)

const unresolvedIdentity: ResearchSubstitutionResponse = {
	contractVersion: 'graph-preflight-v2',
	sourceIdentityStatus: 'unresolved',
	sourceIngredientId: null,
	graphStatus: 'not_evaluated',
	disposition: 'abstain',
	abstentionReason: 'source_identity_unresolved',
}

describe('SubstitutionButton research evidence consumer', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		delete process.env.NEXT_PUBLIC_GRAPH_RESEARCH_ENABLED
		mockedRequireAuth.mockReturnValue(true)
	})

	it('keeps the product substitution caller active when the research flag is absent', async () => {
		render(<SubstitutionButton ingredientName='butter' />)
		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)
		await waitFor(() => expect(mockedSuggest).toHaveBeenCalled())
		expect(mockedFetchResearch).not.toHaveBeenCalled()
	})

	it('uses the source-only research caller on product surfaces when explicitly enabled', async () => {
		process.env.NEXT_PUBLIC_GRAPH_RESEARCH_ENABLED = 'true'
		mockedFetchResearch.mockResolvedValueOnce(unresolvedIdentity)
		render(
			<SubstitutionButton
				ingredientName='butter'
				recipeTitle='private recipe title'
			/>,
		)
		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		await screen.findByText('researchIdentityUnresolved')
		expect(mockedFetchResearch).toHaveBeenCalledWith('butter')
		expect(mockedSuggest).not.toHaveBeenCalled()
	})

	it('is opt-in, sends only the source ingredient to its injected caller, and never falls back on abstention', async () => {
		const fetcher = jest.fn().mockResolvedValue(unresolvedIdentity)
		render(
			<SubstitutionButton
				ingredientName='new source'
				recipeTitle='private recipe title'
				researchMode={{ fetcher }}
			/>,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:new source' }),
		)

		await screen.findByText('researchIdentityUnresolved')
		expect(fetcher).toHaveBeenCalledTimes(1)
		expect(fetcher).toHaveBeenCalledWith('new source')
		expect(mockedSuggest).not.toHaveBeenCalled()
		expect(screen.queryByText('reasonAllergy')).toBeNull()
		expect(screen.queryByText('private recipe title')).toBeNull()
	})

	it('withholds candidates when allergen evidence is unavailable and disclaims safety', async () => {
		const fetcher = jest.fn().mockResolvedValue({
			contractVersion: 'graph-evidence-v1',
			graphStatus: 'not_configured',
			graphProvenance: null,
			calibration: {
				status: 'no_guarantee',
				bindingStatus: 'missing',
				manifestSha256: null,
				calibrationCaseCount: 0,
				noGuaranteeReason: 'missing_artifact',
			},
			disposition: 'abstain',
			rankerProvenance: null,
			hardFilterProvenance: null,
			abstentionReasons: ['graph_unavailable', 'hard_filter_unavailable'],
			candidates: [],
		} satisfies ResearchSubstitutionResponse)
		render(
			<SubstitutionButton ingredientName='sesame' researchMode={{ fetcher }} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:sesame' }),
		)

		await screen.findByText('researchRecommendationsWithheld')
		expect(screen.getByText('researchAllergenEvidenceUnavailable')).toBeTruthy()
		expect(screen.getByText('researchNotSafetyAssessment')).toBeTruthy()
		expect(mockedSuggest).not.toHaveBeenCalled()
	})

	it('keeps a failed research request visible and does not fall back to legacy suggestions', async () => {
		const fetcher = jest.fn().mockRejectedValue(new Error('offline'))
		render(
			<SubstitutionButton ingredientName='sesame' researchMode={{ fetcher }} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:sesame' }),
		)

		expect(await screen.findByText('researchRequestFailed')).toBeTruthy()
		expect(mockedSuggest).not.toHaveBeenCalled()
	})

	it('withholds a contradictory response instead of rendering candidates', async () => {
		const fetcher = jest.fn().mockResolvedValue({
			contractVersion: 'graph-evidence-v1',
			graphStatus: 'ready',
			graphProvenance: {
				artifactId: 'graph-2026-01',
				manifestSha256: 'a'.repeat(64),
				sourceSplit: 'train',
				transformationId: 'graph-v1',
			},
			calibration: {
				status: 'no_guarantee',
				bindingStatus: 'missing',
				manifestSha256: null,
				calibrationCaseCount: 0,
				noGuaranteeReason: 'missing_artifact',
			},
			disposition: 'recommendations',
			rankerProvenance: { rankerId: 'recorded', scorerSha256: 'b'.repeat(64) },
			hardFilterProvenance: null,
			abstentionReasons: [],
			candidates: [
				{
					candidateId: 'graph-12',
					rank: 1,
					name: 'sunflower oil',
					fooDbId: null,
					knownNode: true,
					trainPairCount: 4,
					seen: true,
					ratio: null,
					confidenceScore: null,
				},
			],
		})
		render(
			<SubstitutionButton ingredientName='butter' researchMode={{ fetcher }} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		expect(await screen.findByText('researchGenericAbstention')).toBeTruthy()
		expect(screen.queryByText('sunflower oil')).toBeNull()
		expect(mockedSuggest).not.toHaveBeenCalled()
	})

	it('shows the returned graph manifest digest and source split for recommendations', async () => {
		const manifestSha256 = '1234567890abcdef'.repeat(4)
		const fetcher = jest.fn().mockResolvedValue({
			contractVersion: 'graph-evidence-v2',
			graphStatus: 'ready',
			graphProvenance: {
				artifactId: 'graph-2026-01',
				manifestSha256,
				sourceSplit: 'train',
				transformationId: 'graph-v1',
			},
			calibration: {
				status: 'ok',
				bindingStatus: 'compatible',
				manifestSha256: 'a'.repeat(64),
				calibrationCaseCount: 200,
				cutoff: 10,
				noGuaranteeReason: null,
			},
			disposition: 'recommendations',
			rankerProvenance: { rankerId: 'recorded', scorerSha256: 'b'.repeat(64) },
			hardFilterProvenance: {
				policyId: 'recorded',
				policySha256: 'c'.repeat(64),
			},
			abstentionReasons: [],
			candidates: [
				{
					candidateId: 'graph-12',
					rank: 1,
					name: 'sunflower oil',
					fooDbId: null,
					knownNode: true,
					trainPairCount: 4,
					seen: true,
					ratio: null,
					confidenceScore: null,
				},
			],
		} satisfies ResearchSubstitutionResponse)
		render(
			<SubstitutionButton ingredientName='butter' researchMode={{ fetcher }} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		expect(await screen.findByText('sunflower oil')).toBeTruthy()
		expect(screen.getByText('researchGraphManifestHashLabel')).toBeTruthy()
		expect(screen.getByText(manifestSha256)).toBeTruthy()
		expect(screen.getByText('researchGraphSourceSplitLabel')).toBeTruthy()
		expect(screen.getByText('train')).toBeTruthy()
	})

	it('shows available graph provenance with abstention without exposing candidates', async () => {
		const manifestSha256 = 'fedcba0987654321'.repeat(4)
		const fetcher = jest.fn().mockResolvedValue({
			contractVersion: 'graph-evidence-v1',
			graphStatus: 'ready',
			graphProvenance: {
				artifactId: 'graph-2026-01',
				manifestSha256,
				sourceSplit: 'train',
				transformationId: 'graph-v1',
			},
			calibration: {
				status: 'no_guarantee',
				bindingStatus: 'missing',
				manifestSha256: null,
				calibrationCaseCount: 0,
				noGuaranteeReason: 'missing_artifact',
			},
			disposition: 'abstain',
			rankerProvenance: null,
			hardFilterProvenance: null,
			abstentionReasons: ['calibration_not_ok'],
			candidates: [],
		} satisfies ResearchSubstitutionResponse)
		render(
			<SubstitutionButton ingredientName='butter' researchMode={{ fetcher }} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		expect(
			await screen.findByText('researchRecommendationsWithheld'),
		).toBeTruthy()
		expect(screen.getByText(manifestSha256)).toBeTruthy()
		expect(screen.getByText('researchGraphSourceSplitLabel')).toBeTruthy()
		expect(screen.getByText('train')).toBeTruthy()
		expect(screen.queryByText('sunflower oil')).toBeNull()
	})

	it('shows returned provenance for a non-ready abstention when it is present', async () => {
		const manifestSha256 = '0f1e2d3c4b5a6978'.repeat(4)
		const fetcher = jest.fn().mockResolvedValue({
			contractVersion: 'graph-evidence-v1',
			graphStatus: 'not_configured',
			graphProvenance: {
				artifactId: 'graph-2026-01',
				manifestSha256,
				sourceSplit: 'train',
				transformationId: 'graph-v1',
			},
			calibration: {
				status: 'no_guarantee',
				bindingStatus: 'missing',
				manifestSha256: null,
				calibrationCaseCount: 0,
				noGuaranteeReason: 'missing_artifact',
			},
			disposition: 'abstain',
			rankerProvenance: null,
			hardFilterProvenance: null,
			abstentionReasons: ['graph_unavailable'],
			candidates: [],
		} satisfies ResearchSubstitutionResponse)
		render(
			<SubstitutionButton ingredientName='butter' researchMode={{ fetcher }} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		expect(
			await screen.findByText('researchRecommendationsWithheld'),
		).toBeTruthy()
		expect(screen.getByText(manifestSha256)).toBeTruthy()
		expect(screen.getByText('researchGraphSourceSplitLabel')).toBeTruthy()
		expect(screen.getByText('train')).toBeTruthy()
	})

	it('withholds malformed returned graph provenance', async () => {
		const malformedResponse = {
			contractVersion: 'graph-evidence-v1',
			graphStatus: 'ready',
			graphProvenance: {
				artifactId: 'graph-2026-01',
				manifestSha256: null,
				sourceSplit: 'train',
				transformationId: 'graph-v1',
			},
			calibration: {
				status: 'no_guarantee',
				bindingStatus: 'missing',
				manifestSha256: null,
				calibrationCaseCount: 0,
				noGuaranteeReason: 'missing_artifact',
			},
			disposition: 'abstain',
			rankerProvenance: null,
			hardFilterProvenance: null,
			abstentionReasons: ['calibration_not_ok'],
			candidates: [],
		}
		expect(parseResearchSubstitutionResponse(malformedResponse)).toBeNull()
		const fetcher = jest
			.fn()
			.mockResolvedValue(
				malformedResponse as unknown as ResearchSubstitutionResponse,
			)
		render(
			<SubstitutionButton ingredientName='butter' researchMode={{ fetcher }} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		expect(await screen.findByText('researchGenericAbstention')).toBeTruthy()
		expect(screen.queryByText('researchGraphManifestHashLabel')).toBeNull()
		expect(screen.queryByText('researchGraphSourceSplitLabel')).toBeNull()
		expect(mockedSuggest).not.toHaveBeenCalled()
	})

	it('omits graph provenance when it is absent', async () => {
		const responses: ResearchSubstitutionResponse[] = [
			{
				contractVersion: 'graph-evidence-v1',
				graphStatus: 'ready',
				graphProvenance: null,
				calibration: {
					status: 'no_guarantee',
					bindingStatus: 'missing',
					manifestSha256: null,
					calibrationCaseCount: 0,
					noGuaranteeReason: 'missing_artifact',
				},
				disposition: 'abstain',
				rankerProvenance: null,
				hardFilterProvenance: null,
				abstentionReasons: ['graph_unavailable'],
				candidates: [],
			},
			{
				contractVersion: 'graph-evidence-v1',
				graphStatus: 'not_configured',
				graphProvenance: null,
				calibration: {
					status: 'no_guarantee',
					bindingStatus: 'missing',
					manifestSha256: null,
					calibrationCaseCount: 0,
					noGuaranteeReason: 'missing_artifact',
				},
				disposition: 'abstain',
				rankerProvenance: null,
				hardFilterProvenance: null,
				abstentionReasons: ['graph_unavailable'],
				candidates: [],
			},
		]

		for (const [index, response] of responses.entries()) {
			const fetcher = jest.fn().mockResolvedValue(response)
			const { unmount } = render(
				<SubstitutionButton
					ingredientName={`source-${index}`}
					researchMode={{ fetcher }}
				/>,
			)
			fireEvent.click(
				screen.getByRole('button', {
					name: `findSubstituteFor:source-${index}`,
				}),
			)
			expect(
				await screen.findByText('researchRecommendationsWithheld'),
			).toBeTruthy()
			expect(screen.queryByText('researchGraphManifestHashLabel')).toBeNull()
			expect(screen.queryByText('researchGraphSourceSplitLabel')).toBeNull()
			unmount()
		}
	})

	it('announces a modal, contains keyboard focus, and restores focus on close', async () => {
		const fetcher = jest.fn().mockResolvedValue(unresolvedIdentity)
		render(
			<SubstitutionButton ingredientName='butter' researchMode={{ fetcher }} />,
		)
		const trigger = screen.getByRole('button', {
			name: 'findSubstituteFor:butter',
		})
		fireEvent.click(trigger)

		const dialog = await screen.findByRole('dialog')
		const close = screen.getByRole('button', { name: 'subClose' })
		expect(dialog).toHaveAttribute('aria-modal', 'true')
		await waitFor(() => expect(close).toHaveFocus())
		fireEvent.keyDown(close, { key: 'Tab' })
		expect(close).toHaveFocus()
		fireEvent.keyDown(close, { key: 'Escape' })
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		expect(trigger).toHaveFocus()
	})

	it('repositions when asynchronous dialog content changes its size', async () => {
		const viewportDescriptors = {
			width: Object.getOwnPropertyDescriptor(window, 'innerWidth'),
			height: Object.getOwnPropertyDescriptor(window, 'innerHeight'),
		}
		Object.defineProperties(window, {
			innerWidth: { configurable: true, value: 1024 },
			innerHeight: { configurable: true, value: 768 },
		})
		const originalRect = HTMLElement.prototype.getBoundingClientRect
		jest
			.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
			.mockImplementation(function (this: HTMLElement) {
				if (this.getAttribute('role') === 'dialog') {
					const dialogHeight = this.textContent?.includes('sunflower oil')
						? 300
						: 120
					return {
						top: 0,
						bottom: dialogHeight,
						left: 0,
						width: 300,
						height: dialogHeight,
					} as DOMRect
				}
				if (this.hasAttribute('aria-haspopup')) {
					return {
						top: 730,
						bottom: 750,
						left: 320,
						width: 40,
						height: 20,
					} as DOMRect
				}
				return originalRect.call(this)
			})

		try {
			let resolveFetch!: (value: ResearchSubstitutionResponse) => void
			const response: ResearchSubstitutionResponse = {
				contractVersion: 'graph-evidence-v2',
				graphStatus: 'ready',
				graphProvenance: {
					artifactId: 'graph-2026-01',
					manifestSha256: 'a'.repeat(64),
					sourceSplit: 'train',
					transformationId: 'graph-v1',
				},
				calibration: {
					status: 'ok',
					bindingStatus: 'compatible',
					manifestSha256: 'a'.repeat(64),
					calibrationCaseCount: 200,
					cutoff: 10,
					noGuaranteeReason: null,
				},
				disposition: 'recommendations',
				rankerProvenance: {
					rankerId: 'recorded',
					scorerSha256: 'b'.repeat(64),
				},
				hardFilterProvenance: {
					policyId: 'recorded',
					policySha256: 'c'.repeat(64),
				},
				abstentionReasons: [],
				candidates: [
					{
						candidateId: 'graph-12',
						rank: 1,
						name: 'sunflower oil',
						fooDbId: null,
						knownNode: true,
						trainPairCount: 4,
						seen: true,
						ratio: null,
						confidenceScore: null,
					},
				],
			}
			const fetcher = jest.fn(
				() =>
					new Promise<ResearchSubstitutionResponse>(resolve => {
						resolveFetch = resolve
					}),
			)
			render(
				<SubstitutionButton
					ingredientName='butter'
					researchMode={{ fetcher }}
				/>,
			)
			fireEvent.click(
				screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
			)
			const dialog = await screen.findByRole('dialog')
			await waitFor(() =>
				expect(Number.parseInt(dialog.style.top, 10)).toBeGreaterThan(0),
			)
			const initialTop = Number.parseInt(dialog.style.top, 10)
			await act(async () => resolveFetch(response))
			await screen.findByText('sunflower oil')

			await waitFor(() =>
				expect(Number.parseInt(dialog.style.top, 10)).toBeLessThan(initialTop),
			)
		} finally {
			jest.restoreAllMocks()
			for (const [key, descriptor] of Object.entries({
				innerWidth: viewportDescriptors.width,
				innerHeight: viewportDescriptors.height,
			})) {
				if (descriptor) {
					Object.defineProperty(window, key, descriptor)
				}
			}
		}
	})

	it('shows available FooDB identity but not nullable confidence or ratio estimates', async () => {
		const fetcher = jest.fn().mockResolvedValue({
			contractVersion: 'graph-evidence-v2',
			graphStatus: 'ready',
			graphProvenance: {
				artifactId: 'graph-2026-01',
				manifestSha256: 'a'.repeat(64),
				sourceSplit: 'train',
				transformationId: 'graph-v1',
			},
			calibration: {
				status: 'ok',
				bindingStatus: 'compatible',
				manifestSha256: 'a'.repeat(64),
				calibrationCaseCount: 200,
				cutoff: 10,
				noGuaranteeReason: null,
			},
			disposition: 'recommendations',
			rankerProvenance: { rankerId: 'recorded', scorerSha256: 'b'.repeat(64) },
			hardFilterProvenance: {
				policyId: 'recorded',
				policySha256: 'c'.repeat(64),
			},
			abstentionReasons: [],
			candidates: [
				{
					candidateId: 'graph-12',
					rank: 1,
					name: 'sunflower oil',
					fooDbId: 'FDB000123',
					knownNode: true,
					trainPairCount: 4,
					seen: true,
					ratio: '1:2',
					confidenceScore: 0.91,
				},
			],
		} satisfies ResearchSubstitutionResponse)
		render(
			<SubstitutionButton ingredientName='butter' researchMode={{ fetcher }} />,
		)

		fireEvent.click(
			screen.getByRole('button', { name: 'findSubstituteFor:butter' }),
		)

		expect(await screen.findByText('sunflower oil')).toBeTruthy()
		expect(screen.getByText('researchFooDbId:FDB000123')).toBeTruthy()
		expect(screen.getByText('researchPreviouslySupported:4')).toBeTruthy()
		expect(screen.queryByText('1:2')).toBeNull()
		expect(screen.queryByText('91%')).toBeNull()
		await waitFor(() => expect(mockedSuggest).not.toHaveBeenCalled())
	})
})

describe('research graph-evidence cutoff contract', () => {
	type MutableResponse = {
		contractVersion: string
		calibration: Record<string, unknown>
		disposition: string
		rankerProvenance: unknown
		abstentionReasons: string[]
		candidates: Array<Record<string, unknown>>
		[key: string]: unknown
	}

	const supportedResponse = (): MutableResponse => ({
		contractVersion: 'graph-evidence-v2',
		graphStatus: 'ready',
		graphProvenance: {
			artifactId: 'graph-2026-01',
			manifestSha256: 'a'.repeat(64),
			sourceSplit: 'train',
			transformationId: 'graph-v1',
		},
		calibration: {
			status: 'ok',
			bindingStatus: 'compatible',
			manifestSha256: 'b'.repeat(64),
			calibrationCaseCount: 200,
			cutoff: 10,
			noGuaranteeReason: null,
		},
		disposition: 'recommendations',
		rankerProvenance: {
			rankerId: 'ranker-v1',
			scorerSha256: 'c'.repeat(64),
		},
		hardFilterProvenance: {
			policyId: 'filter-v1',
			policySha256: 'd'.repeat(64),
		},
		abstentionReasons: [],
		candidates: [
			{
				candidateId: 'node-1',
				rank: 1,
				name: 'sunflower oil',
				fooDbId: null,
				knownNode: true,
				trainPairCount: 2,
				seen: true,
				ratio: null,
				confidenceScore: null,
			},
		],
	})

	it('accepts a compatible, sufficiently supported cutoff exactly at 10', () => {
		expect(parseResearchSubstitutionResponse(supportedResponse())).not.toBeNull()
	})

	it('accepts a ranked candidate list exactly at its finite cutoff', () => {
		const value = supportedResponse()
		value.calibration.cutoff = 2
		value.candidates.push({
			...value.candidates[0],
			candidateId: 'node-2',
			rank: 2,
		})
		expect(parseResearchSubstitutionResponse(value)).not.toBeNull()
	})

	it.each([
		['legacy v1 recommendation without a cutoff', (value: MutableResponse) => {
			value.contractVersion = 'graph-evidence-v1'
			delete value.calibration.cutoff
		}],
		['ok cutoff above 10', (value: MutableResponse) => {
			value.calibration.cutoff = 11
		}],
		['fractional finite cutoff', (value: MutableResponse) => {
			value.calibration.cutoff = 9.5
		}],
		['zero finite cutoff', (value: MutableResponse) => {
			value.calibration.cutoff = 0
		}],
		['negative finite cutoff', (value: MutableResponse) => {
			value.calibration.cutoff = -1
		}],
		['recommendation with an uninformative cutoff', (value: MutableResponse) => {
			value.calibration.status = 'uninformative'
			value.calibration.cutoff = 11
		}],
		['missing cutoff', (value: MutableResponse) => {
			delete value.calibration.cutoff
		}],
		['null cutoff on an ok state', (value: MutableResponse) => {
			value.calibration.cutoff = null
		}],
		['non-finite cutoff', (value: MutableResponse) => {
			value.calibration.cutoff = Number.POSITIVE_INFINITY
		}],
		['NaN cutoff', (value: MutableResponse) => {
			value.calibration.cutoff = Number.NaN
		}],
		['insufficient calibration support', (value: MutableResponse) => {
			value.calibration.calibrationCaseCount = 199
		}],
		['candidate count above the cutoff', (value: MutableResponse) => {
			value.calibration.cutoff = 1
			value.candidates.push({
				...value.candidates[0],
				candidateId: 'node-2',
				rank: 2,
			})
		}],
		['unknown graph candidate', (value: MutableResponse) => {
			value.candidates[0].knownNode = false
		}],
		['candidate without train support', (value: MutableResponse) => {
			value.candidates[0].trainPairCount = 0
			value.candidates[0].seen = false
		}],
		['non-contiguous candidate rank', (value: MutableResponse) => {
			value.candidates[0].rank = 2
		}],
	])('refuses %s', (_name, mutate) => {
		const value = supportedResponse()
		mutate(value)
		expect(parseResearchSubstitutionResponse(value)).toBeNull()
	})

	it('accepts an uninformative finite cutoff only as an empty abstention', () => {
		const value = supportedResponse()
		value.calibration.status = 'uninformative'
		value.calibration.cutoff = 11
		value.disposition = 'abstain'
		value.rankerProvenance = null
		value.abstentionReasons = ['calibration_not_ok']
		value.candidates = []
		expect(parseResearchSubstitutionResponse(value)).not.toBeNull()
	})

	it('accepts a vacuous null cutoff only as an empty abstention', () => {
		const value = supportedResponse()
		value.calibration.status = 'vacuous'
		value.calibration.cutoff = null
		value.disposition = 'abstain'
		value.rankerProvenance = null
		value.abstentionReasons = ['calibration_not_ok']
		value.candidates = []
		expect(parseResearchSubstitutionResponse(value)).not.toBeNull()
	})
})

describe('research substitution dialog positioning', () => {
	const viewport = { width: 390, height: 800 }
	const rect = (
		top: number,
		bottom: number,
		left: number,
		width: number,
		height: number,
	) => ({ top, bottom, left, width, height }) as DOMRect

	it('places the panel below when it fits', () => {
		expect(
			calculateSubstitutionDialogPosition(
				rect(100, 120, 24, 300, 200),
				rect(0, 0, 0, 300, 200),
				viewport,
			),
		).toEqual({ top: 128, left: 24 })
	})

	it('flips above a bottom-edge trigger when there is room', () => {
		expect(
			calculateSubstitutionDialogPosition(
				rect(730, 750, 360, 300, 300),
				rect(0, 0, 0, 300, 300),
				viewport,
			),
		).toEqual({ top: 422, left: 82 })
	})

	it('clamps tall panels inside the viewport and preserves internal scrolling', () => {
		expect(
			calculateSubstitutionDialogPosition(
				rect(100, 120, 24, 300, 1000),
				rect(0, 0, 0, 374, 1000),
				viewport,
			),
		).toEqual({ top: 8, left: 8 })
	})
})
