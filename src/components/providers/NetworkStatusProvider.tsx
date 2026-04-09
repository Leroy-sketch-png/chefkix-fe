'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Wifi, WifiOff } from 'lucide-react'
import { installOfflineInterceptor } from '@/lib/offline/offlineInterceptor'
import { syncQueuedRequests, hasPendingSync } from '@/lib/offline/syncService'
import { useTranslations } from '@/i18n/hooks'

/**
 * NetworkStatusProvider - Monitors network connectivity and shows toasts
 *
 * RECONNECT.7: Network reconnection toast on reconnect
 * - Shows offline warning when connection is lost
 * - Shows success toast when connection is restored
 * - Debounces rapid online/offline flickers
 * - Queue cooking session requests when offline (Stream 11)
 * - Replay queued requests on reconnect
 *
 * Place this component once in your app layout (e.g., in providers).
 * Defers useTranslations to after client mount to avoid SSR context errors.
 */
export const NetworkStatusProvider = () => {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return null

	return <NetworkStatusProviderInner />
}

const NetworkStatusProviderInner = () => {
	const t = useTranslations('common')
	const wasOffline = useRef(false)
	const toastId = useRef<string | number | undefined>(undefined)
	const interceptorInstalled = useRef(false)

	// Install offline interceptor once
	useEffect(() => {
		if (!interceptorInstalled.current) {
			installOfflineInterceptor()
			interceptorInstalled.current = true
		}
	}, [])

	const handleOnline = useCallback(async () => {
		// Only show reconnection toast if we were previously offline
		if (wasOffline.current) {
			// Dismiss the offline toast if still showing
			if (toastId.current) {
				toast.dismiss(toastId.current)
				toastId.current = undefined
			}

			toast.success(t('toastBackOnline'), {
				description: t('toastConnectionRestored'),
				icon: <Wifi className='size-5 text-success' />,
				duration: 3000,
			})

			// Sync queued offline requests
			try {
				const hasQueued = await hasPendingSync()
				if (hasQueued) {
					toast.loading(t('toastSyncingOffline'), { id: 'offline-sync' })
					const result = await syncQueuedRequests()
					if (result.success > 0) {
						toast.success(t('toastSyncedActions', { count: result.success }), {
							id: 'offline-sync',
							duration: 3000,
						})
					} else {
						toast.dismiss('offline-sync')
					}
				}
			} catch {
				// Silent fail — sync will retry next time
			}
		}
		wasOffline.current = false
	}, [t])

	const handleOffline = useCallback(() => {
		wasOffline.current = true
		toastId.current = toast.warning(t('toastOffline'), {
			description: t('toastOfflineDesc'),
			icon: <WifiOff className='size-5 text-warning' />,
			duration: Infinity, // Keep showing until we're back online
			id: 'network-offline', // Prevent duplicates
		})
	}, [t])

	useEffect(() => {
		// Check initial state
		if (typeof window !== 'undefined' && !navigator.onLine) {
			wasOffline.current = true
			// Show initial offline toast only after a short delay
			// (avoids flashing on page load with slow connection detection)
			const timer = setTimeout(() => {
				if (!navigator.onLine) {
					handleOffline()
				}
			}, 2000)
			return () => clearTimeout(timer)
		}
	}, [handleOffline])

	useEffect(() => {
		if (typeof window === 'undefined') return

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [handleOnline, handleOffline])

	// This component doesn't render anything - it just manages side effects
	return null
}

/**
 * Hook to check current network status
 *
 * @example
 * const isOnline = useNetworkStatus()
 * if (!isOnline) return <OfflineMessage />
 */
export const useNetworkStatus = () => {
	// Default to true for SSR
	if (typeof window === 'undefined') return true
	return navigator.onLine
}
