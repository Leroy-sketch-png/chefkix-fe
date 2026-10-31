const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000

export function getPostDeadlineHours(
	completedAt: string,
	postDeadline: string,
): number | null {
	const duration = Date.parse(postDeadline) - Date.parse(completedAt)
	if (!Number.isFinite(duration)) return null
	if (duration <= 0) return 0
	return duration / MILLISECONDS_PER_HOUR
}

export function getPostDeadlineDays(
	completedAt: string,
	postDeadline: string,
): number | null {
	const hours = getPostDeadlineHours(completedAt, postDeadline)
	return hours == null ? null : hours <= 0 ? 0 : Math.ceil(hours / 24)
}
