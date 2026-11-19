const REDACTED = '[REDACTED]'
const OMITTED = '[OMITTED_DIAGNOSTIC_TEXT]'
const CIRCULAR = '[CIRCULAR]'

const REDACTED_FIELDS = new Set([
	'accessToken', 'refreshToken', 'idToken', 'token', 'apiKey', 'clientSecret',
	'secret', 'password', 'authorization', 'cookie', 'setCookie', 'jwt', 'otp',
	'verificationCode', 'recoveryCode', 'privateKey', 'credential', 'session',
	'sessionId', 'sid', 'username', 'userId', 'memberId', 'displayName',
	'profileId', 'accountId', 'email',
])
const OMITTED_TEXT_FIELDS = new Set([
	'bodySnippet', 'caption', 'content', 'detail', 'error', 'errorMessage',
	'errorMessages', 'errorToastText', 'failureText', 'message', 'messages',
	'pageText', 'reason', 'snippet', 'text', 'userMessage', 'userText',
	'validationErrors',
])
const SAFE_TEXT_FIELDS = new Set([
	'baseUrl', 'category', 'endpoint', 'href', 'method', 'mode', 'plan',
	'runId', 'scenario', 'status', 'type', 'url',
])
const normalizeField = field => field.replace(/[^a-z0-9]/gi, '').toLowerCase()
const redactedFields = new Set([...REDACTED_FIELDS].map(normalizeField))
const omittedTextFields = new Set([...OMITTED_TEXT_FIELDS].map(normalizeField))
const safeTextFields = new Set([...SAFE_TEXT_FIELDS].map(normalizeField))
const SENSITIVE_QUERY_FIELDS = new Set([
	'access_token', 'refresh_token', 'id_token', 'token', 'api_key', 'client_secret',
	'password', 'signature', 'code', 'credential', 'otp', 'verification_code',
	'recovery_code', 'session', 'session_id', 'sid', 'x_amz_credential',
	'x_amz_signature', 'x_amz_security_token',
].map(normalizeField))
const PRIVATE_QUERY_FIELDS = new Set([
	...SENSITIVE_QUERY_FIELDS,
	'username', 'user', 'user_id', 'member_id', 'display_name', 'profile_id',
	'account_id', 'email', 'q', 'query', 'search',
].map(normalizeField))

const SECRET_KEY_VALUE =
	/(\b(?:access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|client[_-]?secret|password|cookie|otp(?:[_ -]?code)?|verification[_ -]?code|recovery[_ -]?code|private[_ -]?key|credential|session(?:[_-]?id)?|sid)\b["']?\s*[:=]\s*["']?)[^"'\s,};&]+(["']?)/gi
const AUTHORIZATION_SECRET =
	/(\bauthorization\b["']?\s*[:=]\s*["']?(?:bearer\s+)?)[^"'\s,};&]+(["']?)/gi
const JSON_AUTHORIZATION_FIELD =
	/(["']authorization["']\s*:\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^,}\r\n]*)/gi
const AUTHORIZATION_HEADER = /(\bauthorization\s*:\s*)[^\r\n]+/gi
const QUERY_SECRET =
	/([?&](?:access[_-]?token|refresh[_-]?token|id[_-]?token|token|api[_-]?key|client[_-]?secret|password|signature|code|credential|otp|verification[_-]?code|recovery[_-]?code|session(?:[_-]?id)?|sid|x-amz-(?:credential|signature|security-token))=)[^&#\s]*/gi
const URL_TOKEN =
	/(?:https?:\/\/|\/\/)[^\s"'<>]+|(?:^|[\s([{])\/[^\s"'<>]*|(?:^|[\s([{])(?:[a-z\d._~-]+\/)*[a-z\d._~-]+\?[^\s"'<>]*|(?:^|[\s([{])\?[^\s"'<>]*/gi
const COOKIE_SECRET =
	/\b((?:access_token|refresh_token|session(?:id|_id)?|sid|connect\.sid|jsessionid|jwt|otp|verification_code|recovery_code)=)[^;\s,]*/gi
const BEARER_SECRET = /\b(bearer\s+)[A-Za-z0-9._~+/-]+=*/gi
const BASIC_SECRET = /\b(basic\s+)[A-Za-z0-9+/]+=*/gi
const JWT_SECRET =
	/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{10,})?\b/g
const PROVIDER_SECRET =
	/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,})\b/g
const URL_USERINFO = /(^|[^a-z\d+.-])((?:[a-z][a-z\d+.-]*:\/\/|\/\/))[^/@\s]+@/gim
const INLINE_MEDIA_URL = /\b(?:data|blob):[^\s"'`]+/gi
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const UUID = /\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi
const URL_PATH_IDENTIFIER =
	/(\/(?:\d{4,}|[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}|[0-9a-f]{24,}))(?=\/|[?#]|$)/gi
const URL_RESOURCE_IDENTIFIER =
	/(\/(?:users?|members?|profiles?|accounts?|sessions?)\/)([^/?#\s]+)/gi
const RESERVED_RESOURCE_SEGMENTS = new Set([
	'current', 'login', 'me', 'new', 'register', 'search', 'settings',
])

function normalizeQueryField(field) {
	try {
		return normalizeField(decodeURIComponent(field.replace(/\+/g, ' ')))
	} catch {
		return null
	}
}

function isPrivateQueryField(field) {
	const normalized = normalizeQueryField(field)
	return normalized === null || PRIVATE_QUERY_FIELDS.has(normalized) || /%[0-9a-f]{2}/i.test(field)
}

export function sanitizeDiagnosticText(value) {
	if (typeof value !== 'string') return '[OMITTED_UNSERIALIZABLE_VALUE]'
	return value
		.replace(INLINE_MEDIA_URL, '[OMITTED_MEDIA_URL]')
		.replace(URL_USERINFO, '$1$2[REDACTED]@')
		.replace(AUTHORIZATION_HEADER, '$1[REDACTED]')
		.replace(AUTHORIZATION_SECRET, '$1[REDACTED]$2')
		.replace(BEARER_SECRET, '$1[REDACTED]')
		.replace(BASIC_SECRET, '$1[REDACTED]')
		.replace(JSON_AUTHORIZATION_FIELD, '$1"[REDACTED]"')
		.replace(SECRET_KEY_VALUE, '$1[REDACTED]$2')
		.replace(QUERY_SECRET, '$1[REDACTED]')
		.replace(URL_TOKEN, token => sanitizeUrlQueryValues(token))
		.replace(COOKIE_SECRET, '$1[REDACTED]')
		.replace(JWT_SECRET, '[REDACTED_JWT]')
		.replace(PROVIDER_SECRET, '[REDACTED_SECRET]')
		.replace(EMAIL, '[REDACTED_EMAIL]')
		.replace(UUID, '[REDACTED_ID]')
		.replace(URL_PATH_IDENTIFIER, '/[REDACTED_ID]')
		.replace(URL_RESOURCE_IDENTIFIER, (match, prefix, segment) =>
			RESERVED_RESOURCE_SEGMENTS.has(segment.toLowerCase())
				? match
				: `${prefix}[REDACTED_ID]`,
		)
}

function sanitizeUrlQueryValues(token) {
	const queryStart = token.indexOf('?')
	if (queryStart < 0) return token
	const fragmentStart = token.indexOf('#', queryStart)
	const queryEnd = fragmentStart < 0 ? token.length : fragmentStart
	const query = token.slice(queryStart + 1, queryEnd)
	const tokenStart = token.trimStart()
	const isExplicitUrl = /^(?:https?:\/\/|\/\/|\/)/i.test(tokenStart)
	const hasPrivateQueryField = query.split('&').some(pair => {
		const equalsAt = pair.indexOf('=')
		return equalsAt >= 0 && isPrivateQueryField(pair.slice(0, equalsAt))
	})
	if (!isExplicitUrl && !hasPrivateQueryField) return token
	const safeQuery = query.split('&').map(pair => {
		const equalsAt = pair.indexOf('=')
		if (equalsAt < 0) return pair
		const key = pair.slice(0, equalsAt)
		const queryValue = pair.slice(equalsAt + 1)
		const isKnownSecret = SENSITIVE_QUERY_FIELDS.has(normalizeQueryField(key))
		const safeValue = isKnownSecret || queryValue === '[REDACTED]'
			? '[REDACTED]'
			: '[OMITTED_QUERY_VALUE]'
		return `${key}=${safeValue}`
	}).join('&')
	return `${token.slice(0, queryStart)}?${safeQuery}${fragmentStart < 0 ? '' : token.slice(fragmentStart)}`
}

function sanitizeValue(value, key, seen) {
	const normalizedKey = typeof key === 'string' ? normalizeField(key) : ''
	if (redactedFields.has(normalizedKey)) return REDACTED
	if (omittedTextFields.has(normalizedKey)) return OMITTED
	if (
		normalizedKey === 'errors' ||
		normalizedKey === 'warnings' ||
		normalizedKey === 'reasons' ||
		normalizedKey === 'violations'
	) {
		return Array.isArray(value) ? value.map(() => OMITTED) : OMITTED
	}
	if (typeof value === 'string') {
		return safeTextFields.has(normalizedKey)
			? sanitizeDiagnosticText(value)
			: OMITTED
	}
	if (value === null || typeof value === 'boolean' || typeof value === 'number') {
		return value
	}
	if (typeof value === 'undefined') return '[UNDEFINED]'
	if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
		return '[OMITTED_UNSERIALIZABLE_VALUE]'
	}
	if (typeof value !== 'object') return '[OMITTED_UNSERIALIZABLE_VALUE]'
	if (seen.has(value)) return CIRCULAR
	seen.add(value)
	try {
		if (Array.isArray(value)) {
			const output = []
			for (let index = 0; index < value.length; index += 1) {
				const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
				if (!descriptor) {
					output.length = index + 1
				} else if ('value' in descriptor) {
					output[index] = sanitizeValue(descriptor.value, key, seen)
				} else {
					output[index] = '[OMITTED_ACCESSOR]'
				}
			}
			return output
		}
		const output = Object.create(null)
		for (const childKey of Object.keys(value)) {
			const descriptor = Object.getOwnPropertyDescriptor(value, childKey)
			if (!descriptor) {
				output[sanitizeDiagnosticText(childKey)] = '[OMITTED_UNSERIALIZABLE_VALUE]'
				continue
			}
			const safeKey = sanitizeDiagnosticText(childKey)
			output[safeKey] = 'value' in descriptor
				? sanitizeValue(descriptor.value, childKey, seen)
				: '[OMITTED_ACCESSOR]'
		}
		return output
	} finally {
		seen.delete(value)
	}
}

export function sanitizeDiagnosticValue(value) {
	try {
		return sanitizeValue(value, '', new WeakSet())
	} catch {
		return '[OMITTED_UNSERIALIZABLE_VALUE]'
	}
}

export function readOwnDataProperty(value, key, fallback = undefined) {
	if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
		return fallback
	}
	try {
		const descriptor = Object.getOwnPropertyDescriptor(value, key)
		return descriptor && 'value' in descriptor ? descriptor.value : fallback
	} catch {
		return fallback
	}
}

function readDataProperty(value, key, fallback = undefined) {
	if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
		return fallback
	}
	const visited = new Set()
	try {
		let current = value
		while (current !== null && !visited.has(current)) {
			visited.add(current)
			const descriptor = Object.getOwnPropertyDescriptor(current, key)
			if (descriptor) return 'value' in descriptor ? descriptor.value : fallback
			current = Object.getPrototypeOf(current)
		}
	} catch {
		return fallback
	}
	return fallback
}

export function safeErrorMessage(error, fallback = 'Unknown error') {
	const message = readOwnDataProperty(error, 'message', fallback)
	return typeof message === 'string' ? message : fallback
}

export function safeErrorName(error, fallback = 'Error') {
	const name = readDataProperty(error, 'name', fallback)
	return typeof name === 'string' ? name : fallback
}
