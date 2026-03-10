/**
 * Comprehensive offline cooking hook
 * Manages offline state, request queueing, and sync on reconnect
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useOnlineStatus } from './useOnlineStatus'
import {
	queueRequest,
	cacheRecipe,
	getCachedRecipe,
	saveOfflineSession,
	getOfflineSession,
	removeOfflineSession,
	isIndexedDBAvailable,
	QueuedRequest,
	OfflineSession,
} from '@/lib/offline/offlineDb'
import {
	syncQueuedRequests,
	getPendingSyncCount,
} from '@/lib/offline/syncService'

export interface UseOfflineCookingOptions {
	/** Auto-sync when coming back online */
	autoSync?: boolean
	/** Show toast notifications for sync status */
	showNotifications?: boolean
}

export interface UseOfflineCookingResult {
	/** Current online/offline status */
	isOnline: boolean
	/** Whether we're currently syncing queued requests */
	isSyncing: boolean
	/** Number of queued requests waiting to sync */
	pendingCount: number
	/** Whether the device supports offline mode */
	isSupported: boolean

	// Actions
	/** Queue a request for offline replay */
	queueOfflineRequest: (
		request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>,
	) => Promise<void>
	/** Cache a recipe for offline cooking */
	cacheRecipeForOffline: (recipeId: string, data: unknown) => Promise<void>
	/** Get cached recipe data */
	getCachedRecipeData: (recipeId: string) => Promise<unknown | null>
	/** Save session state for offline */
	saveSessionState: (session: Omit<OfflineSession, 'lastUpdated'>) => Promise<void>
	/** Get offline session state */
	getSessionState: (sessionId: string) => Promise<OfflineSession | undefined>
	/** Clear offline session after sync */
	clearSessionState: (sessionId: string) => Promise<void>
	/** Manually trigger sync */
	triggerSync: () => Promise<void>
}

export function useOfflineCooking(
	options: UseOfflineCookingOptions = {},
): UseOfflineCookingResult {
	const { autoSync = true, showNotifications = true } = options

	const { isOnline, isOffline } = useOnlineStatus()
	const [isSyncing, setIsSyncing] = useState(false)
	const [pendingCount, setPendingCount] = useState(0)
	const [isSupported, setIsSupported] = useState(false)

	const wasOffline = useRef(false)

	// Check IndexedDB support on mount
	useEffect(() => {
		setIsSupported(isIndexedDBAvailable())
	}, [])

	// Update pending count periodically
	useEffect(() => {
		if (!isSupported) return

		const updatePendingCount = async () => {
			const count = await getPendingSyncCount()
			setPendingCount(count)
		}

		updatePendingCount()
		const interval = setInterval(updatePendingCount, 5000)
		return () => clearInterval(interval)
	}, [isSupported])

	// Auto-sync when coming back online
	useEffect(() => {
		if (!isSupported || !autoSync) return

		if (isOffline) {
			wasOffline.current = true
			if (showNotifications) {
				toast.info('You\'re offline — your progress will sync when you reconnect', {
					id: 'offline-status',
					duration: 5000,
				})
			}
		} else if (wasOffline.current && isOnline) {
			wasOffline.current = false
			// Came back online, trigger sync
			triggerSync()
		}
	}, [isOnline, isOffline, autoSync, isSupported, showNotifications])

	// Sync function
	const triggerSync = useCallback(async () => {
		if (!isSupported || isSyncing || !isOnline) return

		const count = await getPendingSyncCount()
		if (count === 0) return

		setIsSyncing(true)

		if (showNotifications) {
			toast.loading(`Syncing ${count} pending action${count > 1 ? 's' : ''}...`, {
				id: 'sync-status',
			})
		}

		try {
			const result = await syncQueuedRequests()

			if (showNotifications) {
				if (result.failed > 0) {
					toast.warning(
						`Synced ${result.success} action${result.success !== 1 ? 's' : ''}, ${result.failed} failed`,
						{ id: 'sync-status' },
					)
				} else if (result.success > 0) {
					toast.success(
						`Synced ${result.success} action${result.success !== 1 ? 's' : ''} successfully`,
						{ id: 'sync-status' },
					)
				} else {
					toast.dismiss('sync-status')
				}
			}

			setPendingCount(result.remaining)
		} catch (error) {
			console.error('[OfflineCooking] Sync failed:', error)
			if (showNotifications) {
				toast.error('Failed to sync offline changes', { id: 'sync-status' })
			}
		} finally {
			setIsSyncing(false)
		}
	}, [isSupported, isSyncing, isOnline, showNotifications])

	// Queue a request for offline replay
	const queueOfflineRequest = useCallback(
		async (
			request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>,
		) => {
			if (!isSupported) return
			await queueRequest(request)
			setPendingCount((prev) => prev + 1)
		},
		[isSupported],
	)

	// Cache recipe for offline access
	const cacheRecipeForOffline = useCallback(
		async (recipeId: string, data: unknown) => {
			if (!isSupported) return
			await cacheRecipe(recipeId, data)
		},
		[isSupported],
	)

	// Get cached recipe
	const getCachedRecipeData = useCallback(
		async (recipeId: string): Promise<unknown | null> => {
			if (!isSupported) return null
			const cached = await getCachedRecipe(recipeId)
			return cached?.data ?? null
		},
		[isSupported],
	)

	// Save session state
	const saveSessionState = useCallback(
		async (session: Omit<OfflineSession, 'lastUpdated'>) => {
			if (!isSupported) return
			await saveOfflineSession(session)
		},
		[isSupported],
	)

	// Get session state
	const getSessionState = useCallback(
		async (sessionId: string) => {
			if (!isSupported) return undefined
			return getOfflineSession(sessionId)
		},
		[isSupported],
	)

	// Clear session state
	const clearSessionState = useCallback(
		async (sessionId: string) => {
			if (!isSupported) return
			await removeOfflineSession(sessionId)
		},
		[isSupported],
	)

	return {
		isOnline,
		isSyncing,
		pendingCount,
		isSupported,
		queueOfflineRequest,
		cacheRecipeForOffline,
		getCachedRecipeData,
		saveSessionState,
		getSessionState,
		clearSessionState,
		triggerSync,
	}
}
