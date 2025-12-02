'use client'

import { useState } from 'react'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetBody,
	SheetFooter,
	SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import { RangeSlider } from '@/components/ui/range-slider'
import { RatingSelector } from '@/components/ui/rating-selector'
import { Filter, X } from 'lucide-react'
import {
	DIETARY_OPTIONS,
	CUISINE_OPTIONS,
	DIFFICULTY_OPTIONS,
} from '@/components/shared/FilterSort'

interface RecipeFiltersSheetProps {
	onApply?: (filters: RecipeFilters) => void
	initialFilters?: RecipeFilters
}

export interface RecipeFilters {
	dietary: string[]
	cuisine: string[]
	difficulty: string[]
	cookingTimeMax: number
	rating: number | null
}

/**
 * RecipeFiltersSheet - Mobile-optimized filter sheet for recipes
 *
 * Uses Sheet component with bottom variant on mobile for native-app-like experience.
 * Includes dietary restrictions, cuisine, difficulty, cooking time, and rating filters.
 *
 * @example
 * <RecipeFiltersSheet onApply={handleFiltersApply} />
 */
export const RecipeFiltersSheet = ({
	onApply,
	initialFilters,
}: RecipeFiltersSheetProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const [filters, setFilters] = useState<RecipeFilters>(
		initialFilters || {
			dietary: [],
			cuisine: [],
			difficulty: [],
			cookingTimeMax: 1440, // 24 hours in minutes
			rating: null,
		},
	)

	const handleApply = () => {
		onApply?.(filters)
		setIsOpen(false)
	}

	const handleReset = () => {
		const resetFilters: RecipeFilters = {
			dietary: [],
			cuisine: [],
			difficulty: [],
			cookingTimeMax: 1440, // 24 hours
			rating: null,
		}
		setFilters(resetFilters)
	}

	const activeFiltersCount =
		filters.dietary.length +
		filters.cuisine.length +
		filters.difficulty.length +
		(filters.rating ? 1 : 0) +
		(filters.cookingTimeMax < 1440 ? 1 : 0)

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button variant='outline' className='relative'>
					<Filter className='h-4 w-4 mr-2' />
					Filters
					{activeFiltersCount > 0 && (
						<span className='ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'>
							{activeFiltersCount}
						</span>
					)}
				</Button>
			</SheetTrigger>

			<SheetContent
				side='bottom'
				className='h-sheet-mobile md:h-auto md:max-w-lg md:rounded-t-lg'
			>
				<SheetHeader>
					<SheetTitle className='flex items-center justify-between'>
						<span>Recipe Filters</span>
						{activeFiltersCount > 0 && (
							<button
								onClick={handleReset}
								className='mr-8 text-sm font-normal text-text-secondary hover:text-text-primary'
							>
								Reset all
							</button>
						)}
					</SheetTitle>
				</SheetHeader>

				<SheetBody className='space-y-6 py-6'>
					{/* Dietary Restrictions */}
					<div className='space-y-2'>
						<label className='text-sm font-semibold text-text-primary'>
							Dietary Restrictions
						</label>
						<MultiSelect
							options={DIETARY_OPTIONS}
							value={filters.dietary}
							onChange={dietary => setFilters(prev => ({ ...prev, dietary }))}
						/>
					</div>

					{/* Cuisine */}
					<div className='space-y-2'>
						<label className='text-sm font-semibold text-text-primary'>
							Cuisine Type
						</label>
						<MultiSelect
							options={CUISINE_OPTIONS}
							value={filters.cuisine}
							onChange={cuisine => setFilters(prev => ({ ...prev, cuisine }))}
						/>
					</div>

					{/* Difficulty */}
					<div className='space-y-2'>
						<label className='text-sm font-semibold text-text-primary'>
							Difficulty Level
						</label>
						<MultiSelect
							options={DIFFICULTY_OPTIONS}
							value={filters.difficulty}
							onChange={difficulty =>
								setFilters(prev => ({ ...prev, difficulty }))
							}
						/>
					</div>

					{/* Cooking Time */}
					<div className='space-y-3'>
						<label className='text-sm font-semibold text-text-primary'>
							Max Cooking Time
						</label>
						<RangeSlider
							min={0}
							max={1440}
							step={15}
							value={filters.cookingTimeMax}
							onChange={cookingTimeMax =>
								setFilters(prev => ({ ...prev, cookingTimeMax }))
							}
							formatLabel={value => {
								if (value >= 60) {
									const hours = Math.floor(value / 60)
									const mins = value % 60
									return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
								}
								return `${value}m`
							}}
						/>
					</div>

					{/* Rating */}
					<div className='space-y-2'>
						<label className='text-sm font-semibold text-text-primary'>
							Minimum Rating
						</label>
						<RatingSelector
							value={filters.rating ?? undefined}
							onChange={rating => setFilters(prev => ({ ...prev, rating }))}
						/>
					</div>
				</SheetBody>

				<SheetFooter className='flex gap-2'>
					<Button
						variant='outline'
						onClick={() => setIsOpen(false)}
						className='flex-1'
					>
						Cancel
					</Button>
					<Button onClick={handleApply} className='flex-1'>
						Apply Filters
						{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
