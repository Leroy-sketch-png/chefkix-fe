const SECRET_KEY_VALUE =
	/(["']?(?:access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|client[_-]?secret|password|cookie|otp(?:[_ -]?code)?|verification[_ -]?code|recovery[_ -]?code|private[_ -]?key|credential)["']?\s*[:=]\s*)(["']?)([^"'\s,};&]+)(["']?)/gi
const AUTHORIZATION_SECRET =
	/(["']?authorization["']?\s*[:=]\s*["']?)(bearer\s+)?([^"'\s,};&]+)(["']?)/gi
const QUERY_SECRET =
	/([?&](?:access[_-]?token|refresh[_-]?token|id[_-]?token|token|api[_-]?key|client[_-]?secret|password|signature|code|credential|otp|verification[_-]?code|recovery[_-]?code|x-amz-(?:credential|signature|security-token))=)[^&#\s]*/gi
const COOKIE_SECRET =
	/\b((?:access_token|refresh_token|session(?:id|_id)?|connect\.sid|jsessionid|jwt|otp|verification_code|recovery_code)=)[^;\s,]*/gi
const BEARER_SECRET = /\b(bearer\s+)[A-Za-z0-9._~+/-]+=*/gi
const BASIC_SECRET = /\b(basic\s+)[A-Za-z0-9+/]+=*/gi
const JWT_SECRET =
	/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{10,})?\b/g
const PROVIDER_SECRET =
	/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,})\b/g
const SECRET_FIELD =
	/(?:access[_-]?token|refresh[_-]?token|id[_-]?token|token|api[_-]?key|client[_-]?secret|secret|password|authorization|cookie|jwt|otp|verification[_-]?code|recovery[_-]?code|private[_-]?key|credential)/i

export function sanitizeDiagnosticText(value) {
	return String(value)
		.replace(AUTHORIZATION_SECRET, '$1$2[REDACTED]$4')
		.replace(BEARER_SECRET, '$1[REDACTED]')
		.replace(BASIC_SECRET, '$1[REDACTED]')
		.replace(SECRET_KEY_VALUE, '$1$2[REDACTED]$4')
		.replace(QUERY_SECRET, '$1[REDACTED]')
		.replace(COOKIE_SECRET, '$1[REDACTED]')
		.replace(JWT_SECRET, '[REDACTED_JWT]')
		.replace(PROVIDER_SECRET, '[REDACTED_SECRET]')
}

export function sanitizeDiagnosticValue(value) {
	if (typeof value === 'string') return sanitizeDiagnosticText(value)
	if (Array.isArray(value)) return value.map(sanitizeDiagnosticValue)
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [
				key,
				SECRET_FIELD.test(key) ? '[REDACTED]' : sanitizeDiagnosticValue(item),
			]),
		)
	}
	return value
}
