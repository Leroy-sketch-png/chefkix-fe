export interface PaginationInput {
	limit?: number
	offset?: number
	page?: number
	size?: number
}

/**
 * Map frontend pagination params (limit/offset or page/limit) to backend pagination (page/size).
 * Rules:
 * - If `size` is provided, use it; otherwise use `limit`.
 * - If `page` is provided, use it as-is. If `offset`+`limit` are provided, compute page = offset/limit.
 * - This function prefers explicit `page` and `size` when present.
 */
export function toBackendPagination(params?: PaginationInput) {
	if (!params) return undefined

	const out: { page?: number; size?: number } = {}

	if (params.size !== undefined) {
		out.size = params.size
	} else if (params.limit !== undefined) {
		out.size = params.limit
	}

	if (params.page !== undefined) {
		out.page = params.page
	} else if (
		params.offset !== undefined &&
		out.size !== undefined &&
		out.size > 0
	) {
		out.page = Math.floor(params.offset / out.size)
	}

	// If nothing mapped, return undefined to avoid sending empty params
	return Object.keys(out).length > 0 ? out : undefined
}
