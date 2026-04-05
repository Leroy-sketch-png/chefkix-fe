'use client'

import { useEffect, useState, useRef, useCallback, useMemo, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Recipe, getRecipeImage, getTotalTime } from '@/lib/types/recipe'
import {
	getAllRecipes,
	getTrendingRecipes,
	toggleSaveRecipe,
} from '@/services/recipe'
import {
	unifiedSearch,
	autocompleteSearch,
	getTrendingSearches,
} from '@/services/search'
import type { RecipeSearchDoc } from '@/lib/types/search'
import { trackEvent } from '@/lib/eventTracker'
import { useAuthGate } from '@/hooks/useAuthGate'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { RecipeCardEnhanced } from '@/components/recipe'
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { TonightsPick } from '@/components/dashboard/TonightsPick'
import { SeasonsBest } from '@/components/explore/SeasonsBest'
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
import { StaggerContainer, staggerItemVariants } from '@/components/ui/stagger-animation'
import { triggerSaveConfetti } from '@/lib/confetti'
import { toast } from 'sonner'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import type { Difficulty } from '@/lib/types/gamification'
import Image from 'next/image'
import { logDevError } from '@/lib/dev-log'
import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator'
import { useTranslations } from '@/i18n/hooks'

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
	foolproofOnly: boolean
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Map a Typesense RecipeSearchDoc hit to a minimal Recipe shape for cards. */
function mapRecipeDocToRecipe(doc: RecipeSearchDoc): Recipe {
	return {
		id: doc.id,
		title: doc.title,
		description: doc.description,
		coverImageUrl: doc.coverImageUrl ? [doc.coverImageUrl] : [],
		videoUrl: [],
		difficulty: (doc.difficulty as Recipe['difficulty']) || 'Beginner',
		prepTimeMinutes: 0,
		cookTimeMinutes: 0,
		totalTimeMinutes: doc.totalTime ?? 0,
		servings: 0,
		cuisineType: doc.cuisine || '',
		dietaryTags: doc.tags ?? [],
		fullIngredientList: (doc.ingredients ?? []).map(name => ({
			name,
			quantity: '',
			unit: '',
		})),
		steps: [],
		xpReward: doc.xpReward ?? 0,
		difficultyMultiplier: 1,
		rewardBadges: [],
		skillTags: [],
		likeCount: 0,
		saveCount: 0,
		viewCount: 0,
		cookCount: doc.cookCount ?? 0,
		averageRating: doc.avgRating ?? 0,
		author: {
			userId: doc.authorId,
			username: doc.authorName ?? '',
			displayName: doc.authorName ?? 'Unknown Chef',
			avatarUrl: undefined,
		},
		recipeStatus: 'PUBLISHED',
		createdAt: doc.createdAt
			? new Date(doc.createdAt * 1000).toISOString()
			: '',
		updatedAt: '',
		isLiked: false,
		isSaved: false,
	} as Recipe
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
	const [isNavigating, startNavigationTransition] = useTransition()
	const [isCookNavigating, startCookTransition] = useTransition()

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
			transition={TRANSITION_SPRING}
			className='relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand/10 via-bg-card to-streak/10 shadow-warm'
		>
			<div className='grid gap-6 p-6 md:grid-cols-2 md:p-8'>
				{/* Left: Image */}
				<div className='relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg md:aspect-auto md:h-full md:min-h-[300px]'>
					<Image
						src={getRecipeImage(recipe)}
						alt={recipe.title}
						fill
						className='object-cover'
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
							className='tabular-nums bg-gradient-xp px-3 py-1 text-sm font-bold text-white shadow-card'
						>
							+{recipe.xpReward || 0} XP
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

					<h2 className='mb-3 text-2xl font-serif font-bold text-text md:text-3xl'>
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
									src={recipe.author.avatarUrl || '/placeholder-avatar.svg'}
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
							onClick={() => startCookTransition(() => onCook(recipe.id))}
							disabled={isCookNavigating}
							whileHover={isCookNavigating ? undefined : BUTTON_HOVER}
							whileTap={isCookNavigating ? undefined : BUTTON_TAP}
							className='flex items-center gap-2 rounded-xl bg-gradient-hero px-6 py-3 font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-70 disabled:cursor-not-allowed'
						>
							{isCookNavigating ? (
								<Loader2 className='size-5 animate-spin' />
							) : (
								<ChefHat className='size-5' />
							)}
							{isCookNavigating ? 'Starting...' : 'Start Cooking'}
						</motion.button>
						<motion.button
							onClick={() => startNavigationTransition(() => {
								router.push(`/recipes/${recipe.id}`)
							})}
							disabled={isNavigating}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='rounded-xl border-2 border-border-medium bg-bg-card px-6 py-3 font-semibold text-text hover:border-brand hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{isNavigating ? (
								<>
									<Loader2 className='inline size-5 animate-spin mr-2' />
									Loading...
								</>
							) : (
								'View Recipe'
							)}
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
	if (filters.foolproofOnly) {
		activeFilters.push({
			type: 'foolproofOnly',
			value: 'true',
			label: 'First-Timer Friendly',
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
			<span className='text-sm font-medium tabular-nums text-text-secondary'>
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
					whileTap={BUTTON_TAP}
					onClick={() => onRemove(filter.type, filter.value)}
					className='group flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/20'
				>
					{filter.label}
					<X className='size-3.5 transition-transform group-hover:scale-110' />
				</motion.button>
			))}

			{/* Clear all button */}
			{activeFilters.length > 1 && (
				<motion.button
					onClick={onClearAll}
					whileTap={BUTTON_TAP}
					className='text-sm font-medium text-text-muted transition-colors hover:text-text'
				>
					Clear all
				</motion.button>
			)}
		</motion.div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ExplorePage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const requireAuth = useAuthGate()
	const initialQuery = searchParams.get('q') || ''
	const searchInputRef = useRef<HTMLInputElement>(null)
	const loadMoreRef = useRef<HTMLDivElement>(null)
	const [isNavigating, startNavigationTransition] = useTransition()
	const t = useTranslations('explore')

	// Onboarding hints
	useOnboardingOrchestrator({ delay: 1000 })

	// State
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [featuredRecipe, setFeaturedRecipe] = useState<Recipe | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSearching, setIsSearching] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [loadMoreError, setLoadMoreError] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState(initialQuery)
	const [debouncedSearch, setDebouncedSearch] = useState(initialQuery)
	const [viewMode, setViewMode] = useState<'all' | 'trending'>('all')
	const [sortBy, setSortBy] = useState<string>('newest')
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
		foolproofOnly: false,
	})
	const [focusedCardIndex, setFocusedCardIndex] = useState(-1)
	const [retryCount, setRetryCount] = useState(0)

	// Autocomplete & trending state
	const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
		string[]
	>([])
	const [showAutocomplete, setShowAutocomplete] = useState(false)
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
	const [trendingSearches, setTrendingSearches] = useState<string[]>([])
	const autocompleteRef = useRef<HTMLDivElement>(null)

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
				startNavigationTransition(() => {
					router.push(`/recipes/${recipes[focusedCardIndex].id}`)
				})
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

	// Autocomplete: faster debounce (150ms) — fires suggestions while user types
	useEffect(() => {
		if (!searchQuery.trim() || searchQuery.trim().length < 2) {
			setAutocompleteSuggestions([])
			setShowAutocomplete(false)
			return
		}

		const timeout = setTimeout(async () => {
			try {
				const res = await autocompleteSearch(searchQuery.trim(), 'recipes', 5)
				if (res.success && res.data?.recipes?.hits) {
					const titles = res.data.recipes.hits
						.map(h => h.document.title)
						.filter(Boolean)
					setAutocompleteSuggestions(titles)
					setShowAutocomplete(titles.length > 0)
					setSelectedSuggestionIndex(-1)
				} else {
					setAutocompleteSuggestions([])
					setShowAutocomplete(false)
				}
			} catch {
				setAutocompleteSuggestions([])
				setShowAutocomplete(false)
			}
		}, 150)

		return () => clearTimeout(timeout)
	}, [searchQuery])

	// Fetch trending searches from API on mount (with hardcoded fallback)
	useEffect(() => {
		let cancelled = false
		const fetchTrending = async () => {
			try {
				const res = await getTrendingSearches(8)
				if (!cancelled && res.success && res.data && res.data.length > 0) {
					setTrendingSearches(res.data)
				}
			} catch {
				// fallback stays as default
			}
		}
		fetchTrending()
		return () => {
			cancelled = true
		}
	}, [])

	// Fetch recipes - initial load or when filters/search/mode change
	useEffect(() => {
		let cancelled = false
		const fetchRecipes = async () => {
			// Reset to page 1 when filters/search/mode change
			setPage(1)
			setIsLoading(true)
			setError(null)

			try {
				// ── Typesense path: typo-tolerant search when user types a query ──
				if (debouncedSearch) {
					const searchRes = await unifiedSearch(
						debouncedSearch,
						'recipes',
						RECIPES_PER_PAGE,
					)
					if (cancelled) return
					if (searchRes.success && searchRes.data?.recipes?.hits) {
						const allRecipes = searchRes.data.recipes.hits.map(h =>
							mapRecipeDocToRecipe(h.document),
						)
						setFeaturedRecipe(null)
						setSavedRecipes(new Set<string>())
						setRecipes(allRecipes)
						setTotalCount(searchRes.data.recipes.found ?? allRecipes.length)
						setHasMore(false) // Typesense returns all matches in one page
					} else {
						setRecipes([])
						setTotalCount(0)
						setHasMore(false)
					}
				} else {
					// ── MongoDB path: browse / filter / trending (no search query) ──
					const filterParams: Record<string, unknown> = {
						page: 0,
						size: RECIPES_PER_PAGE,
					}

					if (filters.difficulty.length > 0) {
						const apiDifficulty = filters.difficulty
							.map(d => DIFFICULTY_DISPLAY[d.toLowerCase()] || d)
							.find(Boolean)
						if (apiDifficulty) filterParams.difficulty = apiDifficulty
					}
					if (filters.cuisine.length > 0) {
						filterParams.cuisineType = filters.cuisine[0]
					}
					if (filters.dietary.length > 0) {
						filterParams.dietaryTags = filters.dietary
					}
					if (filters.cookingTimeMax < 120) {
						filterParams.maxTime = filters.cookingTimeMax
					}
					if (filters.foolproofOnly) {
						filterParams.qualityTier = 'Foolproof'
					}
					if (sortBy && viewMode !== 'trending') {
						filterParams.sortBy = sortBy
					}

					const response =
						viewMode === 'trending'
							? await getTrendingRecipes({
									page: 0,
									size: RECIPES_PER_PAGE,
								})
							: await getAllRecipes(filterParams)

					if (cancelled) return
					if (response.success && response.data) {
						let allRecipes = response.data

						if (allRecipes.length > 0 && viewMode === 'trending') {
							setFeaturedRecipe(allRecipes[0])
							allRecipes = allRecipes.slice(1)
						} else {
							setFeaturedRecipe(null)
						}

						const saved = new Set<string>()
						response.data.forEach(recipe => {
							if (recipe.isSaved) saved.add(recipe.id)
						})
						setSavedRecipes(saved)

						setRecipes(allRecipes)
						const pagination = response.pagination
						if (pagination) {
							setTotalCount(pagination.totalElements)
							setHasMore(!pagination.last)
						} else {
							setTotalCount(response.data.length)
							setHasMore(response.data.length >= RECIPES_PER_PAGE)
						}
					}
				}
			} catch (err) {
				if (!cancelled) setError('Failed to load recipes')
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchRecipes()
		return () => {
			cancelled = true
		}
	}, [debouncedSearch, viewMode, filters, retryCount, sortBy])

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

	// Load more handler for infinite scroll
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setLoadMoreError(false)
		setIsLoadingMore(true)
		const nextPage = page // page state is already 1-based, backend expects 0-based

		try {
			// Build same server-side filter params as fetchRecipes
			const filterParams: Record<string, unknown> = {
				page: nextPage,
				size: RECIPES_PER_PAGE,
				search: debouncedSearch || undefined,
			}

			if (filters.difficulty.length > 0) {
				const apiDifficulty = filters.difficulty
					.map(d => DIFFICULTY_DISPLAY[d.toLowerCase()] || d)
					.find(Boolean)
				if (apiDifficulty) filterParams.difficulty = apiDifficulty
			}
			if (filters.cuisine.length > 0) {
				filterParams.cuisineType = filters.cuisine[0]
			}
			if (filters.dietary.length > 0) {
				filterParams.dietaryTags = filters.dietary
			}
			if (filters.cookingTimeMax < 120) {
				filterParams.maxTime = filters.cookingTimeMax
			}
			if (filters.foolproofOnly) {
				filterParams.qualityTier = 'Foolproof'
			}
			if (sortBy && viewMode !== 'trending') {
				filterParams.sortBy = sortBy
			}

			const response =
				viewMode === 'trending'
					? await getTrendingRecipes({
							page: nextPage,
							size: RECIPES_PER_PAGE,
						})
					: await getAllRecipes(filterParams)

			if (response.success && response.data) {
				const newRecipes = response.data

				// Update saved recipes set
				response.data.forEach(recipe => {
					if (recipe.isSaved) {
						setSavedRecipes(prev => new Set([...prev, recipe.id]))
					}
				})

				// Append to existing recipes (already filtered server-side)
				setRecipes(prev => {
					const existingIds = new Set(prev.map(r => r.id))
					const dedupedRecipes = newRecipes.filter(r => !existingIds.has(r.id))
					return [...prev, ...dedupedRecipes]
				})
				setPage(nextPage + 1)

				// Update pagination state
				const pagination = response.pagination
				if (pagination) {
					setTotalCount(pagination.totalElements)
					setHasMore(!pagination.last)
				} else {
					setHasMore(response.data.length >= RECIPES_PER_PAGE)
				}
			}
		} catch (err) {
			logDevError('Failed to load more recipes:', err)
			setLoadMoreError(true)
		} finally {
			setIsLoadingMore(false)
		}
	}, [isLoadingMore, hasMore, page, viewMode, debouncedSearch, filters, sortBy])

	// Infinite scroll - IntersectionObserver
	useEffect(() => {
		if (!loadMoreRef.current || isLoading) return

		const observer = new IntersectionObserver(
			entries => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					handleLoadMore()
				}
			},
			{ threshold: 0.1, rootMargin: '100px' },
		)

		observer.observe(loadMoreRef.current)
		return () => observer.disconnect()
	}, [hasMore, isLoadingMore, isLoading, handleLoadMore])

	// ============================================
	// HANDLERS
	// ============================================

	const handleCook = (recipeId: string) => {
		if (!requireAuth('start cooking')) return
		sessionStorage.setItem(SCROLL_RESTORATION_KEY, String(window.scrollY))
		router.push(`/recipes/${recipeId}?cook=true`)
	}

	const handleSave = async (recipeId: string) => {
		if (!requireAuth('save this recipe')) return
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
				// Reconcile with server's authoritative state
				setSavedRecipes(prev => {
					const newSet = new Set(prev)
					if (response.data.isSaved) {
						newSet.add(recipeId)
					} else {
						newSet.delete(recipeId)
					}
					return newSet
				})
				trackEvent(
					response.data.isSaved ? 'RECIPE_SAVED' : 'RECIPE_UNSAVED',
					recipeId,
					'recipe',
				)
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
			} else if (type === 'foolproofOnly') {
				updated.foolproofOnly = false
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
			foolproofOnly: false,
		})
		setSearchQuery('')
		setPage(1)
	}

	const handleSearchKeyDown = (e: React.KeyboardEvent) => {
		// Autocomplete navigation
		if (showAutocomplete && autocompleteSuggestions.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setSelectedSuggestionIndex(prev =>
					prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0,
				)
				return
			}
			if (e.key === 'ArrowUp') {
				e.preventDefault()
				setSelectedSuggestionIndex(prev =>
					prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1,
				)
				return
			}
			if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
				e.preventDefault()
				const selected = autocompleteSuggestions[selectedSuggestionIndex]
				setSearchQuery(selected)
				setDebouncedSearch(selected)
				setShowAutocomplete(false)
				return
			}
			if (e.key === 'Escape') {
				setShowAutocomplete(false)
				return
			}
		}

		if (e.key === 'Enter' && searchQuery.trim()) {
			setShowAutocomplete(false)
			startNavigationTransition(() => {
				router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
			})
		}
	}

	const handleClearSearch = () => {
		setSearchQuery('')
		setDebouncedSearch('')
		setShowAutocomplete(false)
		searchInputRef.current?.focus()
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
			(filters.rating !== null ? 1 : 0) +
			(filters.foolproofOnly ? 1 : 0),
		[filters],
	)

	// ============================================
	// RENDER
	// ============================================

	return (
		<PageTransition>
			{/* Global navigation loading indicator */}
			<AnimatePresence>
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed top-20 left-1/2 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
							Loading...
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageContainer maxWidth='xl'>
				{/* Header */}
				<PageHeader
					icon={Compass}
					title={t('title')}
					subtitle={t('subtitle')}
					gradient='warm'
				/>

				{/* Hero/Featured Recipe (only when not searching) */}
				<AnimatePresence mode='wait'>
					{!isLoading && featuredRecipe && !debouncedSearch && (
						<HeroRecipe recipe={featuredRecipe} onCook={handleCook} />
					)}
				</AnimatePresence>

				{/* Tonight's Pick — Personalized recommendation (only when not searching) */}
				{!debouncedSearch && (
					<TonightsPick className='mb-6' />
				)}

				{/* Season's Best — Curated featured collections (only when not searching) */}
				{!debouncedSearch && <SeasonsBest className='mb-6' />}

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
							placeholder={t('searchPlaceholder')}
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							onKeyDown={handleSearchKeyDown}
							onFocus={() => {
								if (autocompleteSuggestions.length > 0)
									setShowAutocomplete(true)
							}}
							onBlur={() => {
								// Delay to allow dropdown clicks to register
								setTimeout(() => setShowAutocomplete(false), 200)
							}}
							className='h-12 rounded-2xl border-border-medium bg-bg-card pl-12 pr-20 text-text shadow-card transition-colors focus:border-brand focus:shadow-card focus:ring-2 focus:ring-brand/20'
						/>
						{/* Loading indicator or clear button */}
						<div className='absolute right-12 top-1/2 -translate-y-1/2'>
							{isSearching ? (
								<Loader2 className='size-5 animate-spin text-brand' />
							) : searchQuery ? (
								<motion.button
									onClick={handleClearSearch}
									whileTap={BUTTON_TAP}
									className='rounded-full p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
									aria-label='Clear search'
								>
									<X className='size-4' />
								</motion.button>
							) : null}
						</div>
						{/* Keyboard shortcut hint */}
						<kbd className='absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-border-medium bg-bg-elevated px-2 py-1 text-xs text-text-muted sm:block'>
							/
						</kbd>

						{/* Autocomplete dropdown */}
						<AnimatePresence>
							{showAutocomplete && autocompleteSuggestions.length > 0 && (
								<motion.div
									ref={autocompleteRef}
									initial={{ opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									transition={{ duration: 0.15 }}
									className='absolute left-0 right-0 top-full z-dropdown mt-1 overflow-hidden rounded-xl border border-border-medium bg-bg-card shadow-warm'
								>
									{autocompleteSuggestions.map((suggestion, index) => (
										<button
											type='button'
											key={suggestion}
											onMouseDown={e => {
												e.preventDefault()
												setSearchQuery(suggestion)
												setDebouncedSearch(suggestion)
												setShowAutocomplete(false)
											}}
											className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
												index === selectedSuggestionIndex
													? 'bg-brand/10 text-brand'
													: 'text-text hover:bg-bg-elevated'
											}`}
										>
											<Search className='size-4 flex-shrink-0 text-text-muted' />
											<span className='truncate'>{suggestion}</span>
										</button>
									))}
								</motion.div>
							)}
						</AnimatePresence>
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
							className={`rounded-xl px-5 py-3 text-sm font-semibold  ${
								viewMode === 'all'
									? 'bg-gradient-hero text-white shadow-card shadow-brand/30'
									: 'border-2 border-border-medium bg-bg-card text-text-secondary hover:border-brand hover:text-brand'
							}`}
						>
							{t('allRecipes')}
						</motion.button>
						<motion.button
							onClick={() => {
								setViewMode('trending')
								setPage(1)
							}}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold  ${
								viewMode === 'trending'
									? 'bg-gradient-xp text-white shadow-card shadow-xp/30'
									: 'border-2 border-border-medium bg-bg-card text-text-secondary hover:border-xp hover:text-xp'
							}`}
						>
							<TrendingUp className='size-4' />
							{t('trending')}
						</motion.button>

						{/* Sort Dropdown */}
						{viewMode === 'all' && (
							<div className='relative'>
								<select
									value={sortBy}
									onChange={e => {
										setSortBy(e.target.value)
										setPage(1)
									}}
									className='h-12 appearance-none rounded-xl border-2 border-border-medium bg-bg-card py-3 pl-4 pr-10 text-sm font-semibold text-text-secondary transition-colors hover:border-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
								>
									<option value='newest'>{t('newest')}</option>
									<option value='popular'>{t('mostCooked')}</option>
									<option value='rating'>{t('topRated')}</option>
									<option value='quickest'>{t('quickest')}</option>
								</select>
								<ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
							</div>
						)}
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

				{/* Trending Searches — show when no search is active */}
				{!debouncedSearch && !isLoading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className='mb-6'
					>
						<div className='mb-2 flex items-center gap-2 text-sm font-medium text-text-secondary'>
							<TrendingUp className='size-4 text-brand' />
							{t('trendingSearches')}
						</div>
						<div className='flex flex-wrap gap-2'>
							{(trendingSearches.length > 0
								? trendingSearches
								: [
										'Quick meals',
										'Pasta',
										'Chicken',
										'Vegan',
										'Desserts',
										'Stir fry',
										'Breakfast',
										'Baking',
									]
							).map(term => (
								<motion.button
									key={term}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									onClick={() => {
										setSearchQuery(term)
										setDebouncedSearch(term)
									}}
									className='rounded-full border border-border bg-bg-card px-3 py-1.5 text-sm text-text transition-colors hover:border-brand hover:bg-brand/5 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
								>
									{term}
								</motion.button>
							))}
						</div>
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
						onRetry={() => {
							setError(null)
							setRetryCount(c => c + 1)
						}}
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
							debouncedSearch
								? trendingSearches.length > 0
									? trendingSearches.slice(0, 5)
									: [
											'Pasta',
											'Quick dinner',
											'Chicken',
											'Healthy breakfast',
											'Dessert',
										]
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
									variants={staggerItemVariants}
									className={`rounded-2xl  ${
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
										xpReward={recipe.xpReward ?? 0}
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
															'/placeholder-avatar.svg',
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

						{/* Infinite scroll sentinel */}
						<div ref={loadMoreRef} className='h-px' />

						{/* Loading indicator for infinite scroll */}
						{isLoadingMore && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className='flex justify-center py-8'
							>
								<div className='flex items-center gap-2'>
									{[0, 1, 2].map(i => (
										<motion.div key={i} className='size-2 rounded-full bg-brand'
											animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
											transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
									))}
									<span className='text-sm font-medium tabular-nums'>Loading more recipes...</span>
								</div>
							</motion.div>
						)}

						{/* Load more error with retry */}
						{loadMoreError && !isLoadingMore && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className='flex flex-col items-center gap-2 py-8'
							>
								<span className='text-sm text-text-muted'>Failed to load more recipes</span>
								<motion.button
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									onClick={handleLoadMore}
									className='rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10'
								>
									Try again
								</motion.button>
							</motion.div>
						)}

						{/* End of results indicator */}
						{!hasMore && recipes.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className='flex justify-center py-8'
							>
								<span className='tabular-nums text-sm text-text-muted'>
									✨ You&apos;ve seen all {totalCount} recipes
								</span>
							</motion.div>
						)}
					</>
				)}
			</PageContainer>
		</PageTransition>
	)
}
