'use client'

import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Wifi, WifiOff } from 'lucide-react'

/**
 * NetworkStatusProvider - Monitors network connectivity and shows toasts
 *
 * RECONNECT.7: Network reconnection toast on reconnect
 * - Shows offline warning when connection is lost
 * - Shows success toast when connection is restored
 * - Debounces rapid online/offline flickers
 *
 * Place this component once in your app layout (e.g., in providers).
 */
export const NetworkStatusProvider = () => {
	const wasOffline = useRef(false)
	const toastId = useRef<string | number | undefined>(undefined)

	const handleOnline = useCallback(() => {
		// Only show reconnection toast if we were previously offline
		if (wasOffline.current) {
			// Dismiss the offline toast if still showing
			if (toastId.current) {
				toast.dismiss(toastId.current)
				toastId.current = undefined
			}

			toast.success("You're back online!", {
				description: 'Your connection has been restored.',
				icon: <Wifi className='size-5 text-success' />,
				duration: 3000,
			})
		}
		wasOffline.current = false
	}, [])

	const handleOffline = useCallback(() => {
		wasOffline.current = true
		toastId.current = toast.warning("You're offline", {
			description: 'Some features may be unavailable until you reconnect.',
			icon: <WifiOff className='size-5 text-warning' />,
			duration: Infinity, // Keep showing until we're back online
			id: 'network-offline', // Prevent duplicates
		})
	}, [])

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
