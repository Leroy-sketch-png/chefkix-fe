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
import { MultiSelect } from '@/components/ui/multi-select'

// ============================================================================
// Recipe Filter Constants
// ============================================================================

export const DIETARY_OPTIONS = [
	{ label: 'Vegetarian', value: 'vegetarian' },
	{ label: 'Vegan', value: 'vegan' },
	{ label: 'Gluten-Free', value: 'gluten-free' },
	{ label: 'Dairy-Free', value: 'dairy-free' },
	{ label: 'Keto', value: 'keto' },
	{ label: 'Paleo', value: 'paleo' },
]

export const CUISINE_OPTIONS = [
	{ label: 'Italian', value: 'italian' },
	{ label: 'Mexican', value: 'mexican' },
	{ label: 'American', value: 'american' },
	{ label: 'French', value: 'french' },
	{ label: 'Mediterranean', value: 'mediterranean' },
	{ label: 'Indian', value: 'indian' },
	{ label: 'Asian', value: 'asian' },
	{ label: 'Vietnamese', value: 'vietnamese' },
	{ label: 'Thai', value: 'thai' },
	{ label: 'Chinese', value: 'chinese' },
	{ label: 'Japanese', value: 'japanese' },
	{ label: 'Korean', value: 'korean' },
]

export const DIFFICULTY_OPTIONS = [
	{ label: 'Easy', value: 'easy' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'Hard', value: 'hard' },
	{ label: 'Expert', value: 'expert' },
]

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
				className='flex h-11 items-center gap-2 rounded-radius border border-border-subtle bg-bg-card px-4 text-sm font-semibold leading-normal transition-all hover:border-primary hover:shadow-sm'
			>
				<Filter className='size-4.5 text-text-secondary' />
				<span>Filters</span>
				{activeFiltersCount > 0 && (
					<span className='min-w-4.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground'>
						{activeFiltersCount}
					</span>
				)}
			</button>

			{/* Sort Dropdown - Simplified for now, can be enhanced with Radix UI dropdown */}
			<div className='relative'>
				<button className='flex h-11 items-center gap-2 rounded-radius border border-border-subtle bg-bg-card px-4 text-sm font-semibold leading-normal transition-all hover:border-primary hover:shadow-sm'>
					<ArrowUpDown className='size-4.5 text-text-secondary' />
					<span>{selectedSort}</span>
					<ChevronDown className='size-4.5 text-text-secondary' />
				</button>
			</div>

			{/* View Toggle */}
			<div className='flex gap-1 rounded-[var(--radius)] border border-border-subtle bg-bg-hover p-1'>
				<button
					onClick={() => onViewModeChange?.('grid')}
					className={cn(
						'h-11 w-11 rounded-lg p-2 transition-all',
						viewMode === 'grid'
							? 'bg-bg-card text-primary shadow-sm'
							: 'text-text-secondary hover:bg-bg-card hover:text-text-primary',
					)}
					aria-label='Grid view'
				>
					<Grid className='size-4.5' />
				</button>
				<button
					onClick={() => onViewModeChange?.('list')}
					className={cn(
						'h-11 w-11 rounded-lg p-2 transition-all',
						viewMode === 'list'
							? 'bg-bg-card text-primary shadow-sm'
							: 'text-text-secondary hover:bg-bg-card hover:text-text-primary',
					)}
					aria-label='List view'
				>
					<List className='size-4.5' />
				</button>
			</div>

			{/* Results Count */}
			<div className='ml-auto text-sm leading-normal text-text-secondary'>
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
			<span className='text-xs font-semibold leading-normal text-text-secondary'>
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
						className='grid h-6 w-6 place-items-center rounded-full p-0.5 transition-colors hover:bg-primary/20'
						aria-label={`Remove ${filter} filter`}
					>
						<X className='h-3.5 w-3.5' />
					</button>
				</div>
			))}

			{filters.length > 1 && (
				<button
					onClick={onClearAll}
					className='h-11 rounded-lg px-3 text-xs font-semibold leading-normal text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary'
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
			<div className='grid size-4.5 flex-shrink-0 place-items-center rounded-md border-2 border-border transition-all peer-checked:border-primary peer-checked:bg-primary'>
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
			<div className='grid size-4.5 flex-shrink-0 place-items-center rounded-full border-2 border-border transition-all peer-checked:border-primary'>
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
				<Star className='size-4.5 fill-[var(--gold)] text-[var(--gold)]' />
				<span className='text-sm'>{rating}+</span>
			</div>
		</label>
	)
}

// ============================================================================
// Multi-Select Filter Component
// ============================================================================

interface MultiSelectFilterProps {
	label: string
	options: Array<{ label: string; value: string }>
	value: string[]
	onChange: (values: string[]) => void
	showOtherOption?: boolean
}

export const MultiSelectFilter = ({
	label,
	options,
	value,
	onChange,
	showOtherOption = false,
}: MultiSelectFilterProps) => {
	return (
		<div className='mb-4'>
			<MultiSelect
				label={label}
				options={options}
				value={value}
				onChange={onChange}
				showOtherOption={showOtherOption}
			/>
		</div>
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
// Re-export enhanced RangeSlider from ui components
export { RangeSlider } from '@/components/ui/range-slider'
