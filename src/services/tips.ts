import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse } from '@/lib/types'
import {
	CreatorTipSettings,
	Tip,
	SendTipRequest,
	UpdateTipSettingsRequest,
} from '@/lib/types/tips'

// ============================================
// SETTINGS
// ============================================

export async function getMyTipSettings(): Promise<CreatorTipSettings | null> {
	const res = await api.get<ApiResponse<CreatorTipSettings>>(
		API_ENDPOINTS.TIPS.MY_SETTINGS,
	)
	return res.data.data ?? null
}

export async function updateTipSettings(
	request: UpdateTipSettingsRequest,
): Promise<CreatorTipSettings | null> {
	const res = await api.put<ApiResponse<CreatorTipSettings>>(
		API_ENDPOINTS.TIPS.UPDATE_SETTINGS,
		request,
	)
	return res.data.data ?? null
}

export async function getCreatorTipSettings(
	creatorId: string,
): Promise<CreatorTipSettings | null> {
	const res = await api.get<ApiResponse<CreatorTipSettings>>(
		API_ENDPOINTS.TIPS.CREATOR_SETTINGS(creatorId),
	)
	return res.data.data ?? null
}

// ============================================
// SEND TIP
// ============================================

export async function sendTip(request: SendTipRequest): Promise<Tip | null> {
	const res = await api.post<ApiResponse<Tip>>(
		API_ENDPOINTS.TIPS.SEND,
		request,
	)
	return res.data.data ?? null
}

// ============================================
// HISTORY
// ============================================

export async function getReceivedTips(): Promise<Tip[]> {
	const res = await api.get<ApiResponse<Tip[]>>(
		API_ENDPOINTS.TIPS.RECEIVED,
	)
	return res.data.data ?? []
}

export async function getSentTips(): Promise<Tip[]> {
	const res = await api.get<ApiResponse<Tip[]>>(API_ENDPOINTS.TIPS.SENT)
	return res.data.data ?? []
}
