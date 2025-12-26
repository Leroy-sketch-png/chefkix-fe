import { create } from 'zustand'
import { getUnreadCount } from '@/services/notification'

interface NotificationState {
	unreadCount: number
	lastFetched: number | null
	isPolling: boolean

	// Actions
	setUnreadCount: (count: number) => void
	incrementUnreadCount: () => void
	decrementUnreadCount: () => void
	clearUnreadCount: () => void
	fetchUnreadCount: () => Promise<void>
	startPolling: () => void
	stopPolling: () => void
}

// Polling interval - 10 seconds for near real-time feel
const POLLING_INTERVAL = 10_000

let pollingIntervalId: NodeJS.Timeout | null = null

export const useNotificationStore = create<NotificationState>((set, get) => ({
	unreadCount: 0,
	lastFetched: null,
	isPolling: false,

	setUnreadCount: (count: number) => set({ unreadCount: count }),

	incrementUnreadCount: () =>
		set(state => ({ unreadCount: state.unreadCount + 1 })),

	decrementUnreadCount: () =>
		set(state => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

	clearUnreadCount: () => set({ unreadCount: 0 }),

	fetchUnreadCount: async () => {
		try {
			const response = await getUnreadCount()
			if (response.success && response.data !== undefined) {
				set({ unreadCount: response.data, lastFetched: Date.now() })
			}
		} catch {
			// Silently fail - don't break the app for notification count
		}
	},

	startPolling: () => {
		const state = get()
		if (state.isPolling) return // Already polling

		// Initial fetch
		get().fetchUnreadCount()

		// Set up polling
		pollingIntervalId = setInterval(() => {
			get().fetchUnreadCount()
		}, POLLING_INTERVAL)

		set({ isPolling: true })
	},

	stopPolling: () => {
		if (pollingIntervalId) {
			clearInterval(pollingIntervalId)
			pollingIntervalId = null
		}
		set({ isPolling: false })
	},
}))

/**
 * Hook to increment notification count when a new notification arrives
 * Can be called from WebSocket handlers, Kafka consumers, etc.
 */
export const notifyNewNotification = () => {
	useNotificationStore.getState().incrementUnreadCount()
}

/**
 * Hook to mark notifications as read
 * Call this when user views the notifications page
 */
export const markNotificationsRead = () => {
	useNotificationStore.getState().clearUnreadCount()
}
