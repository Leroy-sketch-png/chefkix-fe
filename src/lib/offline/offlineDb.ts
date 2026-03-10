/**
 * IndexedDB wrapper for offline data persistence
 * Stores:
 * 1. Queued API requests for replay on reconnect
 * 2. Cached recipe data for offline cooking
 * 3. Session state for offline navigation
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

// ============================================
// TYPES
// ============================================

export interface QueuedRequest {
	id: string
	url: string
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	body?: unknown
	headers?: Record<string, string>
	timestamp: number
	retryCount: number
	priority: number // Lower = higher priority
}

export interface CachedRecipe {
	id: string
	data: unknown // Full recipe data
	cachedAt: number
}

export interface OfflineSession {
	sessionId: string
	recipeId: string
	currentStep: number
	completedSteps: number[]
	timerState: Record<
		number,
		{ startedAt?: number; remaining: number; isPaused: boolean }
	>
	lastUpdated: number
}

// ============================================
// SCHEMA
// ============================================

interface ChefKixOfflineDB extends DBSchema {
	'request-queue': {
		key: string
		value: QueuedRequest
		indexes: { 'by-timestamp': number; 'by-priority': number }
	}
	'cached-recipes': {
		key: string
		value: CachedRecipe
		indexes: { 'by-cached-at': number }
	}
	'offline-sessions': {
		key: string
		value: OfflineSession
		indexes: { 'by-last-updated': number }
	}
}

// ============================================
// DATABASE INSTANCE
// ============================================

const DB_NAME = 'chefkix-offline'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ChefKixOfflineDB>> | null = null

function getDb(): Promise<IDBPDatabase<ChefKixOfflineDB>> {
	if (!dbPromise) {
		dbPromise = openDB<ChefKixOfflineDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				// Request queue store
				if (!db.objectStoreNames.contains('request-queue')) {
					const requestStore = db.createObjectStore('request-queue', {
						keyPath: 'id',
					})
					requestStore.createIndex('by-timestamp', 'timestamp')
					requestStore.createIndex('by-priority', 'priority')
				}

				// Cached recipes store
				if (!db.objectStoreNames.contains('cached-recipes')) {
					const recipeStore = db.createObjectStore('cached-recipes', {
						keyPath: 'id',
					})
					recipeStore.createIndex('by-cached-at', 'cachedAt')
				}

				// Offline sessions store
				if (!db.objectStoreNames.contains('offline-sessions')) {
					const sessionStore = db.createObjectStore('offline-sessions', {
						keyPath: 'sessionId',
					})
					sessionStore.createIndex('by-last-updated', 'lastUpdated')
				}
			},
		})
	}
	return dbPromise
}

// ============================================
// REQUEST QUEUE OPERATIONS
// ============================================

/**
 * Add a request to the offline queue
 */
export async function queueRequest(
	request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>,
): Promise<void> {
	const db = await getDb()
	const queuedRequest: QueuedRequest = {
		...request,
		id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
		timestamp: Date.now(),
		retryCount: 0,
	}
	await db.add('request-queue', queuedRequest)
}

/**
 * Get all queued requests, ordered by priority then timestamp
 */
export async function getQueuedRequests(): Promise<QueuedRequest[]> {
	const db = await getDb()
	const all = await db.getAll('request-queue')
	// Sort by priority (lower first), then by timestamp (older first)
	return all.sort((a, b) => {
		if (a.priority !== b.priority) return a.priority - b.priority
		return a.timestamp - b.timestamp
	})
}

/**
 * Remove a request from the queue (after successful replay)
 */
export async function removeQueuedRequest(id: string): Promise<void> {
	const db = await getDb()
	await db.delete('request-queue', id)
}

/**
 * Increment retry count for a failed request
 */
export async function incrementRetryCount(id: string): Promise<void> {
	const db = await getDb()
	const request = await db.get('request-queue', id)
	if (request) {
		request.retryCount++
		await db.put('request-queue', request)
	}
}

/**
 * Get count of queued requests
 */
export async function getQueueCount(): Promise<number> {
	const db = await getDb()
	return db.count('request-queue')
}

/**
 * Clear all queued requests (e.g., after logout)
 */
export async function clearRequestQueue(): Promise<void> {
	const db = await getDb()
	await db.clear('request-queue')
}

// ============================================
// CACHED RECIPES OPERATIONS
// ============================================

/**
 * Cache a recipe for offline access
 */
export async function cacheRecipe(
	recipeId: string,
	data: unknown,
): Promise<void> {
	const db = await getDb()
	await db.put('cached-recipes', {
		id: recipeId,
		data,
		cachedAt: Date.now(),
	})
}

/**
 * Get a cached recipe
 */
export async function getCachedRecipe(
	recipeId: string,
): Promise<CachedRecipe | undefined> {
	const db = await getDb()
	return db.get('cached-recipes', recipeId)
}

/**
 * Remove old cached recipes (> 7 days)
 */
export async function cleanupCachedRecipes(): Promise<void> {
	const db = await getDb()
	const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
	const all = await db.getAll('cached-recipes')
	for (const recipe of all) {
		if (recipe.cachedAt < sevenDaysAgo) {
			await db.delete('cached-recipes', recipe.id)
		}
	}
}

// ============================================
// OFFLINE SESSIONS OPERATIONS
// ============================================

/**
 * Save session state for offline access
 */
export async function saveOfflineSession(
	session: Omit<OfflineSession, 'lastUpdated'>,
): Promise<void> {
	const db = await getDb()
	await db.put('offline-sessions', {
		...session,
		lastUpdated: Date.now(),
	})
}

/**
 * Get offline session state
 */
export async function getOfflineSession(
	sessionId: string,
): Promise<OfflineSession | undefined> {
	const db = await getDb()
	return db.get('offline-sessions', sessionId)
}

/**
 * Remove offline session (after sync or completion)
 */
export async function removeOfflineSession(sessionId: string): Promise<void> {
	const db = await getDb()
	await db.delete('offline-sessions', sessionId)
}

/**
 * Get the most recent offline session
 */
export async function getLatestOfflineSession(): Promise<
	OfflineSession | undefined
> {
	const db = await getDb()
	const all = await db.getAllFromIndex('offline-sessions', 'by-last-updated')
	return all.length > 0 ? all[all.length - 1] : undefined
}

// ============================================
// UTILITY
// ============================================

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
	if (typeof window === 'undefined') return false
	return 'indexedDB' in window
}
