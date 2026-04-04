/**
 * Firebase Client SDK Configuration
 *
 * Initializes Firebase for push notifications via FCM.
 * Only loads when Firebase config env vars are present.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/** Whether Firebase is configured (all required env vars present) */
export function isFirebaseConfigured(): boolean {
	return !!(
		firebaseConfig.apiKey &&
		firebaseConfig.projectId &&
		firebaseConfig.messagingSenderId &&
		firebaseConfig.appId
	)
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

/** Get or initialize the Firebase app */
function getApp(): FirebaseApp | null {
	if (typeof window === 'undefined') return null
	if (!isFirebaseConfigured()) return null

	if (!app) {
		const existing = getApps()
		app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig)
	}
	return app
}

/** Get Firebase Messaging instance */
export function getFirebaseMessaging(): Messaging | null {
	if (typeof window === 'undefined') return null
	if (messaging) return messaging

	const firebaseApp = getApp()
	if (!firebaseApp) return null

	try {
		messaging = getMessaging(firebaseApp)
		return messaging
	} catch {
		return null
	}
}

/**
 * Get the FCM token for this browser.
 * Requires notification permission to be granted first.
 * Returns null if Firebase is not configured or token retrieval fails.
 */
export async function getFCMToken(): Promise<string | null> {
	const msg = getFirebaseMessaging()
	if (!msg) return null

	// VAPID key for web push — allows FCM to send to this browser
	const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
	if (!vapidKey) return null

	try {
		// Register and configure the Firebase messaging service worker
		const swRegistration = await registerFirebaseSW()

		const token = await getToken(msg, {
			vapidKey,
			serviceWorkerRegistration: swRegistration || undefined,
		})
		return token || null
	} catch {
		return null
	}
}

/**
 * Register the firebase-messaging-sw.js and send it the Firebase config.
 * The SW can't access process.env, so we pass config via postMessage.
 */
async function registerFirebaseSW(): Promise<ServiceWorkerRegistration | null> {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null

	try {
		const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

		// Wait for the SW to be active
		const sw = registration.active || registration.installing || registration.waiting
		if (sw) {
			const sendConfig = () => {
				sw.postMessage({
					type: 'FIREBASE_CONFIG',
					config: firebaseConfig,
				})
			}

			if (sw.state === 'activated') {
				sendConfig()
			} else {
				sw.addEventListener('statechange', () => {
					if (sw.state === 'activated') sendConfig()
				})
			}
		}

		return registration
	} catch {
		return null
	}
}

/**
 * Listen for foreground push messages.
 * When the app is in the foreground, FCM delivers messages here instead of the SW.
 * Returns an unsubscribe function, or null if Firebase is not configured.
 */
export function onForegroundMessage(
	callback: (payload: {
		notification?: { title?: string; body?: string }
		data?: Record<string, string>
	}) => void
): (() => void) | null {
	const msg = getFirebaseMessaging()
	if (!msg) return null

	return onMessage(msg, callback)
}
