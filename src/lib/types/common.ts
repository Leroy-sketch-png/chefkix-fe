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
