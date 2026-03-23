/**
 * Push Notifications Utility
 *
 * Handles browser Notification API for timer alerts when app is backgrounded.
 * Uses native Notification API (not FCM) since these are local timer events.
 */

const PUSH_TIMER_ALERTS_KEY = 'chefkix:push:timerAlerts'

/** Check if the Notification API is available */
export function isNotificationSupported(): boolean {
	return typeof window !== 'undefined' && 'Notification' in window
}

/** Get current permission state */
export function getNotificationPermission(): NotificationPermission | null {
	if (!isNotificationSupported()) return null
	return Notification.permission
}

/**
 * Request notification permission from the browser.
 * Returns the resulting permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
	if (!isNotificationSupported()) return null

	// Already granted
	if (Notification.permission === 'granted') return 'granted'

	// Already denied — browser won't re-prompt
	if (Notification.permission === 'denied') return 'denied'

	try {
		const result = await Notification.requestPermission()
		return result
	} catch {
		return null
	}
}

/**
 * Show a browser notification for a completed timer.
 * Uses ServiceWorker showNotification if available (works when tab is backgrounded),
 * falls back to new Notification() constructor.
 */
export async function showTimerNotification(stepTitle: string): Promise<void> {
	if (!isNotificationSupported() || Notification.permission !== 'granted') return

	// Check user preference for timer alerts
	if (!getTimerAlertsEnabled()) return

	const options: NotificationOptions = {
		body: `${stepTitle} is ready!`,
		icon: '/icons/icon-192x192.png',
		badge: '/icons/icon-72x72.png',
		tag: `timer-${stepTitle}`, // Replaces existing notification with same tag
		requireInteraction: true, // Stay until dismissed
		silent: false,
	}

	try {
		// Prefer SW showNotification — works reliably when tab is backgrounded
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.ready
			await registration.showNotification('⏰ Timer Complete!', options)
			return
		}
	} catch {
		// Fall through to Notification constructor
	}

	// Fallback: direct Notification constructor
	try {
		new Notification('⏰ Timer Complete!', options)
	} catch {
		// Browser doesn't support Notification constructor — silent fail
	}
}

/**
 * Cache the user's timerAlerts preference in localStorage.
 * Called by settings page when push.timerAlerts is toggled.
 */
export function setTimerAlertsEnabled(enabled: boolean): void {
	if (typeof window === 'undefined') return
	localStorage.setItem(PUSH_TIMER_ALERTS_KEY, String(enabled))
}

/**
 * Read cached timerAlerts preference.
 * Defaults to true if never explicitly set (opt-in at permission level, default-on for timer alerts).
 */
export function getTimerAlertsEnabled(): boolean {
	if (typeof window === 'undefined') return false
	const value = localStorage.getItem(PUSH_TIMER_ALERTS_KEY)
	return value !== 'false' // Default true
}
