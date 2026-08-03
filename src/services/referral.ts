import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse } from '@/lib/types'
import {
	ReferralCodeResponse,
	ReferralStatsResponse,
	RedeemReferralRequest,
} from '@/lib/types/referral'
import { logDevError } from '@/lib/dev-log'

// ============================================
// QUERIES
// ============================================

function requireReferralData<T>(
	data: T | null | undefined,
	operation: string,
): T {
	if (data == null) {
		throw new Error(`Referral ${operation} returned no data`)
	}
	return data
}

export async function getMyReferralCode(): Promise<ReferralCodeResponse> {
	try {
		const res = await api.get<ApiResponse<ReferralCodeResponse>>(
			API_ENDPOINTS.REFERRALS.MY_CODE,
		)
		return requireReferralData(res.data.data, 'code request')
	} catch (err) {
		logDevError('[Referral] getMyReferralCode failed:', err)
		throw err
	}
}

export async function getReferralStats(): Promise<ReferralStatsResponse> {
	try {
		const res = await api.get<ApiResponse<ReferralStatsResponse>>(
			API_ENDPOINTS.REFERRALS.STATS,
		)
		return requireReferralData(res.data.data, 'stats request')
	} catch (err) {
		logDevError('[Referral] getReferralStats failed:', err)
		throw err
	}
}

// ============================================
// MUTATIONS
// ============================================

export async function redeemReferralCode(
	request: RedeemReferralRequest,
): Promise<ReferralCodeResponse> {
	try {
		const res = await api.post<ApiResponse<ReferralCodeResponse>>(
			API_ENDPOINTS.REFERRALS.REDEEM,
			request,
		)
		return requireReferralData(res.data.data, 'redemption')
	} catch (err) {
		logDevError('[Referral] redeemReferralCode failed:', err)
		throw err
	}
}
