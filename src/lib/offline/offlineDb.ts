/**
 * IndexedDB wrapper for offline data persistence
 * Stores queued API requests for replay on reconnect
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

// ============================================
// SCHEMA
// ============================================

interface ChefKixOfflineDB extends DBSchema {
	'request-queue': {
		key: string
		value: QueuedRequest
		indexes: { 'by-timestamp': number; 'by-priority': number }
	}
	// Legacy stores kept for IndexedDB schema compatibility.
	// No application code reads/writes these anymore.
	'cached-recipes': {
		key: string
		value: { id: string; data: unknown; cachedAt: number }
		indexes: { 'by-cached-at': number }
	}
	'offline-sessions': {
		key: string
		value: {
			sessionId: string
			recipeId: string
			currentStep: number
			completedSteps: number[]
			timerState: Record<string, unknown>
			lastUpdated: number
		}
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

				// Legacy stores — created for schema compatibility
				if (!db.objectStoreNames.contains('cached-recipes')) {
					const recipeStore = db.createObjectStore('cached-recipes', {
						keyPath: 'id',
					})
					recipeStore.createIndex('by-cached-at', 'cachedAt')
				}

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
