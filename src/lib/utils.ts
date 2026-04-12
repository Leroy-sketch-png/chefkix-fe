import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

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
