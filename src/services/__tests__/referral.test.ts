import { api } from '@/lib/axios'
import { logDevError } from '@/lib/dev-log'
import {
	getMyReferralCode,
	getReferralStats,
	redeemReferralCode,
} from '@/services/referral'

jest.mock('@/lib/axios', () => ({
	api: {
		get: jest.fn(),
		post: jest.fn(),
	},
}))

jest.mock('@/lib/dev-log', () => ({
	logDevError: jest.fn(),
}))

const mockedApi = api as unknown as {
	get: jest.Mock
	post: jest.Mock
}

const code = {
	code: 'ABCD2345',
	usageCount: 2,
	maxUses: 100,
	active: true,
	createdAt: '2026-08-03T00:00:00Z',
	shareUrl: 'https://chefkix.app/join?ref=ABCD2345',
}

describe('referral service truth', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('returns authoritative code and stats payloads', async () => {
		mockedApi.get
			.mockResolvedValueOnce({ data: { data: code } })
			.mockResolvedValueOnce({
				data: {
					data: {
						code: code.code,
						totalReferrals: 2,
						totalXpEarned: 200,
						referrals: [],
					},
				},
			})

		await expect(getMyReferralCode()).resolves.toEqual(code)
		await expect(getReferralStats()).resolves.toEqual(
			expect.objectContaining({ totalReferrals: 2 }),
		)
	})

	it('rejects and logs transport failures instead of returning false absence', async () => {
		const failure = new Error('network unavailable')
		mockedApi.get.mockRejectedValue(failure)

		await expect(getMyReferralCode()).rejects.toBe(failure)
		expect(logDevError).toHaveBeenCalledWith(
			'[Referral] getMyReferralCode failed:',
			failure,
		)
	})

	it('rejects successful envelopes that omit required referral data', async () => {
		mockedApi.get.mockResolvedValue({ data: { success: true, data: null } })

		await expect(getReferralStats()).rejects.toThrow(
			'Referral stats request returned no data',
		)
	})

	it('rejects a redemption response that does not confirm a code', async () => {
		mockedApi.post.mockResolvedValue({ data: { success: true, data: null } })

		await expect(redeemReferralCode({ code: 'ABCD2345' })).rejects.toThrow(
			'Referral redemption returned no data',
		)
	})
})
