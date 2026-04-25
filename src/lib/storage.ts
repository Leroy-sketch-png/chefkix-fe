/**
 * Storage Utilities — Type-safe localStorage wrapper with SSR safety and error handling.
 *
 * Adapted from .tmp stash. Replaces raw localStorage calls with safe wrappers.
 *
 * Dependencies: None
 *
 * @example
 * setStorageItem('token', 'abc123')
 * getStorageItem('token') // 'abc123'
 * getStorageJson<FormDraft>('draft') // parsed object or null
 * setStorageJson('draft', { title: 'Hello' })
 */

import { logDevWarn } from '@/lib/dev-log'

/** SSR-safe browser check. */
function isBrowser(): boolean {
	return (
		typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
	)
}

/**
 * Test if localStorage is available and writable.
 * Returns false in private browsing, when storage is disabled, or SSR.
 */
export function isStorageAvailable(): boolean {
	if (!isBrowser()) return false
	try {
		const key = '__storage_test__'
		localStorage.setItem(key, 'ok')
		localStorage.removeItem(key)
		return true
	} catch {
		return false
	}
}

/**
 * Get a raw string value from localStorage.
 * Returns null if not found or storage is unavailable.
 */
export function getStorageItem(key: string): string | null {
	if (!isBrowser()) return null
	try {
		return localStorage.getItem(key)
	} catch {
		return null
	}
}

/**
 * Set a raw string value in localStorage.
 * Returns false if storage is unavailable or quota exceeded.
 */
export function setStorageItem(key: string, value: string): boolean {
	if (!isBrowser()) return false
	try {
		localStorage.setItem(key, value)
		return true
	} catch (error) {
		logDevWarn(`[Storage] Failed to write "${key}":`, error)
		return false
	}
}

/** Remove an item from localStorage. */
export function removeStorageItem(key: string): boolean {
	if (!isBrowser()) return false
	try {
		localStorage.removeItem(key)
		return true
	} catch {
		return false
	}
}

/**
 * Get a JSON-parsed value from localStorage.
 * Returns defaultValue if not found, parse fails, or storage unavailable.
 *
 * @example
 * const draft = getStorageJson<FormDraft>('form_draft')
 * const prefs = getStorageJson('prefs', { theme: 'light' })
 */
export function getStorageJson<T>(
	key: string,
	defaultValue: T | null = null,
): T | null {
	const raw = getStorageItem(key)
	if (raw === null) return defaultValue
	try {
		return JSON.parse(raw) as T
	} catch {
		return defaultValue
	}
}

/**
 * Set a JSON-serializable value in localStorage.
 *
 * @example
 * setStorageJson('form_draft', { title: 'Hello', content: '...' })
 */
export function setStorageJson(key: string, value: unknown): boolean {
	try {
		return setStorageItem(key, JSON.stringify(value))
	} catch {
		return false
	}
}

/**
 * Remove multiple keys at once.
 *
 * @example
 * clearStorageItems(['access_token', 'refresh_token', 'user_id'])
 */
export function clearStorageItems(keys: string[]): void {
	keys.forEach(removeStorageItem)
}
