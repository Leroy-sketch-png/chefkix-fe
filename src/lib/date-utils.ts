/**
 * Date Utilities — Structured date formatting, ranges, and date helpers.
 *
 * Complements relative-time.ts (which handles "2 hours ago" style).
 * This module handles calendar-style formatting: "Jan 15", "January 15, 2024", etc.
 *
 * Dependencies: None (uses native Intl.DateTimeFormat)
 */

export type DateFormatStyle =
	| 'short'
	| 'medium'
	| 'long'
	| 'full'
	| 'relative'
	| 'datetime'
	| 'time'

/**
 * Format a date consistently.
 *
 * Styles:
 * - 'short': "Jan 15" (omits year if current year) or "Jan 15, 2024"
 * - 'medium': "January 15, 2024"
 * - 'long': "January 15, 2024, 2:30 PM"
 * - 'full': "Monday, January 15, 2024"
 * - 'datetime': "Jan 15, 2024 at 2:30 PM"
 * - 'time': "2:30 PM"
 *
 * Returns '—' for null/undefined/invalid values.
 */
export function formatDate(
	date: string | Date | number | null | undefined,
	style: DateFormatStyle = 'medium',
): string {
	if (!date) return '—'

	const d = date instanceof Date ? date : new Date(date)
	if (isNaN(d.getTime())) return '—'

	const now = new Date()
	const isCurrentYear = d.getFullYear() === now.getFullYear()

	switch (style) {
		case 'short':
			return d.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				...(isCurrentYear ? {} : { year: 'numeric' }),
			})

		case 'medium':
			return d.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})

		case 'long':
			return d.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})

		case 'full':
			return d.toLocaleDateString(undefined, {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})

		case 'datetime':
			return (
				d.toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
				}) +
				' at ' +
				d.toLocaleTimeString(undefined, {
					hour: '2-digit',
					minute: '2-digit',
				})
			)

		case 'relative':
			return formatRelativeDate(d)

		case 'time':
			return d.toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
			})

		default:
			return d.toLocaleDateString()
	}
}

/** Relative formatting: "Just now", "5 minutes ago", "Yesterday", etc. Falls back to 'short'. */
function formatRelativeDate(date: Date): string {
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffSecs = Math.floor(diffMs / 1000)
	const diffMins = Math.floor(diffSecs / 60)
	const diffHours = Math.floor(diffMins / 60)
	const diffDays = Math.floor(diffHours / 24)

	if (diffSecs < 60) return 'Just now'
	if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
	if (diffHours < 24)
		return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
	if (diffDays === 1) return 'Yesterday'
	if (diffDays < 7) return `${diffDays} days ago`

	return formatDate(date, 'short')
}

/**
 * Compact social-media style relative time: "just now", "5m", "2h", "3d", "2w", "1mo", "1y".
 * For feed timestamps and compact date display.
 */
export function formatCompactTime(date: Date | string): string {
	const now = new Date()
	const then = new Date(date)
	const diffSec = Math.floor((now.getTime() - then.getTime()) / 1000)
	const diffMin = Math.floor(diffSec / 60)
	const diffHour = Math.floor(diffMin / 60)
	const diffDay = Math.floor(diffHour / 24)
	const diffWeek = Math.floor(diffDay / 7)
	const diffMonth = Math.floor(diffDay / 30)
	const diffYear = Math.floor(diffDay / 365)

	if (diffSec < 60) return 'just now'
	if (diffMin < 60) return `${diffMin}m`
	if (diffHour < 24) return `${diffHour}h`
	if (diffDay < 7) return `${diffDay}d`
	if (diffWeek < 4) return `${diffWeek}w`
	if (diffMonth < 12) return `${diffMonth}mo`
	return `${diffYear}y`
}

/**
 * Format a date range: "Jan 15 - Jan 20, 2024".
 * Smart: omits redundant month/year when start and end share them.
 */
export function formatDateRange(
	startDate: string | Date | null | undefined,
	endDate: string | Date | null | undefined,
): string {
	if (!startDate || !endDate) return '—'

	const start = startDate instanceof Date ? startDate : new Date(startDate)
	const end = endDate instanceof Date ? endDate : new Date(endDate)
	if (isNaN(start.getTime()) || isNaN(end.getTime())) return '—'

	const sameYear = start.getFullYear() === end.getFullYear()
	const sameMonth = sameYear && start.getMonth() === end.getMonth()

	if (sameMonth) {
		return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { day: 'numeric', year: 'numeric' })}`
	}
	if (sameYear) {
		return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
	}
	return `${formatDate(start, 'short')} - ${formatDate(end, 'short')}`
}

/** Check if a date is today. */
export function isToday(date: string | Date): boolean {
	const d = date instanceof Date ? date : new Date(date)
	const now = new Date()
	return (
		d.getDate() === now.getDate() &&
		d.getMonth() === now.getMonth() &&
		d.getFullYear() === now.getFullYear()
	)
}
