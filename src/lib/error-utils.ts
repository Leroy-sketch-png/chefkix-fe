/**
 * Error Utilities — User-friendly error handling for API responses.
 *
 * Centralizes error message extraction, HTTP status fallbacks, and
 * error normalization. No toast dependency — returns messages for caller to display.
 *
 * @example
 * try { await api.post('/items', data) }
 * catch (err) { toast.error(getUserFriendlyMessage(err)) }
 */

// ─── ApiError Class ──────────────────────────────────

/** Structured API error with status code and error code. */
export class ApiError extends Error {
	status: number
	code: string

	constructor(message: string, status = 500, code = 'INTERNAL_ERROR') {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.code = code
	}
}

// ─── Status Code Fallbacks ──────────────────────────

/** HTTP status → user-friendly message. */
export const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
	400: 'The request could not be processed. Please check your input.',
	401: 'Please log in to continue.',
	403: "You don't have permission to do this.",
	404: 'The requested resource was not found.',
	409: 'This action conflicts with existing data.',
	422: 'The provided data is invalid.',
	429: 'Too many requests. Please slow down.',
	500: 'Something went wrong. Please try again later.',
	502: 'Service temporarily unavailable. Please try again.',
	503: 'Service temporarily unavailable. Please try again.',
	504: 'Request timed out. Please try again.',
}

// ─── Error Message Extraction ───────────────────────

/**
 * Extract a user-friendly message from any error shape.
 *
 * Priority: custom message map → backend message → status fallback → generic.
 *
 * @param error - Axios error, ApiError, Error, or unknown
 * @param messageMap - Optional map of backend messages → user-friendly overrides
 */
export function getUserFriendlyMessage(
	error: unknown,
	messageMap?: Record<string, string>,
): string {
	if (!error || typeof error !== 'object')
		return 'An unexpected error occurred.'

	const axiosLike = error as {
		response?: {
			status?: number
			data?: { message?: string; error?: string }
		}
		code?: string
		message?: string
	}

	// Network error (no response)
	if (!axiosLike.response) {
		if (axiosLike.code === 'ECONNABORTED')
			return 'Request timed out. Please check your connection.'
		if (axiosLike.message?.includes('Network Error'))
			return 'Unable to connect. Please check your internet.'
		return 'Unable to connect to the server. Please try again later.'
	}

	const status = axiosLike.response.status ?? 500
	const backendMessage =
		axiosLike.response.data?.message || axiosLike.response.data?.error

	// Check user-provided message map first
	const mapped = backendMessage && messageMap?.[backendMessage]

	return (
		mapped ||
		backendMessage ||
		STATUS_FALLBACK_MESSAGES[status] ||
		'An unexpected error occurred. Please try again.'
	)
}

// ─── Parse Error ────────────────────────────────────

/**
 * Normalize any error into an ApiError instance.
 * Extracts status, code, and message from various backend response formats.
 */
export function parseError(error: unknown): ApiError {
	if (error instanceof ApiError) return error

	const axiosLike = error as {
		response?: {
			status?: number
			data?: {
				message?: string
				error?: { code?: string; message?: string }
				code?: string
			}
		}
		code?: string
		message?: string
	}

	if (!axiosLike.response) {
		return new ApiError(
			'Network error. Please check your connection.',
			0,
			'NETWORK_ERROR',
		)
	}

	const { status = 500, data } = axiosLike.response
	const code = data?.error?.code || data?.code || 'INTERNAL_ERROR'
	const message =
		data?.error?.message ||
		data?.message ||
		STATUS_FALLBACK_MESSAGES[status] ||
		'An unexpected error occurred.'

	return new ApiError(message, status, code)
}

// ─── Helpers ────────────────────────────────────────

/**
 * Check if an error should trigger logout (expired session).
 */
export function shouldLogout(error: unknown): boolean {
	const parsed = parseError(error)
	return parsed.status === 401 || parsed.status === 403
}

// ─── Async Error Wrapper (HOF) ──────────────────────

interface SafeResult<T> {
	success: true
	data: T
}
interface SafeError {
	success: false
	error: string
	code: string
	status: number
}
type SafeResponse<T> = SafeResult<T> | SafeError

/**
 * Wrap an async function with standardized error handling.
 * Returns `{ success: true, data }` or `{ success: false, error, code }`.
 *
 * @example
 * const safeCreate = withErrorHandling(recipeService.create)
 * const result = await safeCreate({ title: 'Pasta' })
 * if (result.success) { console.log(result.data) }
 * else { toast.error(result.error) }
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
	fn: (...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<SafeResponse<TReturn>> {
	return async (...args: TArgs) => {
		try {
			const data = await fn(...args)
			return { success: true, data }
		} catch (err) {
			const parsed = parseError(err)
			return {
				success: false,
				error: parsed.message,
				code: parsed.code,
				status: parsed.status,
			}
		}
	}
}
