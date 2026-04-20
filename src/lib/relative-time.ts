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
