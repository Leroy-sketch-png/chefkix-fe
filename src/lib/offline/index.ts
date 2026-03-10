/**
 * Offline cooking support module
 * 
 * Provides:
 * - IndexedDB storage for request queuing and recipe caching
 * - Axios interceptor for transparent offline request queueing
 * - Sync service for replaying queued requests on reconnect
 * - React hooks for offline status and cooking support
 */

export { isIndexedDBAvailable, queueRequest, cacheRecipe, getCachedRecipe } from './offlineDb'
export type { QueuedRequest, CachedRecipe, OfflineSession } from './offlineDb'
export { syncQueuedRequests, hasPendingSync, getPendingSyncCount } from './syncService'
export { installOfflineInterceptor } from './offlineInterceptor'
