'use client'

import { useEffect, useState } from 'react'
import { Recipe } from '@/lib/types/recipe'
import { getAllRecipes, getTrendingRecipes } from '@/services/recipe'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { RecipeFiltersSheet } from '@/components/shared/RecipeFiltersSheet'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { Search, TrendingUp, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StaggerContainer } from '@/components/ui/stagger-animation'

interface RecipeFilters {
	dietary: string[]
	cuisine: string[]
	difficulty: string[]
	cookingTimeMax: number
	rating: number | null
}

export default function ExplorePage() {
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'all' | 'trending'>('all')
	const [filters, setFilters] = useState<RecipeFilters>({
		dietary: [],
		cuisine: [],
		difficulty: [],
		cookingTimeMax: 120,
		rating: null,
	})

	useEffect(() => {
		const fetchRecipes = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response =
					viewMode === 'trending'
						? await getTrendingRecipes({ limit: 20 })
						: await getAllRecipes({ limit: 20, search: searchQuery })

				if (response.success && response.data) {
					// Apply client-side filters
					let filtered = response.data

					// Filter by dietary restrictions
					if (filters.dietary.length > 0) {
						filtered = filtered.filter(recipe =>
							filters.dietary.some(diet =>
								recipe.dietaryTags?.some(tag =>
									tag.toLowerCase().includes(diet.toLowerCase()),
								),
							),
						)
					}

					// Filter by cuisine
					if (filters.cuisine.length > 0) {
						filtered = filtered.filter(recipe =>
							filters.cuisine.some(cuisine =>
								recipe.cuisine?.toLowerCase().includes(cuisine.toLowerCase()),
							),
						)
					}

					// Filter by difficulty
					if (filters.difficulty.length > 0) {
						filtered = filtered.filter(recipe =>
							filters.difficulty
								.map(d => d.toUpperCase())
								.includes(recipe.difficulty),
						)
					}

					// Filter by cooking time
					const totalTime = (recipe: Recipe) =>
						recipe.prepTime + recipe.cookTime
					filtered = filtered.filter(
						recipe => totalTime(recipe) <= filters.cookingTimeMax,
					)

					// Filter by rating (future: when rating field exists)
					// if (filters.rating !== null) {
					// 	filtered = filtered.filter(
					// 		recipe => (recipe as any).rating >= filters.rating!,
					// 	)
					// }

					setRecipes(filtered)
				}
			} catch (err) {
				setError('Failed to load recipes')
			} finally {
				setIsLoading(false)
			}
		}

		const debounce = setTimeout(() => {
			fetchRecipes()
		}, 300)

		return () => clearTimeout(debounce)
	}, [searchQuery, viewMode, filters])

	const handleRecipeUpdate = (updatedRecipe: Recipe) => {
		setRecipes(prev =>
			prev.map(r => (r.id === updatedRecipe.id ? updatedRecipe : r)),
		)
	}

	const handleFiltersApply = (newFilters: RecipeFilters) => {
		setFilters(newFilters)
	}

	const activeFiltersCount =
		filters.dietary.length +
		filters.cuisine.length +
		filters.difficulty.length +
		(filters.cookingTimeMax < 120 ? 1 : 0) +
		(filters.rating !== null ? 1 : 0)

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<div className='mb-6'>
					<h1 className='mb-2 text-3xl font-bold'>Explore Recipes</h1>
					<p className='text-muted-foreground'>
						Discover new dishes and flavors from around the world.
					</p>
				</div>
				{/* Search & Filter Bar */}
				<div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							placeholder='Search recipes...'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className='pl-10'
						/>
					</div>
					<div className='flex gap-2'>
						{/* Filter Sheet Button */}
						<RecipeFiltersSheet
							initialFilters={filters}
							onApply={handleFiltersApply}
						/>

						{/* View Mode Buttons */}
						<button
							onClick={() => setViewMode('all')}
							className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
								viewMode === 'all'
									? 'bg-primary text-primary-foreground'
									: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
							}`}
						>
							All Recipes
						</button>
						<button
							onClick={() => setViewMode('trending')}
							className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
								viewMode === 'trending'
									? 'bg-primary text-primary-foreground'
									: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
							}`}
						>
							<TrendingUp className='h-4 w-4' />
							Trending
						</button>
					</div>
				</div>{' '}
				{/* Content */}
				{isLoading && (
					<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
						<RecipeCardSkeleton count={6} />
					</div>
				)}
				{error && (
					<ErrorState
						title='Failed to load recipes'
						message={error}
						onRetry={() => window.location.reload()}
					/>
				)}
				{!isLoading && !error && recipes.length === 0 && (
					<EmptyStateGamified
						variant='search'
						title='No recipes found'
						description={
							searchQuery
								? `No recipes match "${searchQuery}". Try a different search.`
								: 'Be the first to share a recipe!'
						}
						searchSuggestions={
							searchQuery ? ['Pasta', 'Curry', 'Salad', 'Dessert'] : undefined
						}
						primaryAction={{
							label: 'Create Recipe',
							href: '/create',
						}}
					/>
				)}
				{!isLoading && !error && recipes.length > 0 && (
					<StaggerContainer className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
						{recipes.map(recipe => (
							<RecipeCard
								key={recipe.id}
								recipe={recipe}
								onUpdate={handleRecipeUpdate}
							/>
						))}
					</StaggerContainer>
				)}
			</PageContainer>
		</PageTransition>
	)
}
