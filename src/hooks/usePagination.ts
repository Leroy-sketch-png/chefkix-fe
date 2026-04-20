'use client'

import * as React from 'react'

interface UsePaginationOptions {
	totalItems: number
	pageSize?: number
	initialPage?: number
}

interface UsePaginationReturn {
	currentPage: number
	totalPages: number
	pageSize: number
	startIndex: number
	endIndex: number
	setPage: (page: number) => void
	nextPage: () => void
	prevPage: () => void
	setPageSize: (size: number) => void
	canGoNext: boolean
	canGoPrev: boolean
}

/**
 * Stateful pagination logic.
 * Pairs with <Pagination> component for UI.
 *
 * @example
 * const pag = usePagination({ totalItems: 100, pageSize: 10 })
 * const pageItems = items.slice(pag.startIndex, pag.endIndex)
 */
export function usePagination({
	totalItems,
	pageSize: initialPageSize = 10,
	initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
	const [currentPage, setCurrentPage] = React.useState(initialPage)
	const [pageSize, setPageSizeState] = React.useState(initialPageSize)

	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

	// Clamp current page if total pages shrink
	React.useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const setPage = React.useCallback(
		(page: number) => {
			setCurrentPage(Math.max(1, Math.min(page, totalPages)))
		},
		[totalPages],
	)

	const nextPage = React.useCallback(() => {
		setCurrentPage(p => Math.min(p + 1, totalPages))
	}, [totalPages])

	const prevPage = React.useCallback(() => {
		setCurrentPage(p => Math.max(p - 1, 1))
	}, [])

	const setPageSize = React.useCallback((size: number) => {
		setPageSizeState(size)
		setCurrentPage(1) // Reset to page 1 on size change
	}, [])

	const startIndex = (currentPage - 1) * pageSize
	const endIndex = Math.min(startIndex + pageSize, totalItems)

	return {
		currentPage,
		totalPages,
		pageSize,
		startIndex,
		endIndex,
		setPage,
		nextPage,
		prevPage,
		setPageSize,
		canGoNext: currentPage < totalPages,
		canGoPrev: currentPage > 1,
	}
}
