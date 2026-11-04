import {
	refreshAccessToken,
	shouldRefreshToken,
	isTokenExpired,
} from '@/lib/tokenManager'
import { useAuthStore } from '@/store/authStore'
import app from '@/configs/app'

const SESSION_EXPIRED_MESSAGE = 'Session expired. Please sign in again.'

export function getWebSocketUrl(): string {
	const wsBase = app.API_BASE_URL.replace(/^http/, 'ws')
	return `${wsBase}/api/v1/ws`
}

export function getReadableWebSocketError(message?: string | null): string {
	if (!message) {
		return 'Connection error'
	}

	if (isWebSocketAuthenticationError(message)) {
		return SESSION_EXPIRED_MESSAGE
	}

	return message
}

export function isWebSocketAuthenticationError(
	message?: string | null,
): boolean {
	if (!message) return false

	const normalized = message.toLowerCase()
	return (
		normalized.includes('expired') ||
		normalized.includes('unauth') ||
		normalized.includes('authentication') ||
		normalized.includes('forbidden')
	)
}

export async function getFreshWebSocketAccessToken(): Promise<string | null> {
	const initialAuth = useAuthStore.getState()
	const { accessToken } = initialAuth

	if (!accessToken) {
		return null
	}

	if (!isTokenExpired(accessToken) && !shouldRefreshToken(accessToken)) {
		return accessToken
	}

	const ownerId = initialAuth.user?.userId
	if (
		!ownerId ||
		!initialAuth.isAuthenticated ||
		initialAuth.isLoggingOut
	) {
		return null
	}

	const result = await refreshAccessToken(
		newToken => {
			const current = useAuthStore.getState()
			if (
				current.isAuthenticated &&
				!current.isLoggingOut &&
				current.user?.userId === ownerId &&
				current.accessToken === accessToken
			) {
				useAuthStore.setState({ accessToken: newToken })
			}
		},
		() => {
			const current = useAuthStore.getState()
			if (
				current.isAuthenticated &&
				!current.isLoggingOut &&
				current.user?.userId === ownerId &&
				current.accessToken === accessToken
			) {
				current.logout()
			}
		},
	)
	const current = useAuthStore.getState()
	if (
		result.success &&
		result.token &&
		current.isAuthenticated &&
		!current.isLoggingOut &&
		current.user?.userId === ownerId &&
		current.accessToken === result.token
	) {
		return result.token
	}

	return null
}

export const WEBSOCKET_SESSION_EXPIRED_MESSAGE = SESSION_EXPIRED_MESSAGE
