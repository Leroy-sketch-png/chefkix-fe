'use client'

import { useTranslations } from 'next-intl'

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
	const t = useTranslations('shared')
	const sortOptions = [
		{ value: 'popular', label: t('fsSortPopular') },
		{ value: 'newest', label: t('fsSortNewest') },
		{ value: 'rating', label: t('fsSortRated') },
		{ value: 'quickest', label: t('fsSortQuickest') },
	]

	const selectedSort =
		sortOptions.find(opt => opt.value === sortValue)?.label || t('fsSortPopular')

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-3 border-b border-border py-4',
				className,
			)}
		>
			{/* Filter Button */}
			<button
				type='button'
				onClick={onFilterClick}
				className='flex h-11 items-center gap-2 rounded-radius border border-border-subtle bg-bg-card px-4 text-sm font-semibold leading-normal transition-all hover:border-brand hover:bg-bg-elevated'
			>
				<Filter className='size-4.5 text-text-secondary' />
				<span>{t('fsFilters')}</span>
				{activeFiltersCount > 0 && (
					<span className='min-w-4.5 rounded-full bg-brand px-1.5 py-0.5 text-xs font-bold text-white'>
						{activeFiltersCount}
					</span>
				)}
			</button>

			{/* Sort Dropdown - Simplified for now, can be enhanced with Radix UI dropdown */}
			<div className='relative'>
				<button type='button' className='flex h-11 items-center gap-2 rounded-radius border border-border-subtle bg-bg-card px-4 text-sm font-semibold leading-normal transition-all hover:border-brand hover:bg-bg-elevated'>
					<ArrowUpDown className='size-4.5 text-text-secondary' />
					<span>{selectedSort}</span>
					<ChevronDown className='size-4.5 text-text-secondary' />
				</button>
			</div>

			{/* View Toggle */}
			<div className='flex gap-1 rounded-[var(--radius)] border border-border-subtle bg-bg-hover p-1'>
				<button
					type='button'
					onClick={() => onViewModeChange?.('grid')}
					className={cn(
						'size-11 rounded-lg p-2 transition-all',
						viewMode === 'grid'
							? 'bg-bg-card text-brand'
							: 'text-text-secondary hover:bg-bg-card hover:text-text-primary',
					)}
					aria-label={t('fsGridView')}
				>
					<Grid className='size-4.5' />
				</button>
				<button
					type='button'
					onClick={() => onViewModeChange?.('list')}
					className={cn(
						'size-11 rounded-lg p-2 transition-all',
						viewMode === 'list'
							? 'bg-bg-card text-brand'
							: 'text-text-secondary hover:bg-bg-card hover:text-text-primary',
					)}
					aria-label={t('fsListView')}
				>
					<List className='size-4.5' />
				</button>
			</div>

			{/* Results Count */}
			<div className='ml-auto text-sm leading-normal text-text-secondary'>
				{t('fsShowing', { start: currentStart, end: currentEnd, total: totalResults })}
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
	const t = useTranslations('shared')
	if (filters.length === 0) return null

	return (
		<div className={cn('flex flex-wrap items-center gap-2 py-3', className)}>
			<span className='text-xs font-semibold leading-normal text-text-secondary'>
				Active filters:
			</span>

			{filters.map(filter => (
				<div
					key={filter}
					className='flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand'
				>
					<span>{filter}</span>
					<button
						type='button'
						onClick={() => onRemove?.(filter)}
						className='grid size-6 place-items-center rounded-full p-0.5 transition-colors hover:bg-brand/20'
						aria-label={t('fsRemoveFilter', { filter })}
					>
						<X className='h-3.5 w-3.5' />
					</button>
				</div>
			))}

			{filters.length > 1 && (
				<button
					type='button'
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
	const t = useTranslations('shared')
	return (
		<div
			className={cn(
				'flex h-screen w-80 flex-col overflow-hidden border-r border-border bg-bg-card',
				!isOpen && 'hidden',
				className,
			)}
		>
			{/* Header */}
			<div className='flex items-center justify-between border-b border-border p-5'>
				<h3 className='text-lg font-bold text-text'>{t('fsFilters')}</h3>
				<button
					type='button'
					onClick={onClose}
					aria-label={t('fsCloseFilters')}
					className='rounded-md p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text'
				>
					<X className='size-5' />
				</button>
			</div>

			{/* Content */}
			<div className='flex-1 overflow-y-auto p-5'>{children}</div>

			{/* Footer */}
			<div className='flex gap-3 border-t border-border p-5'>
				<Button variant='outline' onClick={onReset} className='flex-1'>
					{t('fsReset')}
				</Button>
				<Button onClick={onApply} className='flex-1'>
					{t('fsApplyFilters')}
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
			<h4 className='mb-3 text-sm font-bold uppercase tracking-wide text-text'>
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
		<label className='mb-2 flex cursor-pointer items-center gap-2.5 rounded-lg p-2.5 transition-colors hover:bg-bg-hover'>
			<input
				type='checkbox'
				checked={checked}
				onChange={e => onChange?.(e.target.checked)}
				className='peer sr-only'
			/>
			<div className='grid size-4.5 flex-shrink-0 place-items-center rounded-md border-2 border-border transition-all peer-checked:border-brand peer-checked:bg-brand'>
				<div className='h-2.5 w-2.5 scale-0 rounded-sm bg-card transition-transform peer-checked:scale-100' />
			</div>
			<span className='flex-1 text-sm text-text'>{label}</span>
			{count !== undefined && (
				<span className='text-xs text-text-secondary'>({count})</span>
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
		<label className='mb-2 flex cursor-pointer items-center gap-2.5 rounded-lg p-2.5 transition-colors hover:bg-bg-hover'>
			<input
				type='radio'
				name={name}
				checked={checked}
				onChange={onChange}
				className='peer sr-only'
			/>
			<div className='grid size-4.5 flex-shrink-0 place-items-center rounded-full border-2 border-border transition-all peer-checked:border-brand'>
				<div className='h-2.5 w-2.5 scale-0 rounded-full bg-brand transition-transform peer-checked:scale-100' />
			</div>
			<span className='text-sm text-text'>{label}</span>
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
			<div className='flex items-center gap-2 rounded-[var(--radius)] border-2 border-border px-4 py-2.5 transition-all peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:font-semibold hover:border-brand hover:bg-brand/5'>
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
			type='button'
			onClick={onClick}
			className={cn(
				'rounded-full border px-4 py-2 text-xs font-semibold transition-all',
				active
					? 'border-brand bg-brand text-white'
					: 'border-border bg-muted/20 text-text hover:border-brand hover:bg-brand/5',
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
