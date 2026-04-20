import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import type { TrackingEvent, TrackingEventType } from '@/lib/types/events'
import { useAuthStore } from '@/store/authStore'
import app from '@/configs/app'

const BATCH_INTERVAL_MS = 10_000
const MAX_BATCH_SIZE = 50
const DWELL_THRESHOLD_MS = 2_000
const SEARCH_DEBOUNCE_MS = 500
const TRACKING_OPTOUT_KEY = 'chefkix_tracking_optout'
const API_BASE_URL = app.API_BASE_URL

export function isTrackingOptedOut(): boolean {
	if (typeof window === 'undefined') return false
	try {
		return localStorage.getItem(TRACKING_OPTOUT_KEY) === 'true'
	} catch {
		return false
	}
}

export function setTrackingOptOut(optOut: boolean) {
	if (typeof window === 'undefined') return
	try {
		if (optOut) {
			localStorage.setItem(TRACKING_OPTOUT_KEY, 'true')
			// Stop tracker immediately
			destroyEventTracker()
		} else {
			localStorage.removeItem(TRACKING_OPTOUT_KEY)
		}
	} catch {
		/* storage unavailable */
	}
}

let eventQueue: TrackingEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let initialized = false

function enqueue(event: TrackingEvent) {
	if (isTrackingOptedOut()) return

	eventQueue.push({
		...event,
		timestamp: event.timestamp || new Date().toISOString(),
	})

	if (eventQueue.length >= MAX_BATCH_SIZE) {
		flush()
	}
}

async function flush() {
	if (eventQueue.length === 0) return

	const batch = eventQueue.splice(0, MAX_BATCH_SIZE)

	try {
		await api.post(API_ENDPOINTS.EVENTS.TRACK, { events: batch })
	} catch (err: unknown) {
		// Don't re-enqueue on auth errors — user isn't logged in, data would be rejected anyway
		const status = (err as { response?: { status?: number } })?.response?.status
		if (status === 401 || status === 403) return
		// On transient failure, re-enqueue at front for next flush (capped to prevent unbounded growth)
		eventQueue.unshift(...batch)
		if (eventQueue.length > 500) {
			eventQueue.length = 500
		}
	}
}

function flushBeacon() {
	if (eventQueue.length === 0) return

	const batch = eventQueue.splice(0)
	const accessToken = useAuthStore.getState().accessToken
	if (!accessToken) return

	void fetch(`${API_BASE_URL}${API_ENDPOINTS.EVENTS.TRACK}`, {
		method: 'POST',
		keepalive: true,
		credentials: 'include',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ events: batch }),
	}).catch(() => {
		// Best-effort delivery during unload; ignore failures.
	})
}

// ─── Public API ─────────────────────────────────────────────────────

function handleVisibilityChange() {
	if (document.visibilityState === 'hidden') {
		flushBeacon()
	}
}

export function initEventTracker() {
	if (initialized || typeof window === 'undefined') return
	if (isTrackingOptedOut()) return

	flushTimer = setInterval(flush, BATCH_INTERVAL_MS)

	window.addEventListener('visibilitychange', handleVisibilityChange)

	window.addEventListener('pagehide', flushBeacon)

	initialized = true
}

export function destroyEventTracker() {
	if (flushTimer) {
		clearInterval(flushTimer)
		flushTimer = null
	}
	if (typeof window !== 'undefined') {
		window.removeEventListener('visibilitychange', handleVisibilityChange)
		window.removeEventListener('pagehide', flushBeacon)
	}
	flushBeacon()

	// Clean up dwell timers to prevent leaked timeouts
	dwellTimers.forEach(t => clearTimeout(t))
	dwellTimers.clear()
	dwellStartTimes.clear()

	// Clean up search debounce timer
	if (searchDebounceTimer) {
		clearTimeout(searchDebounceTimer)
		searchDebounceTimer = null
	}

	lastScrollDepth = 0
	initialized = false
}

export function trackEvent(
	eventType: TrackingEventType,
	entityId?: string,
	entityType?: string,
	metadata?: Record<string, unknown>,
) {
	enqueue({ eventType, entityId, entityType, metadata })
}

export function trackPageView(path: string) {
	trackEvent('PAGE_VIEWED', undefined, 'page', { path })
}

// ─── Dwell Tracking ──────────────────────────────────────────────────

const dwellTimers = new Map<string, ReturnType<typeof setTimeout>>()
const dwellStartTimes = new Map<string, number>()

export function startDwellTracking(entityId: string, entityType: string) {
	if (dwellTimers.has(entityId)) return

	// Record when the user started dwelling
	dwellStartTimes.set(entityId, Date.now())

	const timer = setTimeout(() => {
		// After threshold, keep tracking — actual dwell will be sent on stop
		dwellTimers.delete(entityId)
	}, DWELL_THRESHOLD_MS)

	dwellTimers.set(entityId, timer)
}

export function stopDwellTracking(entityId: string) {
	const timer = dwellTimers.get(entityId)
	if (timer) {
		clearTimeout(timer)
		dwellTimers.delete(entityId)
	}

	const startTime = dwellStartTimes.get(entityId)
	if (startTime) {
		const dwellMs = Date.now() - startTime
		dwellStartTimes.delete(entityId)

		// Only track if user dwelled longer than threshold
		if (dwellMs >= DWELL_THRESHOLD_MS) {
			trackEvent('POST_DWELLED', entityId, 'post', { dwellMs })
		}
	}
}

// ─── Search Tracking (debounced) ─────────────────────────────────────

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

export function trackSearch(query: string, resultCount?: number) {
	if (searchDebounceTimer) clearTimeout(searchDebounceTimer)

	searchDebounceTimer = setTimeout(() => {
		if (query.trim().length >= 2) {
			trackEvent('RECIPE_SEARCH', undefined, 'search', {
				query: query.trim(),
				resultCount,
			})
		}
	}, SEARCH_DEBOUNCE_MS)
}

// ─── Feed Scroll Tracking (batched) ──────────────────────────────────

let lastScrollDepth = 0

export function trackScrollDepth(depth: number) {
	if (depth > lastScrollDepth + 5) {
		trackEvent('FEED_SCROLLED', undefined, 'feed', { depth })
		lastScrollDepth = depth
	}
}

export function resetScrollDepth() {
	lastScrollDepth = 0
}

export async function deleteMyEventData(): Promise<boolean> {
	try {
		await api.delete(API_ENDPOINTS.EVENTS.DELETE_MY_DATA)
		return true
	} catch {
		return false
	}
}
