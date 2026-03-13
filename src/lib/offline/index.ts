/**
 * Offline support module
 *
 * Provides:
 * - IndexedDB storage for request queuing
 * - Axios interceptor for transparent offline request queueing
 * - Sync service for replaying queued requests on reconnect
 */

export { isIndexedDBAvailable, queueRequest } from './offlineDb'
export type { QueuedRequest } from './offlineDb'
export {
	syncQueuedRequests,
	hasPendingSync,
	getPendingSyncCount,
} from './syncService'
export { installOfflineInterceptor } from './offlineInterceptor'
