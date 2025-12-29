import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Format a date into a short relative time string
 * Examples: "just now", "5m", "2h", "3d", "2w", "1mo", "1y"
 */
export function formatShortTimeAgo(date: Date | string): string {
	const now = new Date()
	const then = new Date(date)
	const diffMs = now.getTime() - then.getTime()
	const diffSec = Math.floor(diffMs / 1000)
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
