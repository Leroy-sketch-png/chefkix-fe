export interface ReferralCodeResponse {
	code: string
	usageCount: number
	maxUses: number
	active: boolean
	createdAt: string
	shareUrl: string
}

export interface ReferralDetail {
	referredUsername: string
	referredAvatar: string | null
	xpAwarded: number
	redeemedAt: string
}

export interface ReferralStatsResponse {
	code: string
	totalReferrals: number
	totalXpEarned: number
	referrals: ReferralDetail[]
}

export interface RedeemReferralRequest {
	code: string
}
