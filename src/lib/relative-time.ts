const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const WEEK = 604800
const MONTH = 2592000
const YEAR = 31536000

/**
 * Convert a date to a human-readable relative time string.
 * e.g., "2 hours ago", "just now", "in 3 days"
 */
export function relativeTime(date: Date | string | number): string {
	const now = Date.now()
	const target = new Date(date).getTime()
	const diff = Math.round((target - now) / 1000)
	const absDiff = Math.abs(diff)
	const isFuture = diff > 0

	const format = (value: number, unit: string) => {
		const rounded = Math.floor(value)
		const plural = rounded !== 1 ? 's' : ''
		return isFuture
			? `in ${rounded} ${unit}${plural}`
			: `${rounded} ${unit}${plural} ago`
	}

	if (absDiff < 30) return 'just now'
	if (absDiff < MINUTE) return format(absDiff, 'second')
	if (absDiff < HOUR) return format(absDiff / MINUTE, 'minute')
	if (absDiff < DAY) return format(absDiff / HOUR, 'hour')
	if (absDiff < WEEK) return format(absDiff / DAY, 'day')
	if (absDiff < MONTH) return format(absDiff / WEEK, 'week')
	if (absDiff < YEAR) return format(absDiff / MONTH, 'month')
	return format(absDiff / YEAR, 'year')
}

/**
 * Compact relative time: "2h", "3d", "1w", "now"
 */
export function relativeTimeCompact(date: Date | string | number): string {
	const now = Date.now()
	const absDiff = Math.abs(Math.round((new Date(date).getTime() - now) / 1000))

	if (absDiff < 60) return 'now'
	if (absDiff < HOUR) return `${Math.floor(absDiff / MINUTE)}m`
	if (absDiff < DAY) return `${Math.floor(absDiff / HOUR)}h`
	if (absDiff < WEEK) return `${Math.floor(absDiff / DAY)}d`
	if (absDiff < MONTH) return `${Math.floor(absDiff / WEEK)}w`
	if (absDiff < YEAR) return `${Math.floor(absDiff / MONTH)}mo`
	return `${Math.floor(absDiff / YEAR)}y`
}

/**
 * Pantry-specific expiry label with action-oriented language.
 * e.g., "expires today", "in 2 days", "expired today", "expired 3 days ago"
 */
export function relativeExpiry(date: Date | string | number): string {
	const now = Date.now()
	const target = new Date(date).getTime()
	const diffSec = Math.round((target - now) / 1000)
	const diffDays = Math.floor(Math.abs(diffSec) / DAY)
	const isFuture = diffSec > 0

	if (isFuture) {
		if (diffSec < DAY) return 'expires today'
		if (diffDays === 1) return 'expires tomorrow'
		if (diffDays < 7) return `in ${diffDays} days`
		if (diffDays < 30) {
			const weeks = Math.floor(diffDays / 7)
			return `in ${weeks} week${weeks !== 1 ? 's' : ''}`
		}
		return new Date(date).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
		})
	} else {
		if (Math.abs(diffSec) < DAY) return 'expired today'
		if (diffDays === 1) return 'expired yesterday'
		if (diffDays < 30) return `expired ${diffDays} days ago`
		return 'expired'
	}
}
