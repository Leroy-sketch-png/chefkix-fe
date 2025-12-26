/**
 * Pagination metadata from BE ApiResponse.PaginationMeta
 */
export interface PaginationMeta {
	totalItems: number
	itemsPerPage: number
	totalPages: number
	currentPage: number
}

/**
 * Spring Data Page response structure.
 * Backend uses Pageable and returns Page<T> which has this structure.
 *
 * CRITICAL: When backend returns Page<T>, the actual data is in .content,
 * not directly in the response. Always extract .content array.
 */
export interface Page<T> {
	content: T[]
	totalElements: number
	totalPages: number
	size: number
	number: number // Current page (0-based)
	first: boolean
	last: boolean
	empty: boolean
}

/**
 * Standard API response wrapper - matches BE ApiResponse.java
 * All backend responses are wrapped in this structure.
 */
export interface ApiResponse<T> {
	success: boolean
	statusCode: number
	message?: string
	data?: T
	pagination?: PaginationMeta
	/** Validation errors - field name -> error messages */
	error?: Record<string, string[]>
}

export interface ChildrenProps {
	children: React.ReactNode
}
