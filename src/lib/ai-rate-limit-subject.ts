import { createHmac, timingSafeEqual } from 'node:crypto'

export const AI_RATE_LIMIT_SUBJECT_HEADER = 'X-ChefKix-Rate-Limit-Subject'
export const AI_RATE_LIMIT_SUBJECT_VERSION = 'v1'
export const AI_RATE_LIMIT_SUBJECT_MAX_AGE_SECONDS = 60
const SUBJECT_SECRET_PLACEHOLDER =
	'CHANGE_ME_RATE_LIMIT_SUBJECT_SECRET_32_CHARS_MINIMUM'
const PSEUDONYM_SECRET_PLACEHOLDER =
	'CHANGE_ME_RATE_LIMIT_PSEUDONYM_SECRET_32_CHARS_MINIMUM'

const hmac = (secret: string, value: string) =>
	createHmac('sha256', secret).update(value).digest('base64url')

export const isAiRateLimitSubjectSecretConfigured = (
	pseudonymSecret: string,
	signingSecret: string,
	serviceKey: string,
) =>
	pseudonymSecret.length >= 32 &&
	signingSecret.length >= 32 &&
	pseudonymSecret !== PSEUDONYM_SECRET_PLACEHOLDER &&
	signingSecret !== SUBJECT_SECRET_PLACEHOLDER &&
	pseudonymSecret !== signingSecret &&
	pseudonymSecret !== serviceKey &&
	signingSecret !== serviceKey

export function createAiRateLimitSubject(
	userId: string,
	pseudonymSecret: string,
	signingSecret: string,
	nowSeconds = Math.floor(Date.now() / 1000),
): string {
	const normalizedUserId = userId.trim()
	if (!normalizedUserId) {
		throw new Error('Authenticated AI caller is missing a stable user ID.')
	}
	if (pseudonymSecret.length < 32 || signingSecret.length < 32) {
		throw new Error('AI rate-limit secrets must each be at least 32 characters.')
	}

	const pseudonym = hmac(pseudonymSecret, `subject\0${normalizedUserId}`)
	const payload = `${AI_RATE_LIMIT_SUBJECT_VERSION}.${nowSeconds}.${pseudonym}`
	return `${payload}.${hmac(signingSecret, `token\0${payload}`)}`
}

// Test-only contract helper: proves tokens contain no reversible caller identifier
// and use a constant-time signature comparison compatible with the Python verifier.
export function verifyAiRateLimitSubjectForTest(
	token: string,
	secret: string,
	nowSeconds: number,
): boolean {
	const [version, issuedAtRaw, pseudonym, signature, ...extra] = token.split('.')
	if (
		extra.length ||
		version !== AI_RATE_LIMIT_SUBJECT_VERSION ||
		!/^[0-9]{1,12}$/.test(issuedAtRaw || '') ||
		!/^[A-Za-z0-9_-]{43}$/.test(pseudonym || '') ||
		!/^[A-Za-z0-9_-]{43}$/.test(signature || '')
	) {
		return false
	}
	const issuedAt = Number(issuedAtRaw)
	if (
		!Number.isSafeInteger(issuedAt) ||
		issuedAt > nowSeconds + 5 ||
		nowSeconds - issuedAt > AI_RATE_LIMIT_SUBJECT_MAX_AGE_SECONDS
	) {
		return false
	}
	const payload = `${version}.${issuedAtRaw}.${pseudonym}`
	const expected = Buffer.from(hmac(secret, `token\0${payload}`))
	const supplied = Buffer.from(signature)
	return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}
