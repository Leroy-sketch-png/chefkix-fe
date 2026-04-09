/**
 * Sync service for replaying queued offline requests
 */

import { api } from '@/lib/axios'
import {
	getQueuedRequests,
	removeQueuedRequest,
	incrementRetryCount,
	getQueueCount,
	QueuedRequest,
} from './offlineDb'

const MAX_RETRIES = 3

export interface SyncResult {
	success: number
	failed: number
	remaining: number
}

/**
 * Replay all queued requests in order
 * Called when the app comes back online
 */
export async function syncQueuedRequests(): Promise<SyncResult> {
	const requests = await getQueuedRequests()
	let success = 0
	let failed = 0

	for (const request of requests) {
		try {
			await replayRequest(request)
			await removeQueuedRequest(request.id)
			success++
		} catch (error) {
			if (process.env.NODE_ENV === 'development')
				console.error(`[Sync] Failed to replay request ${request.id}:`, error)

			if (request.retryCount >= MAX_RETRIES) {
				// Give up on this request
				await removeQueuedRequest(request.id)
				failed++
			} else {
				// Keep for retry
				await incrementRetryCount(request.id)
			}
		}
	}

	const remaining = await getQueueCount()

	return { success, failed, remaining }
}

/**
 * Replay a single queued request
 */
async function replayRequest(request: QueuedRequest): Promise<void> {
	const config = {
		method: request.method,
		url: request.url,
		data: request.body,
		headers: request.headers,
	}

	// Don't use interceptors for replayed requests to avoid token refresh loops
	await api.request(config)
}

/**
 * Check if there are pending requests to sync
 */
export async function hasPendingSync(): Promise<boolean> {
	const count = await getQueueCount()
	return count > 0
}

/**
 * Get the count of pending requests
 */
export async function getPendingSyncCount(): Promise<number> {
	return getQueueCount()
}
