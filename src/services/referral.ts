import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse } from '@/lib/types'
import {
	ReferralCodeResponse,
	ReferralStatsResponse,
	RedeemReferralRequest,
} from '@/lib/types/referral'

// ============================================
// QUERIES
// ============================================

export async function getMyReferralCode(): Promise<ReferralCodeResponse | null> {
	try {
		const res = await api.get<ApiResponse<ReferralCodeResponse>>(
			API_ENDPOINTS.REFERRALS.MY_CODE,
		)
		return res.data.data ?? null
	} catch {
		return null
	}
}

export async function getReferralStats(): Promise<ReferralStatsResponse | null> {
	try {
		const res = await api.get<ApiResponse<ReferralStatsResponse>>(
			API_ENDPOINTS.REFERRALS.STATS,
		)
		return res.data.data ?? null
	} catch {
		return null
	}
}

// ============================================
// MUTATIONS
// ============================================

export async function redeemReferralCode(
	request: RedeemReferralRequest,
): Promise<ReferralCodeResponse | null> {
	try {
		const res = await api.post<ApiResponse<ReferralCodeResponse>>(
			API_ENDPOINTS.REFERRALS.REDEEM,
			request,
		)
		return res.data.data ?? null
	} catch {
		return null
	}
}
