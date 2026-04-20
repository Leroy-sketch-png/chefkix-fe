import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import { ApiResponse } from '@/lib/types'
import {
	CreatorTipSettings,
	Tip,
	SendTipRequest,
	UpdateTipSettingsRequest,
} from '@/lib/types/tips'
import { logDevError } from '@/lib/dev-log'

// ============================================
// SETTINGS
// ============================================

export async function getMyTipSettings(): Promise<CreatorTipSettings | null> {
	try {
		const res = await api.get<ApiResponse<CreatorTipSettings>>(
			API_ENDPOINTS.TIPS.MY_SETTINGS,
		)
		return res.data.data ?? null
	} catch (err) {
		logDevError('[Tips] getMyTipSettings failed:', err)
		return null
	}
}

export async function updateTipSettings(
	request: UpdateTipSettingsRequest,
): Promise<CreatorTipSettings | null> {
	try {
		const res = await api.put<ApiResponse<CreatorTipSettings>>(
			API_ENDPOINTS.TIPS.UPDATE_SETTINGS,
			request,
		)
		return res.data.data ?? null
	} catch (err) {
		logDevError('[Tips] updateTipSettings failed:', err)
		throw err
	}
}

export async function getCreatorTipSettings(
	creatorId: string,
): Promise<CreatorTipSettings | null> {
	try {
		const res = await api.get<ApiResponse<CreatorTipSettings>>(
			API_ENDPOINTS.TIPS.CREATOR_SETTINGS(creatorId),
		)
		return res.data.data ?? null
	} catch (err) {
		logDevError('[Tips] getCreatorTipSettings failed:', err)
		return null
	}
}

// ============================================
// SEND TIP
// ============================================

export async function sendTip(request: SendTipRequest): Promise<Tip | null> {
	try {
		const res = await api.post<ApiResponse<Tip>>(
			API_ENDPOINTS.TIPS.SEND,
			request,
		)
		return res.data.data ?? null
	} catch (err) {
		logDevError('[Tips] sendTip failed:', err)
		throw err
	}
}

// ============================================
// HISTORY
// ============================================

export async function getReceivedTips(): Promise<Tip[]> {
	try {
		const res = await api.get<ApiResponse<Tip[]>>(API_ENDPOINTS.TIPS.RECEIVED)
		return res.data.data ?? []
	} catch (err) {
		logDevError('[Tips] getReceivedTips failed:', err)
		return []
	}
}

export async function getSentTips(): Promise<Tip[]> {
	try {
		const res = await api.get<ApiResponse<Tip[]>>(API_ENDPOINTS.TIPS.SENT)
		return res.data.data ?? []
	} catch (err) {
		logDevError('[Tips] getSentTips failed:', err)
		return []
	}
}
