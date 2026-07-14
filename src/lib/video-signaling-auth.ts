import app from '@/configs/app'
import { API_ENDPOINTS } from '@/constants/api'

export const VIDEO_SIGNALING_PROTOCOL = 'chefkix.video'
export const VIDEO_SIGNALING_BEARER_PROTOCOL_PREFIX = 'bearer.'

export function buildVideoSignalingUrl(): string {
	return `${app.API_BASE_URL.replace(/^http/, 'ws')}${API_ENDPOINTS.CHAT.VIDEO_SIGNALING_WS}`
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
