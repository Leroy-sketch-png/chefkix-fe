'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
import {
	Search,
	TrendingUp,
	Compass,
	Sparkles,
	X,
	Loader2,
	ChevronDown,
	Clock,
	ChefHat,
	Flame,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { triggerSaveConfetti } from '@/lib/confetti'
import { toast } from 'sonner'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import type { Difficulty } from '@/lib/types/gamification'
import Image from 'next/image'

// ============================================
// CONSTANTS
// ============================================

const RECIPES_PER_PAGE = 12
const SEARCH_DEBOUNCE_MS = 300
const SCROLL_RESTORATION_KEY = 'explore-scroll-position'

// Difficulty display mapping
const DIFFICULTY_DISPLAY: Record<string, string> = {
	easy: 'Beginner',
	medium: 'Intermediate',
	hard: 'Advanced',
	expert: 'Expert',
}

const DIFFICULTY_API_TO_DISPLAY: Record<string, string> = {
	Beginner: 'Easy',
	Intermediate: 'Medium',
	Advanced: 'Hard',
	Expert: 'Expert',
}

// ============================================
// TYPES
// ============================================

interface RecipeFilters {
	dietary: string[]
	cuisine: string[]
	difficulty: string[]
	cookingTimeMax: number
	rating: number | null
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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

// ============================================
// HERO SECTION COMPONENT
// ============================================

interface HeroRecipeProps {
	recipe: Recipe
	onCook: (id: string) => void
}

function HeroRecipe({ recipe, onCook }: HeroRecipeProps) {
	const router = useRouter()

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={TRANSITION_SPRING}
			className='relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand/10 via-bg-card to-streak/10 shadow-warm'
		>
			<div className='grid gap-6 p-6 md:grid-cols-2 md:p-8'>
				{/* Left: Image */}
				<div className='relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg md:aspect-auto md:h-full md:min-h-[300px]'>
					<Image
						src={getRecipeImage(recipe)}
						alt={recipe.title}
						fill
						className='object-cover transition-transform duration-500 hover:scale-105'
						sizes='(max-width: 768px) 100vw, 50vw'
					/>
					{/* Featured badge */}
					<div className='absolute left-4 top-4 flex items-center gap-2 rounded-full bg-gradient-hero px-4 py-2 text-sm font-bold text-white shadow-lg'>
						<Flame className='size-4' />
						Featured Today
					</div>
				</div>

				{/* Right: Content */}
				<div className='flex flex-col justify-center'>
					<div className='mb-3 flex flex-wrap items-center gap-2'>
						{/* XP Badge */}
						<Badge
							variant='secondary'
							className='bg-gradient-xp px-3 py-1 text-sm font-bold text-white shadow-md'
						>
							+{recipe.xpReward ?? calculateXpRewardFallback(recipe)} XP
						</Badge>
						{/* Difficulty */}
						<Badge
							variant='outline'
							className='border-border-medium bg-bg-elevated'
						>
							{DIFFICULTY_API_TO_DISPLAY[recipe.difficulty] ||
								recipe.difficulty}
						</Badge>
						{/* Time */}
						<Badge
							variant='outline'
							className='flex items-center gap-1 border-border-medium bg-bg-elevated'
						>
							<Clock className='size-3' />
							{getTotalTime(recipe)} min
						</Badge>
					</div>

					<h2 className='mb-3 text-2xl font-bold text-text md:text-3xl'>
						{recipe.title}
					</h2>

					<p className='mb-6 line-clamp-3 text-text-secondary'>
						{recipe.description}
					</p>

					{/* Author */}
					{recipe.author?.displayName &&
						recipe.author.displayName !== 'Unknown Chef' && (
							<div className='mb-6 flex items-center gap-3'>
								<Image
									src={
										recipe.author.avatarUrl || '/images/avatar-placeholder.png'
									}
									alt={recipe.author.displayName}
									width={40}
									height={40}
									className='rounded-full border-2 border-border-subtle object-cover'
								/>
								<div>
									<p className='text-sm font-medium text-text'>
										{recipe.author.displayName}
									</p>
									<p className='text-xs text-text-muted'>
										{recipe.cookCount ?? 0} people cooked this
									</p>
								</div>
							</div>
						)}

					{/* Actions */}
					<div className='flex gap-3'>
						<motion.button
							onClick={() => onCook(recipe.id)}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='flex items-center gap-2 rounded-xl bg-gradient-hero px-6 py-3 font-bold text-white shadow-lg shadow-brand/30 transition-all'
						>
							<ChefHat className='size-5' />
							Start Cooking
						</motion.button>
						<motion.button
							onClick={() => router.push(`/recipes/${recipe.id}`)}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='rounded-xl border-2 border-border-medium bg-bg-card px-6 py-3 font-semibold text-text transition-all hover:border-brand hover:text-brand'
						>
							View Recipe
						</motion.button>
					</div>
				</div>
			</div>
		</motion.div>
	)
}

// ============================================
// FILTER CHIPS COMPONENT
// ============================================

interface FilterChipsProps {
	filters: RecipeFilters
	onRemove: (type: keyof RecipeFilters, value?: string) => void
	onClearAll: () => void
	resultCount: number
	searchQuery: string
}

function FilterChips({
	filters,
	onRemove,
	onClearAll,
	resultCount,
	searchQuery,
}: FilterChipsProps) {
	const activeFilters: Array<{
		type: keyof RecipeFilters
		value: string
		label: string
	}> = []

	// Collect all active filters
	filters.dietary.forEach(d =>
		activeFilters.push({ type: 'dietary', value: d, label: d }),
	)
	filters.cuisine.forEach(c =>
		activeFilters.push({ type: 'cuisine', value: c, label: c }),
	)
	filters.difficulty.forEach(d =>
		activeFilters.push({
			type: 'difficulty',
			value: d,
			label:
				DIFFICULTY_API_TO_DISPLAY[DIFFICULTY_DISPLAY[d.toLowerCase()] ?? d] ||
				d,
		}),
	)
	if (filters.cookingTimeMax < 120) {
		activeFilters.push({
			type: 'cookingTimeMax',
			value: String(filters.cookingTimeMax),
			label: `Under ${filters.cookingTimeMax} min`,
		})
	}
	if (filters.rating !== null) {
		activeFilters.push({
			type: 'rating',
			value: String(filters.rating),
			label: `${filters.rating}+ stars`,
		})
	}

	const hasActiveFilters = activeFilters.length > 0 || searchQuery

	if (!hasActiveFilters) return null

	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			exit={{ opacity: 0, height: 0 }}
			className='mb-6 flex flex-wrap items-center gap-2'
		>
			{/* Result count */}
			<span className='text-sm font-medium text-text-secondary'>
				{resultCount === 0
					? 'No results'
					: `${resultCount} recipe${resultCount === 1 ? '' : 's'}`}
				{searchQuery && (
					<span className='text-text-muted'>
						{' '}
						for &quot;{searchQuery}&quot;
					</span>
				)}
			</span>

			{/* Active filter chips */}
			{activeFilters.map(filter => (
				<motion.button
					key={`${filter.type}-${filter.value}`}
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.8, opacity: 0 }}
					onClick={() => onRemove(filter.type, filter.value)}
					className='group flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand transition-all hover:bg-brand/20'
				>
					{filter.label}
					<X className='size-3.5 transition-transform group-hover:scale-110' />
				</motion.button>
			))}

			{/* Clear all button */}
			{activeFilters.length > 1 && (
				<button
					onClick={onClearAll}
					className='text-sm font-medium text-text-muted transition-colors hover:text-text'
				>
					Clear all
				</button>
			)}
		</motion.div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ExplorePage() {
	const router = useRouter()
	const searchInputRef = useRef<HTMLInputElement>(null)

	// State
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [featuredRecipe, setFeaturedRecipe] = useState<Recipe | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSearching, setIsSearching] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [viewMode, setViewMode] = useState<'all' | 'trending'>('all')
	const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set())
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)
	const [totalCount, setTotalCount] = useState(0)
	const [filters, setFilters] = useState<RecipeFilters>({
		dietary: [],
		cuisine: [],
		difficulty: [],
		cookingTimeMax: 120,
		rating: null,
	})
	const [focusedCardIndex, setFocusedCardIndex] = useState(-1)

	// ============================================
	// EFFECTS
	// ============================================

	// Arrow key navigation helper
	const handleArrowNavigation = useCallback(
		(key: string) => {
			const cols =
				typeof window !== 'undefined' && window.innerWidth >= 1024
					? 3
					: typeof window !== 'undefined' && window.innerWidth >= 640
						? 2
						: 1
			const total = recipes.length

			setFocusedCardIndex(current => {
				let next = current
				switch (key) {
					case 'ArrowRight':
						next = current + 1
						break
					case 'ArrowLeft':
						next = current - 1
						break
					case 'ArrowDown':
						next = current + cols
						break
					case 'ArrowUp':
						next = current - cols
						break
				}
				// Start from 0 if nothing selected
				if (current === -1) return 0
				// Keep in bounds
				if (next < 0) return 0
				if (next >= total) return total - 1
				return next
			})
		},
		[recipes.length],
	)

	// Keyboard shortcut: / or Cmd+K to focus search
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if user is typing in another input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return
			}

			// "/" key or Cmd/Ctrl + K
			if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
				e.preventDefault()
				searchInputRef.current?.focus()
			}

			// Arrow key navigation for recipe grid
			if (
				recipes.length > 0 &&
				(e.key === 'ArrowDown' ||
					e.key === 'ArrowUp' ||
					e.key === 'ArrowLeft' ||
					e.key === 'ArrowRight')
			) {
				e.preventDefault()
				handleArrowNavigation(e.key)
			}

			// Enter to select focused card
			if (
				e.key === 'Enter' &&
				focusedCardIndex >= 0 &&
				focusedCardIndex < recipes.length
			) {
				e.preventDefault()
				router.push(`/recipes/${recipes[focusedCardIndex].id}`)
			}

			// Escape to unfocus
			if (e.key === 'Escape') {
				setFocusedCardIndex(-1)
				;(document.activeElement as HTMLElement)?.blur()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [recipes, focusedCardIndex, router, handleArrowNavigation])

	// Search debounce
	useEffect(() => {
		setIsSearching(searchQuery !== debouncedSearch)
		const timeout = setTimeout(() => {
			setDebouncedSearch(searchQuery)
			setIsSearching(false)
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(timeout)
	}, [searchQuery, debouncedSearch])

	// Fetch recipes
	useEffect(() => {
		const fetchRecipes = async () => {
			// Only show full loading on initial load or view mode change
			if (page === 1) {
				setIsLoading(true)
			}
			setError(null)

			try {
				const response =
					viewMode === 'trending'
						? await getTrendingRecipes({ limit: RECIPES_PER_PAGE * page })
						: await getAllRecipes({
								limit: RECIPES_PER_PAGE * page,
								search: debouncedSearch || undefined,
							})

				if (response.success && response.data) {
					let allRecipes = response.data

					// Set featured recipe (first trending or random from first page)
					if (page === 1 && allRecipes.length > 0 && !debouncedSearch) {
						if (viewMode === 'trending') {
							setFeaturedRecipe(allRecipes[0])
							allRecipes = allRecipes.slice(1)
						} else {
							// Pick a random featured from first batch
							const featuredIdx = Math.floor(
								Math.random() * Math.min(5, allRecipes.length),
							)
							setFeaturedRecipe(allRecipes[featuredIdx])
							allRecipes = allRecipes.filter((_, i) => i !== featuredIdx)
						}
					} else if (debouncedSearch) {
						setFeaturedRecipe(null)
					}

					// Initialize saved recipes set
					const saved = new Set<string>()
					response.data.forEach(recipe => {
						if (recipe.isSaved) saved.add(recipe.id)
					})
					setSavedRecipes(saved)

					// Apply client-side filters
					let filtered = allRecipes

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
						const apiDifficulties = filters.difficulty.map(
							d => DIFFICULTY_DISPLAY[d.toLowerCase()] || d,
						)
						filtered = filtered.filter(recipe =>
							apiDifficulties.includes(recipe.difficulty),
						)
					}

					// Filter by cooking time
					filtered = filtered.filter(
						recipe => getTotalTime(recipe) <= filters.cookingTimeMax,
					)

					setRecipes(filtered)
					setTotalCount(filtered.length)
					setHasMore(response.data.length === RECIPES_PER_PAGE * page)
				}
			} catch (err) {
				setError('Failed to load recipes')
			} finally {
				setIsLoading(false)
				setIsLoadingMore(false)
			}
		}

		fetchRecipes()
	}, [debouncedSearch, viewMode, filters, page])

	// Scroll restoration
	useEffect(() => {
		const savedPosition = sessionStorage.getItem(SCROLL_RESTORATION_KEY)
		if (savedPosition && !isLoading) {
			setTimeout(() => {
				window.scrollTo(0, parseInt(savedPosition, 10))
				sessionStorage.removeItem(SCROLL_RESTORATION_KEY)
			}, 100)
		}

		const handleBeforeUnload = () => {
			sessionStorage.setItem(SCROLL_RESTORATION_KEY, String(window.scrollY))
		}

		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [isLoading])

	// ============================================
	// HANDLERS
	// ============================================

	const handleCook = (recipeId: string) => {
		sessionStorage.setItem(SCROLL_RESTORATION_KEY, String(window.scrollY))
		router.push(`/recipes/${recipeId}?cook=true`)
	}

	const handleSave = async (recipeId: string) => {
		const wasSaved = savedRecipes.has(recipeId)
		const willBeSaved = !wasSaved

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

		// Trigger confetti optimistically on save (not unsave)
		// No element ref available from callback, uses center-viewport
		if (willBeSaved) {
			triggerSaveConfetti()
		}

		try {
			const response = await toggleSaveRecipe(recipeId)
			if (response.success && response.data) {
				if (response.data.isSaved) {
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
		setPage(1)
	}

	const handleFilterRemove = (type: keyof RecipeFilters, value?: string) => {
		setFilters(prev => {
			const updated = { ...prev }
			if (type === 'dietary' && value) {
				updated.dietary = prev.dietary.filter(d => d !== value)
			} else if (type === 'cuisine' && value) {
				updated.cuisine = prev.cuisine.filter(c => c !== value)
			} else if (type === 'difficulty' && value) {
				updated.difficulty = prev.difficulty.filter(d => d !== value)
			} else if (type === 'cookingTimeMax') {
				updated.cookingTimeMax = 120
			} else if (type === 'rating') {
				updated.rating = null
			}
			return updated
		})
		setPage(1)
	}

	const handleClearAllFilters = () => {
		setFilters({
			dietary: [],
			cuisine: [],
			difficulty: [],
			cookingTimeMax: 120,
			rating: null,
		})
		setSearchQuery('')
		setPage(1)
	}

	const handleSearchKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			// Immediately trigger search (bypass debounce)
			setDebouncedSearch(searchQuery)
			setIsSearching(false)
		}
	}

	const handleClearSearch = () => {
		setSearchQuery('')
		setDebouncedSearch('')
		searchInputRef.current?.focus()
	}

	const handleLoadMore = () => {
		setIsLoadingMore(true)
		setPage(p => p + 1)
	}

	// ============================================
	// COMPUTED VALUES
	// ============================================

	const activeFiltersCount = useMemo(
		() =>
			filters.dietary.length +
			filters.cuisine.length +
			filters.difficulty.length +
			(filters.cookingTimeMax < 120 ? 1 : 0) +
			(filters.rating !== null ? 1 : 0),
		[filters],
	)

	// ============================================
	// RENDER
	// ============================================

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

				{/* Hero/Featured Recipe (only when not searching) */}
				<AnimatePresence mode='wait'>
					{!isLoading && featuredRecipe && !debouncedSearch && (
						<HeroRecipe recipe={featuredRecipe} onCook={handleCook} />
					)}
				</AnimatePresence>

				{/* Search & Filter Bar */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, ...TRANSITION_SPRING }}
					className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center'
				>
					<div className='group relative flex-1'>
						<Search className='absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand' />
						<Input
							ref={searchInputRef}
							placeholder='Search recipes...'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							onKeyDown={handleSearchKeyDown}
							className='h-12 rounded-2xl border-border-medium bg-bg-card pl-12 pr-20 text-text shadow-sm transition-all focus:border-brand focus:shadow-md focus:ring-2 focus:ring-brand/20'
						/>
						{/* Loading indicator or clear button */}
						<div className='absolute right-12 top-1/2 -translate-y-1/2'>
							{isSearching ? (
								<Loader2 className='size-5 animate-spin text-brand' />
							) : searchQuery ? (
								<button
									onClick={handleClearSearch}
									className='rounded-full p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
									aria-label='Clear search'
								>
									<X className='size-4' />
								</button>
							) : null}
						</div>
						{/* Keyboard shortcut hint */}
						<kbd className='absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-border-medium bg-bg-elevated px-2 py-1 text-xs text-text-muted sm:block'>
							/
						</kbd>
					</div>
					<div className='flex gap-2'>
						{/* Filter Sheet Button */}
						<RecipeFiltersSheet
							initialFilters={filters}
							onApply={handleFiltersApply}
						/>

						{/* View Mode Buttons */}
						<motion.button
							onClick={() => {
								setViewMode('all')
								setPage(1)
							}}
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
							onClick={() => {
								setViewMode('trending')
								setPage(1)
							}}
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

				{/* Filter Chips & Result Count */}
				<AnimatePresence>
					{(activeFiltersCount > 0 || debouncedSearch) && !isLoading && (
						<FilterChips
							filters={filters}
							onRemove={handleFilterRemove}
							onClearAll={handleClearAllFilters}
							resultCount={totalCount}
							searchQuery={debouncedSearch}
						/>
					)}
				</AnimatePresence>

				{/* Keyboard navigation hint */}
				{focusedCardIndex >= 0 && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className='mb-4 flex items-center gap-2 text-sm text-text-muted'
					>
						<kbd className='rounded border border-border-medium bg-bg-elevated px-1.5 py-0.5'>
							↑↓←→
						</kbd>
						<span>Navigate</span>
						<kbd className='rounded border border-border-medium bg-bg-elevated px-1.5 py-0.5'>
							Enter
						</kbd>
						<span>Open</span>
						<kbd className='rounded border border-border-medium bg-bg-elevated px-1.5 py-0.5'>
							Esc
						</kbd>
						<span>Cancel</span>
					</motion.div>
				)}

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
						title={
							activeFiltersCount > 0
								? 'No matching recipes'
								: 'No recipes found'
						}
						description={
							activeFiltersCount > 0
								? 'Try adjusting your filters to see more recipes.'
								: debouncedSearch
									? `No recipes match "${debouncedSearch}". Try a different search.`
									: 'Be the first to share a recipe!'
						}
						searchSuggestions={
							!activeFiltersCount && debouncedSearch
								? ['Pasta', 'Curry', 'Salad', 'Dessert']
								: undefined
						}
						primaryAction={
							activeFiltersCount > 0 || debouncedSearch
								? {
										label: 'Clear All',
										onClick: handleClearAllFilters,
									}
								: {
										label: 'Create Recipe',
										href: '/create',
									}
						}
					/>
				)}
				{!isLoading && !error && recipes.length > 0 && (
					<>
						<StaggerContainer className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
							{recipes.map((recipe, index) => (
								<motion.div
									key={recipe.id}
									className={`rounded-2xl transition-all ${
										focusedCardIndex === index
											? 'ring-2 ring-brand ring-offset-2 ring-offset-bg'
											: ''
									}`}
									onClick={() => {
										sessionStorage.setItem(
											SCROLL_RESTORATION_KEY,
											String(window.scrollY),
										)
									}}
								>
									<RecipeCardEnhanced
										variant='grid'
										id={recipe.id}
										title={recipe.title}
										description={recipe.description}
										imageUrl={getRecipeImage(recipe)}
										cookTimeMinutes={getTotalTime(recipe)}
										difficulty={(recipe.difficulty as Difficulty) || 'Beginner'}
										xpReward={
											recipe.xpReward ?? calculateXpRewardFallback(recipe)
										}
										rating={recipe.averageRating ?? 0}
										cookCount={recipe.cookCount ?? 0}
										skillTags={recipe.skillTags}
										badges={recipe.rewardBadges}
										author={
											recipe.author?.displayName &&
											recipe.author.displayName !== 'Unknown Chef'
												? {
														id: recipe.author.userId,
														name: recipe.author.displayName,
														avatarUrl:
															recipe.author.avatarUrl ||
															'/images/avatar-placeholder.png',
														isVerified: false,
													}
												: undefined
										}
										isSaved={recipe.isSaved ?? savedRecipes.has(recipe.id)}
										onCook={() => handleCook(recipe.id)}
										onSave={() => handleSave(recipe.id)}
									/>
								</motion.div>
							))}
						</StaggerContainer>

						{/* Load More Button */}
						{hasMore && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className='mt-8 flex justify-center'
							>
								<Button
									variant='outline'
									size='lg'
									onClick={handleLoadMore}
									disabled={isLoadingMore}
									className='gap-2 rounded-xl border-2 border-border-medium px-8 py-3 font-semibold transition-all hover:border-brand hover:text-brand'
								>
									{isLoadingMore ? (
										<>
											<Loader2 className='size-5 animate-spin' />
											Loading...
										</>
									) : (
										<>
											<ChevronDown className='size-5' />
											Load More Recipes
										</>
									)}
								</Button>
							</motion.div>
						)}
					</>
				)}
			</PageContainer>
		</PageTransition>
	)
}
