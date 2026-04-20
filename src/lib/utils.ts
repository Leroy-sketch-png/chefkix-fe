import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// ─── Number Formatting ──────────────────────────────────

/**
 * Format large numbers with K/M suffix.
 *
 * @example
 * formatNumber(1234)     // "1.2K"
 * formatNumber(1500000)  // "1.5M"
 * formatNumber(42)       // "42"
 */
export function formatNumber(num: number): string {
	if (num >= 1_000_000)
		return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
	if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
	return num.toLocaleString()
}

// ─── String Utilities ───────────────────────────────────

/**
 * Extract initials from a name (e.g., for avatar fallbacks).
 *
 * @example
 * getInitials('John Doe')          // "JD"
 * getInitials('Alice Bob Charlie') // "AC" (first + last)
 * getInitials('Madonna')           // "M"
 */
export function getInitials(name: string, maxInitials = 2): string {
	if (!name?.trim()) return ''
	const parts = name.trim().split(/\s+/)
	if (parts.length === 1) return parts[0][0].toUpperCase()
	return [parts[0], parts[parts.length - 1]]
		.map(p => p[0]?.toUpperCase() ?? '')
		.join('')
		.slice(0, maxInitials)
}

/**
 * Truncate a string with ellipsis.
 *
 * @example
 * truncate('Hello World', 5) // "Hello..."
 */
export function truncate(
	str: string,
	maxLength: number,
	suffix = '...',
): string {
	if (!str || str.length <= maxLength) return str
	return str.slice(0, maxLength).trimEnd() + suffix
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
	if (!str) return ''
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert string to Title Case.
 *
 * @example
 * toTitleCase('hello world') // "Hello World"
 * toTitleCase('ENUM_VALUE')  // "Enum Value"
 */
export function toTitleCase(str: string): string {
	if (!str) return ''
	return str
		.replace(/[_-]/g, ' ')
		.replace(/\b\w/g, char => char.toUpperCase())
		.replace(/\B\w+/g, word => word.toLowerCase())
}

/**
 * Sanitize a string by encoding HTML entities (prevents XSS in rendered text).
 */
export function sanitizeString(str: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	}
	return str.replace(/[&<>"']/g, char => map[char])
}

// ─── Scroll Utilities ───────────────────────────────────

/**
 * Smooth-scroll to an element by ID with configurable offset (for sticky headers).
 *
 * @example
 * scrollToElement('features-section')           // default 80px offset
 * scrollToElement('intro', { offset: -100 })    // custom offset
 */
export function scrollToElement(
	elementId: string,
	options: { offset?: number; behavior?: ScrollBehavior } = {},
) {
	if (typeof window === 'undefined') return
	const { offset = -80, behavior = 'smooth' } = options
	const el = document.getElementById(elementId)
	if (!el) return
	const y = el.getBoundingClientRect().top + window.scrollY + offset
	window.scrollTo({ top: y, behavior })
}

// ─── Query/Pagination Utilities ─────────────────────────

/**
 * Build URLSearchParams from a filter object, skipping null/undefined/empty/"all" values.
 *
 * @example
 * buildQueryParams({ page: 1, search: 'foo', status: 'all', category: '' })
 * // URLSearchParams { page: "1", search: "foo" }
 */
export function buildQueryParams(
	filters: Record<string, string | number | boolean | null | undefined>,
): URLSearchParams {
	const params = new URLSearchParams()
	for (const [key, value] of Object.entries(filters)) {
		if (
			value === null ||
			value === undefined ||
			value === '' ||
			value === 'all'
		)
			continue
		params.set(key, String(value))
	}
	return params
}

/**
 * Convert frontend pagination params (1-indexed page + limit)
 * to backend pagination params (0-indexed page + size).
 *
 * @example
 * toBackendPagination({ page: 1, limit: 10 })
 * // { page: 0, size: 10 }
 */
export function toBackendPagination(params: { page: number; limit: number }): {
	page: number
	size: number
} {
	return { page: Math.max(0, params.page - 1), size: params.limit }
}

// ─── Time Formatting ────────────────────────────────────

/**
 * Locale-aware compact relative time (e.g. "5m ago", "2h ago").
 * Uses Intl.RelativeTimeFormat for automatic localization.
 * @param date - ISO string or Date
 * @param locale - BCP 47 locale (default: 'en')
 */
export function formatShortTimeAgo(date: Date | string, locale = 'en'): string {
	const diffMs = Date.now() - new Date(date).getTime()
	const diffSec = Math.floor(diffMs / 1000)
	const rtf = new Intl.RelativeTimeFormat(locale, {
		numeric: 'always',
		style: 'narrow',
	})
	if (diffSec < 60) return rtf.format(0, 'second')
	const diffMin = Math.floor(diffSec / 60)
	if (diffMin < 60) return rtf.format(-diffMin, 'minute')
	const diffHour = Math.floor(diffMin / 60)
	if (diffHour < 24) return rtf.format(-diffHour, 'hour')
	const diffDay = Math.floor(diffHour / 24)
	if (diffDay < 7) return rtf.format(-diffDay, 'day')
	const diffWeek = Math.floor(diffDay / 7)
	if (diffWeek < 5) return rtf.format(-diffWeek, 'week')
	const diffMonth = Math.floor(diffDay / 30)
	if (diffMonth < 12) return rtf.format(-diffMonth, 'month')
	return rtf.format(-Math.floor(diffDay / 365), 'year')
}
