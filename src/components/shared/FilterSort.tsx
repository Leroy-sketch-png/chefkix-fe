'use client'

import { useState } from 'react'
import {
	Filter,
	ArrowUpDown,
	Grid,
	List,
	X,
	ChevronDown,
	Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ============================================================================
// Types
// ============================================================================

interface FilterOption {
	value: string
	label: string
	count?: number
}

interface FilterSortProps {
	totalResults: number
	currentStart?: number
	currentEnd?: number
	activeFiltersCount?: number
	viewMode?: 'grid' | 'list'
	sortValue?: string
	onViewModeChange?: (mode: 'grid' | 'list') => void
	onSortChange?: (value: string) => void
	onFilterClick?: () => void
	className?: string
}

// ============================================================================
// Filter Bar Component
// ============================================================================

export const FilterBar = ({
	totalResults,
	currentStart = 1,
	currentEnd = 24,
	activeFiltersCount = 0,
	viewMode = 'grid',
	sortValue = 'popular',
	onViewModeChange,
	onSortChange,
	onFilterClick,
	className,
}: FilterSortProps) => {
	const sortOptions = [
		{ value: 'popular', label: 'Most Popular' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'rating', label: 'Highest Rated' },
		{ value: 'quickest', label: 'Quickest' },
	]

	const selectedSort =
		sortOptions.find(opt => opt.value === sortValue)?.label || 'Most Popular'

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-3 border-b border-border py-4',
				className,
			)}
		>
			{/* Filter Button */}
			<button
				onClick={onFilterClick}
				className='flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-all hover:border-primary hover:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]'
			>
				<Filter className='h-[18px] w-[18px] text-muted-foreground' />
				<span>Filters</span>
				{activeFiltersCount > 0 && (
					<span className='min-w-[18px] rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground'>
						{activeFiltersCount}
					</span>
				)}
			</button>

			{/* Sort Dropdown - Simplified for now, can be enhanced with Radix UI dropdown */}
			<div className='relative'>
				<button className='flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-all hover:border-primary hover:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]'>
					<ArrowUpDown className='h-[18px] w-[18px] text-muted-foreground' />
					<span>{selectedSort}</span>
					<ChevronDown className='h-[18px] w-[18px] text-muted-foreground' />
				</button>
			</div>

			{/* View Toggle */}
			<div className='flex gap-1 rounded-[var(--radius)] border border-border bg-muted/20 p-1'>
				<button
					onClick={() => onViewModeChange?.('grid')}
					className={cn(
						'rounded-lg p-2 transition-all',
						viewMode === 'grid'
							? 'bg-card text-primary shadow-sm'
							: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
					)}
					aria-label='Grid view'
				>
					<Grid className='h-[18px] w-[18px]' />
				</button>
				<button
					onClick={() => onViewModeChange?.('list')}
					className={cn(
						'rounded-lg p-2 transition-all',
						viewMode === 'list'
							? 'bg-card text-primary shadow-sm'
							: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
					)}
					aria-label='List view'
				>
					<List className='h-[18px] w-[18px]' />
				</button>
			</div>

			{/* Results Count */}
			<div className='ml-auto text-sm text-muted-foreground'>
				Showing {currentStart}-{currentEnd} of {totalResults} recipes
			</div>
		</div>
	)
}

// ============================================================================
// Active Filters Component
// ============================================================================

interface ActiveFiltersProps {
	filters: string[]
	onRemove?: (filter: string) => void
	onClearAll?: () => void
	className?: string
}

export const ActiveFilters = ({
	filters,
	onRemove,
	onClearAll,
	className,
}: ActiveFiltersProps) => {
	if (filters.length === 0) return null

	return (
		<div className={cn('flex flex-wrap items-center gap-2 py-3', className)}>
			<span className='text-xs font-semibold text-muted-foreground'>
				Active filters:
			</span>

			{filters.map(filter => (
				<div
					key={filter}
					className='flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary'
				>
					<span>{filter}</span>
					<button
						onClick={() => onRemove?.(filter)}
						className='grid place-items-center rounded-full p-0.5 transition-colors hover:bg-primary/20'
						aria-label={`Remove ${filter} filter`}
					>
						<X className='h-3.5 w-3.5' />
					</button>
				</div>
			))}

			{filters.length > 1 && (
				<button
					onClick={onClearAll}
					className='rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground'
				>
					Clear all
				</button>
			)}
		</div>
	)
}

// ============================================================================
// Filter Panel Component
// ============================================================================

interface FilterPanelProps {
	isOpen?: boolean
	onClose?: () => void
	onApply?: () => void
	onReset?: () => void
	children?: React.ReactNode
	className?: string
}

export const FilterPanel = ({
	isOpen = true,
	onClose,
	onApply,
	onReset,
	children,
	className,
}: FilterPanelProps) => {
	return (
		<div
			className={cn(
				'flex h-screen w-80 flex-col overflow-hidden border-r border-border bg-card',
				!isOpen && 'hidden',
				className,
			)}
		>
			{/* Header */}
			<div className='flex items-center justify-between border-b border-border p-5'>
				<h3 className='text-lg font-bold text-foreground'>Filters</h3>
				<button
					onClick={onClose}
					className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
				>
					<X className='h-5 w-5' />
				</button>
			</div>

			{/* Content */}
			<div className='flex-1 overflow-y-auto p-5'>{children}</div>

			{/* Footer */}
			<div className='flex gap-3 border-t border-border p-5'>
				<Button variant='outline' onClick={onReset} className='flex-1'>
					Reset
				</Button>
				<Button onClick={onApply} className='flex-1'>
					Apply Filters
				</Button>
			</div>
		</div>
	)
}

// ============================================================================
// Filter Section Component
// ============================================================================

interface FilterSectionProps {
	title: string
	children: React.ReactNode
	className?: string
}

export const FilterSection = ({
	title,
	children,
	className,
}: FilterSectionProps) => {
	return (
		<div className={cn('mb-8', className)}>
			<h4 className='mb-3 text-sm font-bold uppercase tracking-wide text-foreground'>
				{title}
			</h4>
			{children}
		</div>
	)
}

// ============================================================================
// Checkbox Filter Option Component
// ============================================================================

interface CheckboxFilterProps {
	label: string
	count?: number
	checked?: boolean
	onChange?: (checked: boolean) => void
}

export const CheckboxFilter = ({
	label,
	count,
	checked = false,
	onChange,
}: CheckboxFilterProps) => {
	return (
		<label className='mb-2 flex cursor-pointer items-center gap-2.5 rounded-lg p-2.5 transition-colors hover:bg-muted'>
			<input
				type='checkbox'
				checked={checked}
				onChange={e => onChange?.(e.target.checked)}
				className='peer sr-only'
			/>
			<div className='grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-md border-2 border-border transition-all peer-checked:border-primary peer-checked:bg-primary'>
				<div className='h-2.5 w-2.5 scale-0 rounded-sm bg-card transition-transform peer-checked:scale-100' />
			</div>
			<span className='flex-1 text-sm text-foreground'>{label}</span>
			{count !== undefined && (
				<span className='text-xs text-muted-foreground'>({count})</span>
			)}
		</label>
	)
}

// ============================================================================
// Radio Filter Option Component
// ============================================================================

interface RadioFilterProps {
	name: string
	label: string
	checked?: boolean
	onChange?: () => void
}

export const RadioFilter = ({
	name,
	label,
	checked = false,
	onChange,
}: RadioFilterProps) => {
	return (
		<label className='mb-2 flex cursor-pointer items-center gap-2.5 rounded-lg p-2.5 transition-colors hover:bg-muted'>
			<input
				type='radio'
				name={name}
				checked={checked}
				onChange={onChange}
				className='peer sr-only'
			/>
			<div className='grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-full border-2 border-border transition-all peer-checked:border-primary'>
				<div className='h-2.5 w-2.5 scale-0 rounded-full bg-primary transition-transform peer-checked:scale-100' />
			</div>
			<span className='text-sm text-foreground'>{label}</span>
		</label>
	)
}

// ============================================================================
// Rating Filter Component
// ============================================================================

interface RatingFilterProps {
	name: string
	rating: number
	checked?: boolean
	onChange?: () => void
}

export const RatingFilter = ({
	name,
	rating,
	checked = false,
	onChange,
}: RatingFilterProps) => {
	return (
		<label className='mb-2 flex cursor-pointer'>
			<input
				type='radio'
				name={name}
				checked={checked}
				onChange={onChange}
				className='peer sr-only'
			/>
			<div className='flex items-center gap-2 rounded-[var(--radius)] border-2 border-border px-4 py-2.5 transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:font-semibold hover:border-primary hover:bg-primary/5'>
				<Star className='h-[18px] w-[18px] fill-[var(--gold)] text-[var(--gold)]' />
				<span className='text-sm'>{rating}+</span>
			</div>
		</label>
	)
}

// ============================================================================
// Cuisine Pill Component
// ============================================================================

interface CuisinePillProps {
	label: string
	active?: boolean
	onClick?: () => void
}

export const CuisinePill = ({
	label,
	active = false,
	onClick,
}: CuisinePillProps) => {
	return (
		<button
			onClick={onClick}
			className={cn(
				'rounded-full border px-4 py-2 text-xs font-semibold transition-all',
				active
					? 'border-primary bg-primary text-primary-foreground'
					: 'border-border bg-muted/20 text-foreground hover:border-primary hover:bg-primary/5',
			)}
		>
			{label}
		</button>
	)
}

// ============================================================================
// Range Slider Component
// ============================================================================

interface RangeSliderProps {
	min: number
	max: number
	value: number
	onChange?: (value: number) => void
	label?: string
	className?: string
}

export const RangeSlider = ({
	min,
	max,
	value,
	onChange,
	label,
	className,
}: RangeSliderProps) => {
	return (
		<div className={cn('py-2', className)}>
			<div className='mb-2 flex justify-between text-xs text-muted-foreground'>
				<span>{min} min</span>
				<span>{max} min</span>
			</div>
			<input
				type='range'
				min={min}
				max={max}
				value={value}
				onChange={e => onChange?.(Number(e.target.value))}
				className='h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted outline-none'
				style={{
					background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((value - min) / (max - min)) * 100}%, var(--muted) ${((value - min) / (max - min)) * 100}%, var(--muted) 100%)`,
				}}
			/>
			<div className='mt-3 text-center text-sm font-semibold text-primary'>
				{label || `Up to ${value} minutes`}
			</div>
		</div>
	)
}
