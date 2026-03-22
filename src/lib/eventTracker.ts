import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import type { TrackingEvent, TrackingEventType } from '@/lib/types/events'

const BATCH_INTERVAL_MS = 10_000
const MAX_BATCH_SIZE = 50
const DWELL_THRESHOLD_MS = 2_000
const SEARCH_DEBOUNCE_MS = 500

let eventQueue: TrackingEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let initialized = false

function enqueue(event: TrackingEvent) {
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
	} catch {
		// On failure, re-enqueue at front for next flush
		eventQueue.unshift(...batch)
	}
}

function flushBeacon() {
	if (eventQueue.length === 0) return

	const batch = eventQueue.splice(0)
	const payload = JSON.stringify({ events: batch })
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'
	const url = `${baseUrl}${API_ENDPOINTS.EVENTS.TRACK}`

	if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
		const blob = new Blob([payload], { type: 'application/json' })
		navigator.sendBeacon(url, blob)
	}
}

// ─── Public API ─────────────────────────────────────────────────────

export function initEventTracker() {
	if (initialized || typeof window === 'undefined') return

	flushTimer = setInterval(flush, BATCH_INTERVAL_MS)

	window.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			flushBeacon()
		}
	})

	window.addEventListener('pagehide', flushBeacon)

	initialized = true
}

export function destroyEventTracker() {
	if (flushTimer) {
		clearInterval(flushTimer)
		flushTimer = null
	}
	flushBeacon()
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

export function startDwellTracking(entityId: string, entityType: string) {
	if (dwellTimers.has(entityId)) return

	const timer = setTimeout(() => {
		trackEvent('POST_DWELLED', entityId, entityType, {
			dwellMs: DWELL_THRESHOLD_MS,
		})
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
