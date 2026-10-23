import { aiApi } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { fetchResearchSubstitutionEvidence } from '../ai'

jest.mock('@/lib/axios', () => ({
	aiApi: { post: jest.fn() },
}))

const mockedPost = jest.mocked(aiApi.post)

describe('fetchResearchSubstitutionEvidence response envelope', () => {
	beforeEach(() => mockedPost.mockReset())

	it('returns the research DTO from the AI service ApiResponse envelope', async () => {
		const dto = {
			contractVersion: 'graph-preflight-v2',
			sourceIdentityStatus: 'ambiguous',
			sourceIngredientId: null,
			graphStatus: 'not_evaluated',
			disposition: 'abstain',
			abstentionReason: 'source_identity_ambiguous',
		}
		mockedPost.mockResolvedValue({
			data: { success: true, statusCode: 200, data: dto },
		} as Awaited<ReturnType<typeof aiApi.post>>)

		await expect(
			fetchResearchSubstitutionEvidence('celery leaf'),
		).resolves.toEqual(dto)
		expect(mockedPost).toHaveBeenCalledWith(
			API_ENDPOINTS.AI.RESEARCH_SUGGEST_SUBSTITUTIONS,
			{ ingredient: 'celery leaf' },
		)
	})

	it('fails closed for an unsuccessful or missing-data envelope', async () => {
		mockedPost.mockResolvedValue({
			data: { success: false, statusCode: 503, data: null },
		} as Awaited<ReturnType<typeof aiApi.post>>)

		await expect(
			fetchResearchSubstitutionEvidence('celery leaf'),
		).rejects.toThrow('Research substitution response envelope is invalid')
	})

	it('rejects a truthy non-boolean success marker', async () => {
		mockedPost.mockResolvedValue({
			data: {
				success: 'false',
				statusCode: 200,
				data: { contractVersion: 'graph-preflight-v2' },
			},
		} as Awaited<ReturnType<typeof aiApi.post>>)

		await expect(
			fetchResearchSubstitutionEvidence('celery leaf'),
		).rejects.toThrow('Research substitution response envelope is invalid')
	})
})
