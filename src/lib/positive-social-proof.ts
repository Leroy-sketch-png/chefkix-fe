export function isPositiveSocialMetric(
	value: number | null | undefined,
): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function formatPositiveSocialCount(
	value: number | null | undefined,
): string | null {
	if (!isPositiveSocialMetric(value)) return null
	return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
}
