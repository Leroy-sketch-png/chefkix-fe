'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Recipe, getRecipeImage, getTotalTime } from '@/lib/types/recipe'
import {
	getAllRecipes,
	getTrendingRecipes,
	toggleSaveRecipe,
} from '@/services/recipe'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { RecipeCardEnhanced } from '@/components/recipe'
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { RecipeFiltersSheet } from '@/components/shared/RecipeFiltersSheet'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { Search, TrendingUp, Filter, Compass, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { triggerSaveConfetti } from '@/lib/confetti'
import { toast } from 'sonner'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'

// Difficulty mapping: API (PascalCase) → Enhanced Card (lowercase)
const difficultyMap: Record<
	string,
	'beginner' | 'intermediate' | 'advanced' | 'expert'
> = {
	Beginner: 'beginner',
	Intermediate: 'intermediate',
	Advanced: 'advanced',
	Expert: 'expert',
}

// XP reward calculation (fallback when backend doesn't provide xpReward)
const calculateXpRewardFallback = (recipe: Recipe): number => {
	const baseXp = 50
	const difficultyBonus = {
		Beginner: 0,
		Intermediate: 25,
		Advanced: 50,
		Expert: 100,
	}
	const timeBonus = Math.floor(getTotalTime(recipe) / 10) * 5
	return (
		baseXp +
		(difficultyBonus[recipe.difficulty as keyof typeof difficultyBonus] || 0) +
		timeBonus
	)
}

interface RecipeFilters {
	dietary: string[]
	cuisine: string[]
	difficulty: string[]
	cookingTimeMax: number
	rating: number | null
}

export default function ExplorePage() {
	const router = useRouter()
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'all' | 'trending'>('all')
	const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set())
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

					// Initialize saved recipes set
					const saved = new Set<string>()
					response.data.forEach(recipe => {
						if (recipe.isSaved) saved.add(recipe.id)
					})
					setSavedRecipes(saved)

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
								recipe.cuisineType
									?.toLowerCase()
									.includes(cuisine.toLowerCase()),
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
					filtered = filtered.filter(
						recipe => getTotalTime(recipe) <= filters.cookingTimeMax,
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

	const handleCook = (recipeId: string) => {
		// Navigate to recipe detail page with cooking intent
		router.push(`/recipes/${recipeId}?cook=true`)
	}

	const handleSave = async (recipeId: string) => {
		const wasSaved = savedRecipes.has(recipeId)

		// Optimistic update
		setSavedRecipes(prev => {
			const newSet = new Set(prev)
			if (wasSaved) {
				newSet.delete(recipeId)
			} else {
				newSet.add(recipeId)
			}
			return newSet
		})

		try {
			const response = await toggleSaveRecipe(recipeId)
			if (response.success && response.data) {
				if (response.data.isSaved) {
					triggerSaveConfetti()
					toast.success('Recipe saved!')
				} else {
					toast.success('Recipe unsaved')
				}
			}
		} catch (error) {
			// Revert on error
			setSavedRecipes(prev => {
				const newSet = new Set(prev)
				if (wasSaved) {
					newSet.add(recipeId)
				} else {
					newSet.delete(recipeId)
				}
				return newSet
			})
			toast.error('Failed to save recipe')
		}
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
				{/* Header with animation */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-8'
				>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, ...TRANSITION_SPRING }}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-hero shadow-md shadow-brand/25'
						>
							<Compass className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>Explore Recipes</h1>
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						Discover new dishes and flavors from around the world.
					</p>
				</motion.div>

				{/* Search & Filter Bar */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, ...TRANSITION_SPRING }}
					className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center'
				>
					<div className='group relative flex-1'>
						<Search className='absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand' />
						<Input
							placeholder='Search recipes...'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className='h-12 rounded-2xl border-border-medium bg-bg-card pl-12 text-text shadow-sm transition-all focus:border-brand focus:shadow-md focus:ring-2 focus:ring-brand/20'
						/>
					</div>
					<div className='flex gap-2'>
						{/* Filter Sheet Button */}
						<RecipeFiltersSheet
							initialFilters={filters}
							onApply={handleFiltersApply}
						/>

						{/* View Mode Buttons */}
						<motion.button
							onClick={() => setViewMode('all')}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
								viewMode === 'all'
									? 'bg-gradient-hero text-white shadow-md shadow-brand/30'
									: 'border-2 border-border-medium bg-bg-card text-text-secondary hover:border-brand hover:text-brand'
							}`}
						>
							All Recipes
						</motion.button>
						<motion.button
							onClick={() => setViewMode('trending')}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
								viewMode === 'trending'
									? 'bg-gradient-xp text-white shadow-md shadow-xp/30'
									: 'border-2 border-border-medium bg-bg-card text-text-secondary hover:border-xp hover:text-xp'
							}`}
						>
							<TrendingUp className='size-4' />
							Trending
						</motion.button>
					</div>
				</motion.div>

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
							<RecipeCardEnhanced
								key={recipe.id}
								variant='grid'
								id={recipe.id}
								title={recipe.title}
								description={recipe.description}
								imageUrl={getRecipeImage(recipe)}
								cookTimeMinutes={getTotalTime(recipe)}
								difficulty={difficultyMap[recipe.difficulty] || 'beginner'}
								xpReward={recipe.xpReward ?? calculateXpRewardFallback(recipe)}
								rating={4.5} // TODO: Add rating field to Recipe type when backend supports it
								cookCount={recipe.cookCount ?? 0}
								skillTags={recipe.skillTags}
								badges={recipe.rewardBadges}
								author={{
									id: recipe.author?.userId || 'unknown',
									name: recipe.author?.displayName || 'Unknown Chef',
									avatarUrl:
										recipe.author?.avatarUrl || 'https://i.pravatar.cc/40',
									isVerified: false, // TODO: Add isVerified to author when backend supports it
								}}
								isSaved={savedRecipes.has(recipe.id)}
								onCook={() => handleCook(recipe.id)}
								onSave={() => handleSave(recipe.id)}
							/>
						))}
					</StaggerContainer>
				)}
			</PageContainer>
		</PageTransition>
	)
}
