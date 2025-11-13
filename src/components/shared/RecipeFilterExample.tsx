'use client'

import { useState } from 'react'
import {
	FilterBar,
	ActiveFilters,
	FilterPanel,
	FilterSection,
	CheckboxFilter,
	RadioFilter,
	MultiSelectFilter,
	CuisinePill,
	DIETARY_OPTIONS,
	CUISINE_OPTIONS,
	DIFFICULTY_OPTIONS,
} from '@/components/shared/FilterSort'
import { RangeSlider } from '@/components/ui/range-slider'
import { RatingSelector } from '@/components/ui/rating-selector'

/**
 * Example: Complete Recipe Filter System
 *
 * This component demonstrates the full FilterSort pattern with:
 * - Filter bar with view toggle
 * - Active filter chips
 * - Comprehensive filter panel with all options
 * - Dietary restrictions (checkboxes)
 * - Difficulty levels (radio)
 * - Cooking time (range slider)
 * - Minimum rating (star selector)
 * - Cuisine types (pills)
 */
export const RecipeFilterExample = () => {
	// View state
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [showFilterPanel, setShowFilterPanel] = useState(false)

	// Filter states
	const [selectedDietary, setSelectedDietary] = useState<string[]>([])
	const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
	const [cookingTime, setCookingTime] = useState(30)
	const [minRating, setMinRating] = useState<number>()
	const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])

	// Compute active filters for display
	const activeFilters = [
		...selectedDietary.map(
			d => DIETARY_OPTIONS.find(o => o.value === d)?.label || d,
		),
		selectedDifficulty !== 'all'
			? DIFFICULTY_OPTIONS.find(o => o.value === selectedDifficulty)?.label
			: null,
		cookingTime < 120 ? `Under ${cookingTime} min` : null,
		minRating ? `${minRating}+ stars` : null,
		...selectedCuisines.map(
			c => CUISINE_OPTIONS.find(o => o.value === c)?.label || c,
		),
	].filter(Boolean) as string[]

	const handleRemoveFilter = (filter: string) => {
		// Logic to remove specific filter based on label
		// This is simplified - in production you'd map back to the filter type
	}

	const handleClearAll = () => {
		setSelectedDietary([])
		setSelectedDifficulty('all')
		setCookingTime(30)
		setMinRating(undefined)
		setSelectedCuisines([])
	}

	const handleApply = () => {
		// Apply filters and fetch results (implementation pending)
		setShowFilterPanel(false)
	}

	return (
		<div className='flex h-screen'>
			{/* Filter Panel */}
			<FilterPanel
				isOpen={showFilterPanel}
				onClose={() => setShowFilterPanel(false)}
				onApply={handleApply}
				onReset={handleClearAll}
			>
				{/* Dietary Restrictions */}
				<FilterSection title='Dietary Restrictions'>
					<MultiSelectFilter
						label='Select dietary preferences'
						options={DIETARY_OPTIONS}
						value={selectedDietary}
						onChange={setSelectedDietary}
					/>
				</FilterSection>

				{/* Difficulty Level */}
				<FilterSection title='Difficulty Level'>
					<RadioFilter
						name='difficulty'
						label='All Levels'
						checked={selectedDifficulty === 'all'}
						onChange={() => setSelectedDifficulty('all')}
					/>
					{DIFFICULTY_OPTIONS.map(opt => (
						<RadioFilter
							key={opt.value}
							name='difficulty'
							label={opt.label}
							checked={selectedDifficulty === opt.value}
							onChange={() => setSelectedDifficulty(opt.value)}
						/>
					))}
				</FilterSection>

				{/* Cooking Time */}
				<FilterSection title='Cooking Time'>
					<RangeSlider
						min={15}
						max={120}
						step={5}
						value={cookingTime}
						onChange={setCookingTime}
						formatLabel={val => `${val} min`}
					/>
				</FilterSection>

				{/* Minimum Rating */}
				<FilterSection title='Minimum Rating'>
					<RatingSelector
						value={minRating}
						onChange={setMinRating}
						options={[4.5, 4.0, 3.5, 3.0]}
					/>
				</FilterSection>

				{/* Cuisine Type */}
				<FilterSection title='Cuisine Type'>
					<div className='flex flex-wrap gap-2'>
						{CUISINE_OPTIONS.map(cuisine => (
							<CuisinePill
								key={cuisine.value}
								label={cuisine.label}
								active={selectedCuisines.includes(cuisine.value)}
								onClick={() => {
									setSelectedCuisines(prev =>
										prev.includes(cuisine.value)
											? prev.filter(c => c !== cuisine.value)
											: [...prev, cuisine.value],
									)
								}}
							/>
						))}
					</div>
				</FilterSection>
			</FilterPanel>

			{/* Main Content Area */}
			<div className='flex-1 flex-col'>
				{/* Filter Bar */}
				<FilterBar
					totalResults={234}
					currentStart={1}
					currentEnd={24}
					activeFiltersCount={activeFilters.length}
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					onFilterClick={() => setShowFilterPanel(!showFilterPanel)}
				/>

				{/* Active Filters */}
				{activeFilters.length > 0 && (
					<div className='border-b border-border'>
						<ActiveFilters
							filters={activeFilters}
							onRemove={handleRemoveFilter}
							onClearAll={handleClearAll}
							className='px-4'
						/>
					</div>
				)}

				{/* Recipe Grid/List */}
				<div className='p-6'>
					<div
						className={
							viewMode === 'grid'
								? 'grid grid-cols-3 gap-6'
								: 'flex flex-col gap-4'
						}
					>
						{/* Your recipe cards here */}
						<p className='text-text-secondary'>
							Recipe results will appear here...
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
