'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Generate page numbers with ellipsis placeholders.
 * Always shows first, last, and a window around current page.
 */
export function generatePaginationRange(
	currentPage: number,
	totalPages: number,
	siblingCount = 1,
): (number | '...')[] {
	const totalPageNumbers = siblingCount * 2 + 5

	if (totalPages <= totalPageNumbers) {
		return Array.from({ length: totalPages }, (_, i) => i + 1)
	}

	const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
	const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

	const showLeftDots = leftSiblingIndex > 2
	const showRightDots = rightSiblingIndex < totalPages - 1

	if (!showLeftDots && showRightDots) {
		const leftRange = Array.from(
			{ length: 3 + 2 * siblingCount },
			(_, i) => i + 1,
		)
		return [...leftRange, '...', totalPages]
	}

	if (showLeftDots && !showRightDots) {
		const rightRange = Array.from(
			{ length: 3 + 2 * siblingCount },
			(_, i) => totalPages - (3 + 2 * siblingCount) + i + 1,
		)
		return [1, '...', ...rightRange]
	}

	const middleRange = Array.from(
		{ length: rightSiblingIndex - leftSiblingIndex + 1 },
		(_, i) => leftSiblingIndex + i,
	)
	return [1, '...', ...middleRange, '...', totalPages]
}

interface PaginationProps {
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	siblingCount?: number
	className?: string
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	siblingCount = 1,
	className,
}: PaginationProps) {
	if (totalPages <= 1) return null

	const pages = generatePaginationRange(currentPage, totalPages, siblingCount)

	return (
		<nav
			className={cn('flex items-center gap-1', className)}
			aria-label='Pagination'
		>
			<Button
				variant='outline'
				size='icon'
				className='size-8'
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage <= 1}
				aria-label='Previous page'
			>
				<ChevronLeft className='size-4' />
			</Button>

			{pages.map((page, idx) =>
				page === '...' ? (
					<span
						key={`dots-${idx}`}
						className='flex size-8 items-center justify-center text-text-muted'
					>
						<MoreHorizontal className='size-4' />
					</span>
				) : (
					<Button
						key={page}
						variant={page === currentPage ? 'default' : 'outline'}
						size='icon'
						className='size-8'
						onClick={() => onPageChange(page)}
						aria-current={page === currentPage ? 'page' : undefined}
					>
						{page}
					</Button>
				),
			)}

			<Button
				variant='outline'
				size='icon'
				className='size-8'
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage >= totalPages}
				aria-label='Next page'
			>
				<ChevronRight className='size-4' />
			</Button>
		</nav>
	)
}

interface PaginationInfoProps {
	currentPage: number
	pageSize: number
	totalItems: number
	className?: string
}

export function PaginationInfo({
	currentPage,
	pageSize,
	totalItems,
	className,
}: PaginationInfoProps) {
	const start = (currentPage - 1) * pageSize + 1
	const end = Math.min(currentPage * pageSize, totalItems)

	return (
		<p className={cn('text-sm text-text-muted', className)}>
			Showing <span className='font-medium'>{start}</span>--
			<span className='font-medium'>{end}</span> of{' '}
			<span className='font-medium'>{totalItems}</span> results
		</p>
	)
}

interface PageSizeSelectorProps {
	pageSize: number
	onPageSizeChange: (size: number) => void
	options?: number[]
	className?: string
}

export function PageSizeSelector({
	pageSize,
	onPageSizeChange,
	options = [10, 20, 50, 100],
	className,
}: PageSizeSelectorProps) {
	return (
		<div className={cn('flex items-center gap-2 text-sm', className)}>
			<span className='text-text-muted'>Rows per page</span>
			<select
				value={pageSize}
				onChange={e => onPageSizeChange(Number(e.target.value))}
				className='h-8 rounded-md border border-border-subtle bg-bg-card px-2 text-sm text-text'
			>
				{options.map(opt => (
					<option key={opt} value={opt} className='bg-bg-card text-text'>
						{opt}
					</option>
				))}
			</select>
		</div>
	)
}
