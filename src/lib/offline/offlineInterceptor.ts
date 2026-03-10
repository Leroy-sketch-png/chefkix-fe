/**
 * Offline interceptor for axios
 * 
 * When the browser is offline and a cooking session action fails,
 * instead of throwing an error, queue the request for replay.
 * 
 * Only queues non-GET requests to cooking-session endpoints,
 * since read operations need real data from the server.
 */

import { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { api } from '../axios'
import { queueRequest, isIndexedDBAvailable } from './offlineDb'

// Endpoints that are safe to queue for offline replay
const QUEUEABLE_PATTERNS = [
	'/cooking-sessions/', // step navigation, timer events, step completion
]

function isQueueableRequest(url: string | undefined, method: string | undefined): boolean {
	if (!url || !method) return false
	const m = method.toUpperCase()
	// Only queue state-mutating requests (not GETs)
	if (m === 'GET') return false
	// Only queue cooking session actions
	return QUEUEABLE_PATTERNS.some(pattern => url.includes(pattern))
}

/**
 * Install the offline error interceptor onto the axios instance.
 * Call once at app startup.
 */
export function installOfflineInterceptor(): void {
	if (typeof window === 'undefined') return
	if (!isIndexedDBAvailable()) return

	api.interceptors.response.use(
		// Success — passthrough
		response => response,
		// Error — check if it's a network error while offline
		async (error: AxiosError) => {
			const config = error.config as InternalAxiosRequestConfig & {
				_offlineQueued?: boolean
			}

			// Already queued or not a network error — pass through
			if (config?._offlineQueued || error.response) {
				return Promise.reject(error)
			}

			// It's a network error (no response). Check if offline and queueable.
			if (
				!navigator.onLine &&
				isQueueableRequest(config?.url, config?.method)
			) {
				try {
					await queueRequest({
						url: config.url || '',
						method: (config.method?.toUpperCase() || 'POST') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
						body: config.data ? JSON.parse(config.data) : undefined,
						headers: config.headers
							? Object.fromEntries(
									Object.entries(config.headers).filter(
										([, v]) => typeof v === 'string',
									),
								)
							: undefined,
						priority: 10, // Normal priority
					})

					// Return a fake successful response so the UI doesn't break
					return {
						data: {
							success: true,
							statusCode: 202,
							message: 'Queued for sync when online',
							data: null,
						},
						status: 202,
						statusText: 'Accepted (Offline)',
						headers: {},
						config,
					}
				} catch (queueError) {
					console.error('[Offline] Failed to queue request:', queueError)
				}
			}

			return Promise.reject(error)
		},
	)
}
