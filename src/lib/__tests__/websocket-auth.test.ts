import {
	getReadableWebSocketError,
	isWebSocketAuthenticationError,
} from '@/lib/websocket-auth'

describe('WebSocket authentication errors', () => {
	it.each([
		'Authentication required for WebSocket connection',
		'Unauthorized',
		'Access token expired',
		'Forbidden',
	])('classifies %s as a terminal authentication failure', message => {
		expect(isWebSocketAuthenticationError(message)).toBe(true)
		expect(getReadableWebSocketError(message)).toBe(
			'Session expired. Please sign in again.',
		)
	})

	it.each(['Connection reset', 'Broker unavailable', null, undefined])(
		'does not misclassify %s as an authentication failure',
		message => {
			expect(isWebSocketAuthenticationError(message)).toBe(false)
		},
	)
})
