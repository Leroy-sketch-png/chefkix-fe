export type RepeatCookXpTier =
	| 'full'
	| 'half'
	| 'quarter'
	| 'exhausted'
	| 'unknown'

export const getOrdinalSuffix = (value: number): string => {
	if (!Number.isFinite(value)) return 'th'

	const normalized = Math.abs(Math.trunc(value))
	const lastTwoDigits = normalized % 100

	if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
		return 'th'
	}

	switch (normalized % 10) {
		case 1:
			return 'st'
		case 2:
			return 'nd'
		case 3:
			return 'rd'
		default:
			return 'th'
	}
}

export const getRepeatCookXpTier = (
	cookCount?: number | null,
): RepeatCookXpTier => {
	if (
		typeof cookCount !== 'number' ||
		!Number.isFinite(cookCount) ||
		cookCount < 1
	) {
		return 'unknown'
	}

	const normalized = Math.floor(cookCount)

	if (normalized === 1) return 'full'
	if (normalized === 2) return 'half'
	if (normalized === 3) return 'quarter'
	return 'exhausted'
}

export const hasClaimablePostXp = (
	pendingXp: number,
	creatorTipXp = 0,
): boolean => pendingXp + creatorTipXp > 0

export const isNoRecipeXpRun = (
	immediateXp: number,
	pendingXp: number,
): boolean => immediateXp <= 0 && pendingXp <= 0
