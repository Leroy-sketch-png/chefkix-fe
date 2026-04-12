import {
	refreshAccessToken,
	shouldRefreshToken,
	isTokenExpired,
} from '@/lib/tokenManager'
import { useAuthStore } from '@/store/authStore'

const SESSION_EXPIRED_MESSAGE = 'Session expired. Please sign in again.'

export function getWebSocketUrl(): string {
	const apiBase = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'
	const wsBase = apiBase.replace(/^http/, 'ws')
	return `${wsBase}/api/v1/ws`
}

export function getReadableWebSocketError(message?: string | null): string {
	if (!message) {
		return 'Connection error'
	}

	const normalized = message.toLowerCase()
	if (
		normalized.includes('expired') ||
		normalized.includes('unauth') ||
		normalized.includes('authentication')
	) {
		return SESSION_EXPIRED_MESSAGE
	}

	return message
}

export async function getFreshWebSocketAccessToken(): Promise<string | null> {
	const { accessToken, login, logout } = useAuthStore.getState()

	if (!accessToken) {
		return null
	}

	if (!isTokenExpired(accessToken) && !shouldRefreshToken(accessToken)) {
		return accessToken
	}

	const result = await refreshAccessToken(login, logout)
	if (result.success && result.token) {
		return result.token
	}

	return null
}

export const WEBSOCKET_SESSION_EXPIRED_MESSAGE = SESSION_EXPIRED_MESSAGE
