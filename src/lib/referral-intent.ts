import { PATHS } from '@/constants/paths'

const REFERRAL_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/

export function normalizeReferralCode(
	value: string | null | undefined,
): string | null {
	if (!value) return null
	const normalized = value.trim().toUpperCase()
	return REFERRAL_CODE_PATTERN.test(normalized) ? normalized : null
}

export function getReferralRedeemPath(code: string): string {
	const normalized = normalizeReferralCode(code)
	if (!normalized) return `${PATHS.SETTINGS}?tab=referral`
	return `${PATHS.SETTINGS}?tab=referral&ref=${encodeURIComponent(normalized)}`
}

export function getReferralCodeFromRedeemPath(
	path: string | null | undefined,
): string | null {
	if (!path?.startsWith('/') || path.startsWith('//')) return null

	try {
		const url = new URL(path, 'https://chefkix.local')
		if (
			url.pathname !== PATHS.SETTINGS ||
			url.searchParams.get('tab') !== 'referral'
		) {
			return null
		}
		return normalizeReferralCode(url.searchParams.get('ref'))
	} catch {
		return null
	}
}
