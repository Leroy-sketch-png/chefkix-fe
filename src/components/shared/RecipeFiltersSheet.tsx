'use client'

import { useTranslations } from 'next-intl'

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
import { Filter, Shield } from 'lucide-react'
import {
	DIETARY_OPTIONS,
	CUISINE_OPTIONS,
	DIFFICULTY_OPTIONS,
} from '@/components/shared/FilterSort'

interface RecipeFiltersSheetProps {
	onApply?: (filters: RecipeFilters) => void
	initialFilters?: RecipeFilters
	/** Show the "First-Timer Friendly" toggle prominently (for new users) */
	showFirstTimerPromo?: boolean
}

export interface RecipeFilters {
	dietary: string[]
	cuisine: string[]
	difficulty: string[]
	cookingTimeMax: number
	rating: number | null
	/** Filter to show only Foolproof quality tier recipes - perfect for beginners */
	foolproofOnly: boolean
}

/**
 * RecipeFiltersSheet - Mobile-optimized filter sheet for recipes
 *
 * Uses Sheet component with bottom variant on mobile for native-app-like experience.
 * Includes dietary restrictions, cuisine, difficulty, cooking time, rating, and
 * a "First-Timer Friendly" toggle for Foolproof recipes.
 *
 * @example
 * <RecipeFiltersSheet onApply={handleFiltersApply} />
 */
export const RecipeFiltersSheet = ({
	onApply,
	initialFilters,
	showFirstTimerPromo = false,
}: RecipeFiltersSheetProps) => {
	const t = useTranslations('shared')
	const [isOpen, setIsOpen] = useState(false)
	const [filters, setFilters] = useState<RecipeFilters>(
		initialFilters || {
			dietary: [],
			cuisine: [],
			difficulty: [],
			cookingTimeMax: 1440, // 24 hours in minutes
			rating: null,
			foolproofOnly: false,
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
			foolproofOnly: false,
		}
		setFilters(resetFilters)
	}

	const activeFiltersCount =
		filters.dietary.length +
		filters.cuisine.length +
		filters.difficulty.length +
		(filters.rating ? 1 : 0) +
		(filters.cookingTimeMax < 1440 ? 1 : 0) +
		(filters.foolproofOnly ? 1 : 0)

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button variant='outline' className='relative'>
					<Filter className='size-4' />
					{t('fsFilters')}
					{activeFiltersCount > 0 && (
						<span className='ml-2 flex size-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white'>
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
						<span>{t('rfTitle')}</span>
						{activeFiltersCount > 0 && (
							<button
								type='button'
								onClick={handleReset}
								className='mr-8 text-sm font-normal text-text-secondary hover:text-text-primary'
							>
								{t('rfResetAll')}
							</button>
						)}
					</SheetTitle>
				</SheetHeader>

				<SheetBody className='space-y-6 py-6'>
					{/* First-Timer Friendly Toggle - Foolproof recipes */}
					<div
						className={`rounded-xl border p-4 transition-colors ${
							filters.foolproofOnly
								? 'border-warning/40 bg-warning/5'
								: 'border-border-subtle bg-bg-elevated'
						}`}
					>
						<label className='flex cursor-pointer items-start gap-3'>
							<input
								type='checkbox'
								checked={filters.foolproofOnly}
								onChange={e =>
									setFilters(prev => ({
										...prev,
										foolproofOnly: e.target.checked,
									}))
								}
								className='mt-0.5 size-5 rounded border-border-subtle accent-warning'
							/>
							<div className='flex-1'>
								<div className='flex items-center gap-2'>
									<Shield className='size-4 text-warning' />
									<span className='font-semibold text-text'>
										{t('rfFirstTimer')}
									</span>
								</div>
								<p className='mt-1 text-xs text-text-muted'>
									{t('rfFirstTimerDesc')}
									{showFirstTimerPromo && (
										<span className='ml-1 font-medium text-warning'>
											{t('rfFirstTimerSuccess')}
										</span>
									)}
								</p>
							</div>
						</label>
					</div>

					{/* Dietary Restrictions */}
					<div className='space-y-2'>
						<label className='text-sm font-semibold text-text-primary'>
							{t('rfDietary')}
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
							{t('rfCuisine')}
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
							{t('rfDifficulty')}
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
							{t('rfMaxTime')}
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
							{t('rfMinRating')}
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
						{t('rfCancel')}
					</Button>
					<Button onClick={handleApply} className='flex-1'>
						{t('rfApply')}
						{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
