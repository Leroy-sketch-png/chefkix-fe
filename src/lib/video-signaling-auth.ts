import app from '@/configs/app'
import { API_ENDPOINTS } from '@/constants/api'
import { buildWebSocketUrl } from '@/lib/api-origin'

export const VIDEO_SIGNALING_PROTOCOL = 'chefkix.video'
export const VIDEO_SIGNALING_BEARER_PROTOCOL_PREFIX = 'bearer.'

export function buildVideoSignalingUrl(): string {
	const pageOrigin =
		typeof window === 'undefined' ? undefined : window.location.origin
	return buildWebSocketUrl(
		API_ENDPOINTS.CHAT.VIDEO_SIGNALING_WS,
		app.API_BASE_URL,
		pageOrigin,
	)
}

export function buildVideoSignalingProtocols(accessToken: string): string[] {
	const token = accessToken.trim()

	if (!token) {
		return [VIDEO_SIGNALING_PROTOCOL]
	}

	return [
		VIDEO_SIGNALING_PROTOCOL,
		`${VIDEO_SIGNALING_BEARER_PROTOCOL_PREFIX}${token}`,
	]
}
