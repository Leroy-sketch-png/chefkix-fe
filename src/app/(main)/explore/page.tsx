'use client'

import {
	useEffect,
	useState,
	useRef,
	useCallback,
	useMemo,
	useTransition,
	Suspense,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Recipe,
	getRecipeImage,
	getTotalTime,
	formatCookingTime,
} from '@/lib/types/recipe'
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
import { RecipeCardEnhanced } from '@/components/recipe'
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { ExploreCommandDeck } from '@/components/explore/ExploreCommandDeck'
import { ExploreContextRail } from '@/components/explore/ExploreContextRail'
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
	Clock,
	ChefHat,
	Flame,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
	StaggerContainer,
	staggerItemVariants,
} from '@/components/ui/stagger-animation'
import { triggerSaveConfetti } from '@/lib/confetti'
import { toast } from 'sonner'
import { TRANSITION_SPRING, BUTTON_HOVER, BUTTON_TAP } from '@/lib/motion'
import type { Difficulty } from '@/lib/types/gamification'
import Image from 'next/image'
import { logDevError } from '@/lib/dev-log'
import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator'
import { GlowCard } from '@/components/ui/glow-card'
import { SparklesEffect } from '@/components/ui/sparkles-effect'
import { BlurFade } from '@/components/ui/blur-fade'
import { useTranslations } from '@/i18n/hooks'
import { TextLoop } from '@/components/ui/text-loop'
import { PostCard } from '@/components/social/PostCard'
import { getFeedPosts } from '@/services/post'
import type { Post } from '@/lib/types/post'
import { useAuth } from '@/hooks/useAuth'

// ============================================
// CONSTANTS
// ============================================

const RECIPES_PER_PAGE = 12
const SEARCH_DEBOUNCE_MS = 300
const SCROLL_RESTORATION_KEY = 'explore-scroll-position'

// Maps lowercase filter-state keys â†’ API Title Case strings (for display in filter chips)
const FILTER_STATE_TO_API_DISPLAY: Record<string, string> = {
	easy: 'Beginner',
	medium: 'Intermediate',
	hard: 'Advanced',
	expert: 'Expert',
}

// Maps API Title Case strings â†’ i18n translation keys (for hero/recipe card labels)
const DIFFICULTY_API_TO_I18N_KEY: Record<string, string> = {
	Beginner: 'diffEasy',
	Intermediate: 'diffMedium',
	Advanced: 'diffHard',
	Expert: 'diffExpert',
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
			displayName: doc.authorName ?? undefined,
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
	const t = useTranslations('explore')
	const [isNavigating, startNavigationTransition] = useTransition()
	const [isCookNavigating, startCookTransition] = useTransition()

	return (
		<GlowCard
			color='var(--color-brand)'
			radius={300}
			intensity={0.25}
			className='mb-6 rounded-2xl md:mb-8'
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
				transition={TRANSITION_SPRING}
				className='relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 shadow-warm'
			>
				<div className='grid gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-2 md:p-6'>
					{/* Left: Image */}
					<div className='relative aspect-[16/9] overflow-hidden rounded-xl shadow-card sm:aspect-[4/3] md:aspect-auto md:h-full md:min-h-[300px]'>
						<Image
							src={getRecipeImage(recipe)}
							alt={recipe.title}
							fill
							className='object-cover transition-transform duration-700 hover:scale-[1.03]'
							sizes='(max-width: 768px) 100vw, 50vw'
							onError={e => {
								;(e.target as HTMLImageElement).src = '/placeholder-recipe.svg'
							}}
						/>
						{/* Scrim top for badge readability */}
						<div className='pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent' />
						{/* Featured badge */}
						<div className='absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(255,90,54,0.5)] backdrop-blur-sm'>
							<Flame className='size-3.5' />
							{t('featuredToday')}
						</div>
					</div>

					{/* Right: Content */}
					<div className='flex flex-col justify-center'>
						<div className='mb-3 flex flex-wrap items-center gap-1.5'>
							{/* XP Badge */}
							<SparklesEffect color='var(--color-xp)' count={6}>
								<span className='inline-flex items-center gap-1 rounded-full bg-xp/15 px-2.5 py-1 text-xs font-bold text-xp'>
									âš¡ +{recipe.xpReward || 0} XP
								</span>
							</SparklesEffect>
							{/* Difficulty */}
							<span className='inline-flex items-center rounded-full bg-bg-elevated px-2.5 py-1 text-xs font-medium text-text-secondary'>
								{t(
									DIFFICULTY_API_TO_I18N_KEY[recipe.difficulty] ||
										recipe.difficulty,
								)}
							</span>
							{/* Time */}
							<span className='inline-flex items-center gap-1 rounded-full bg-bg-elevated px-2.5 py-1 text-xs font-medium text-text-secondary'>
								<Clock className='size-3' />
								{formatCookingTime(getTotalTime(recipe))}
							</span>
						</div>

						<h2 className='mb-2.5 text-xl font-bold leading-tight tracking-tight text-text-primary sm:mb-3 sm:text-2xl md:text-3xl'>
							{recipe.title}
						</h2>

						<p className='mb-4 line-clamp-2 text-sm leading-relaxed text-text-secondary sm:mb-5 sm:line-clamp-3 sm:text-[15px]'>
							{recipe.description}
						</p>

						{/* Author */}
						{recipe.author?.displayName && (
							<div className='mb-4 flex items-center gap-2.5 sm:mb-5'>
								<Image
									src={recipe.author.avatarUrl || '/placeholder-avatar.svg'}
									alt={recipe.author.displayName}
									width={36}
									height={36}
									className='size-9 rounded-full ring-2 ring-border-subtle object-cover'
								/>
								<div>
									<p className='text-sm font-semibold text-text-primary'>
										{recipe.author.displayName}
									</p>
									<p className='text-xs text-text-muted'>
										{t('heroCookCount', { count: recipe.cookCount ?? 0 })}
									</p>
								</div>
							</div>
						)}

						{/* Actions */}
						<div className='flex gap-2.5'>
							<motion.button
								type='button'
								onClick={() => startCookTransition(() => onCook(recipe.id))}
								disabled={isCookNavigating}
								whileHover={isCookNavigating ? undefined : BUTTON_HOVER}
								whileTap={isCookNavigating ? undefined : BUTTON_TAP}
								className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(255,90,54,0.4)] transition-all disabled:cursor-not-allowed disabled:opacity-70 hover:bg-brand/90 hover:shadow-[0_6px_20px_rgba(255,90,54,0.5)] focus-visible:ring-2 focus-visible:ring-brand/50 sm:px-5 sm:py-3 sm:text-[15px]'
							>
								{isCookNavigating ? (
									<Loader2 className='size-5 animate-spin' />
								) : (
									<ChefHat className='size-5' />
								)}
								{isCookNavigating ? t('heroStarting') : t('heroStartCooking')}
							</motion.button>
							<motion.button
								type='button'
								onClick={() =>
									startNavigationTransition(() => {
										router.push(`/recipes/${recipe.id}`)
									})
								}
								disabled={isNavigating}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='rounded-xl border border-border-medium bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:border-brand/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50 sm:px-5 sm:py-3 sm:text-[15px]'
							>
								{isNavigating ? (
									<>
										<Loader2 className='inline size-4 animate-spin mr-1.5' />
										{t('loading')}
									</>
								) : (
									t('viewRecipe')
								)}
							</motion.button>
						</div>
					</div>
				</div>
			</motion.div>
		</GlowCard>
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
	const t = useTranslations('explore')
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
			label: t(
				DIFFICULTY_API_TO_I18N_KEY[
					FILTER_STATE_TO_API_DISPLAY[d.toLowerCase()] ?? d
				] || d,
			),
		}),
	)
	if (filters.cookingTimeMax < 1440) {
		activeFilters.push({
			type: 'cookingTimeMax',
			value: String(filters.cookingTimeMax),
			label: t('underMinutes', { minutes: filters.cookingTimeMax }),
		})
	}
	if (filters.rating !== null) {
		activeFilters.push({
			type: 'rating',
			value: String(filters.rating),
			label: t('starsPlus', { rating: filters.rating }),
		})
	}
	if (filters.foolproofOnly) {
		activeFilters.push({
			type: 'foolproofOnly',
			value: 'true',
			label: t('firstTimerFriendly'),
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
					? t('noResults')
					: resultCount === 1
						? t('recipeCountSingle', { n: resultCount })
						: t('recipeCountPlural', { n: resultCount })}
				{searchQuery && (
					<span className='text-text-muted'>
						{' '}
						{t('forQuery', { query: searchQuery })}
					</span>
				)}
			</span>

			{/* Active filter chips */}
			{activeFilters.map(filter => (
				<motion.button
					type='button'
					key={`${filter.type}-${filter.value}`}
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.8, opacity: 0 }}
					whileTap={BUTTON_TAP}
					onClick={() => onRemove(filter.type, filter.value)}
					className='group flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					{filter.label}
					<X className='size-3.5 transition-transform group-hover:scale-110' />
				</motion.button>
			))}

			{/* Clear all button */}
			{activeFilters.length > 1 && (
				<motion.button
					type='button'
					onClick={onClearAll}
					whileTap={BUTTON_TAP}
					className='text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
				>
					{t('clearAllFilters')}
				</motion.button>
			)}
		</motion.div>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ExplorePage() {
	return (
		<Suspense>
			<ExploreContent />
		</Suspense>
	)
}

function ExploreContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { requireAuth } = useAuthGate()
	const { user } = useAuth()
	const initialQuery = searchParams.get('q') || ''
	const modeParam = searchParams.get('mode')
	const initialViewMode: 'all' | 'trending' =
		modeParam === 'trending' ? 'trending' : 'all'
	const searchInputRef = useRef<HTMLInputElement>(null)
	const loadMoreRef = useRef<HTMLDivElement>(null)
	const [isNavigating, startNavigationTransition] = useTransition()
	const t = useTranslations('explore')

	// Onboarding hints
	useOnboardingOrchestrator({ delay: 1000 })

	// State
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [featuredRecipe, setFeaturedRecipe] = useState<Recipe | null>(null)
	const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isSearching, setIsSearching] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [loadMoreError, setLoadMoreError] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState(initialQuery)
	const [debouncedSearch, setDebouncedSearch] = useState(initialQuery)
	const [viewMode, setViewMode] = useState<'all' | 'trending'>(initialViewMode)
	const [sortBy, setSortBy] = useState<string>('newest')
	const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set())
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)
	const [totalCount, setTotalCount] = useState(0)
	const [filters, setFilters] = useState<RecipeFilters>({
		dietary: [],
		cuisine: [],
		difficulty: [],
		cookingTimeMax: 1440,
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

	useEffect(() => {
		let cancelled = false
		getFeedPosts({ page: 0, size: 3, mode: 'trending' })
			.then(res => {
				if (!cancelled && res.success && res.data) {
					setTrendingPosts(res.data.slice(0, 3))
				}
			})
			.catch(() => {
				/* silent fail */
			})
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		if (modeParam === 'trending') {
			setViewMode('trending')
			return
		}

		if (modeParam === 'all' || modeParam === null) {
			setViewMode('all')
		}
	}, [modeParam])
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
	const [trendingSearches, setTrendingSearches] = useState<string[]>([])
	const autocompleteRef = useRef<HTMLDivElement>(null)
	const sortOptions = useMemo(
		() => [
			{ value: 'newest', label: t('newest') },
			{ value: 'mostCooked', label: t('mostCooked') },
			{ value: 'topRated', label: t('topRated') },
			{ value: 'quickest', label: t('quickest') },
		],
		[t],
	)

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

	// Autocomplete: faster debounce (150ms) â€” fires suggestions while user types
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

	// Fetch trending searches from API on mount
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
				// â”€â”€ Typesense path: typo-tolerant search when user types a query â”€â”€
				if (debouncedSearch) {
					const searchRes = await unifiedSearch(
						debouncedSearch,
						'recipes',
						RECIPES_PER_PAGE,
					)
					if (cancelled) return
					if (!searchRes.success) {
						setError(t('failedLoadRecipesDescription'))
						return
					}
					if (searchRes.data?.recipes?.hits) {
						const recipesResult = searchRes.data.recipes
						const allRecipes = recipesResult.hits.map(h =>
							mapRecipeDocToRecipe(h.document),
						)
						setFeaturedRecipe(null)
						setSavedRecipes(new Set<string>())
						setRecipes(allRecipes)
						const totalFound = recipesResult.found ?? allRecipes.length
						setTotalCount(totalFound)
						setHasMore(allRecipes.length < totalFound)
					} else {
						setRecipes([])
						setTotalCount(0)
						setHasMore(false)
					}
				} else {
					// â”€â”€ MongoDB path: browse / filter / trending (no search query) â”€â”€
					const filterParams: Record<string, unknown> = {
						page: 0,
						size: RECIPES_PER_PAGE,
					}

					if (filters.difficulty.length > 0) {
						const apiDifficulty = filters.difficulty
							.map(d => FILTER_STATE_TO_API_DISPLAY[d.toLowerCase()] || d)
							.find(Boolean)
						if (apiDifficulty) filterParams.difficulty = apiDifficulty
					}
					if (filters.cuisine.length > 0) {
						filterParams.cuisineType = filters.cuisine[0]
					}
					if (filters.dietary.length > 0) {
						filterParams.dietaryTags = filters.dietary
					}
					if (filters.cookingTimeMax < 1440) {
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
					if (!response.success) {
						setError(t('failedLoadRecipesDescription'))
						return
					}
					if (response.data) {
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
				if (!cancelled) setError(t('failedLoadRecipesDescription'))
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchRecipes()
		return () => {
			cancelled = true
		}
	}, [debouncedSearch, viewMode, filters, retryCount, sortBy, t])

	// Scroll restoration â€” save on unmount (covers all navigations away), restore once after data loads
	const scrollRestoredRef = useRef(false)

	useEffect(() => {
		if (scrollRestoredRef.current || isLoading) return
		const savedPosition = sessionStorage.getItem(SCROLL_RESTORATION_KEY)
		if (savedPosition) {
			scrollRestoredRef.current = true
			requestAnimationFrame(() => {
				window.scrollTo(0, parseInt(savedPosition, 10))
				sessionStorage.removeItem(SCROLL_RESTORATION_KEY)
			})
		}
	}, [isLoading])

	// Save scroll on unmount (covers client-side navigation) and beforeunload (covers refresh/close)
	useEffect(() => {
		const handleBeforeUnload = () => {
			sessionStorage.setItem(SCROLL_RESTORATION_KEY, String(window.scrollY))
		}
		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
			// Save on component unmount (e.g., navigating to recipe detail)
			if (window.scrollY > 0) {
				sessionStorage.setItem(SCROLL_RESTORATION_KEY, String(window.scrollY))
			}
		}
	}, [])

	// Load more handler for infinite scroll
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setLoadMoreError(false)
		setIsLoadingMore(true)
		const nextPage = page // page state is already 1-based, backend expects 0-based

		try {
			// â”€â”€ Typesense path: paginated search when user has a search query â”€â”€
			if (debouncedSearch) {
				const searchRes = await unifiedSearch(
					debouncedSearch,
					'recipes',
					RECIPES_PER_PAGE,
					nextPage + 1, // Typesense pages are 1-based
				)
				if (searchRes.success && searchRes.data?.recipes?.hits) {
					const recipesResult = searchRes.data.recipes
					const newRecipes = recipesResult.hits.map(h =>
						mapRecipeDocToRecipe(h.document),
					)
					setRecipes(prev => {
						const existingIds = new Set(prev.map(r => r.id))
						const dedupedRecipes = newRecipes.filter(
							r => !existingIds.has(r.id),
						)
						return [...prev, ...dedupedRecipes]
					})
					setPage(nextPage + 1)
					const totalFound = recipesResult.found ?? 0
					setTotalCount(totalFound)
					setHasMore(recipes.length + newRecipes.length < totalFound)
				}
			} else {
				// â”€â”€ MongoDB path: browse / filter / trending (no search query) â”€â”€
				const filterParams: Record<string, unknown> = {
					page: nextPage,
					size: RECIPES_PER_PAGE,
				}

				if (filters.difficulty.length > 0) {
					const apiDifficulty = filters.difficulty
						.map(d => FILTER_STATE_TO_API_DISPLAY[d.toLowerCase()] || d)
						.find(Boolean)
					if (apiDifficulty) filterParams.difficulty = apiDifficulty
				}
				if (filters.cuisine.length > 0) {
					filterParams.cuisineType = filters.cuisine[0]
				}
				if (filters.dietary.length > 0) {
					filterParams.dietaryTags = filters.dietary
				}
				if (filters.cookingTimeMax < 1440) {
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
						const dedupedRecipes = newRecipes.filter(
							r => !existingIds.has(r.id),
						)
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
			}
		} catch (err) {
			logDevError('Failed to load more recipes:', err)
			setLoadMoreError(true)
		} finally {
			setIsLoadingMore(false)
		}
	}, [
		isLoadingMore,
		hasMore,
		page,
		viewMode,
		debouncedSearch,
		filters,
		sortBy,
		recipes.length,
	])

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
		if (!requireAuth(t('authActionCook'))) return
		router.push(`/recipes/${recipeId}?cook=true`)
	}

	const handleSave = async (recipeId: string) => {
		if (!requireAuth(t('authActionSave'))) return
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
					toast.success(t('toastRecipeSaved'))
				} else {
					toast.success(t('toastRecipeUnsaved'))
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
			toast.error(t('toastSaveFailed'))
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
				updated.cookingTimeMax = 1440
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
			cookingTimeMax: 1440,
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
			(filters.cookingTimeMax < 1440 ? 1 : 0) +
			(filters.rating !== null ? 1 : 0) +
			(filters.foolproofOnly ? 1 : 0),
		[filters],
	)
	const hasNoActiveQueryOrFilters = activeFiltersCount === 0 && !debouncedSearch
	const shouldShowFilterTrigger =
		activeFiltersCount > 0 ||
		debouncedSearch.length > 0 ||
		viewMode === 'trending' ||
		totalCount > 0
	const commandHeading = shouldShowFilterTrigger
		? t('commandHeading')
		: t('commandHeading').replace('Filter. ', '')

	const modeButtonClassName = (isActive: boolean, accent: 'brand' | 'xp') =>
		[
			'flex h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand/50',
			isActive
				? accent === 'xp'
					? 'bg-xp text-white shadow-card'
					: 'bg-brand text-white shadow-card'
				: accent === 'xp'
					? 'border border-border-medium bg-bg-card text-text-secondary hover:border-xp hover:text-xp'
					: 'border border-border-medium bg-bg-card text-text-secondary hover:border-brand hover:text-brand',
		].join(' ')

	// ============================================
	// RENDER
	// ============================================

	return (
		<PageTransition>
			<div
				data-testid='explore-page'
				data-visual-ready={isLoading ? 'false' : 'true'}
			>
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
								{t('loading')}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<PageContainer maxWidth='2xl'>
					<div className='grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]'>
						<div>
							<BlurFade delay={0} duration={0.4}>
								<ExploreCommandDeck
									activeFiltersCount={activeFiltersCount}
									resultCount={totalCount}
									viewMode={viewMode}
									onViewModeChange={setViewMode}
									sortValue={sortBy}
									onSortChange={setSortBy}
									sortOptions={sortOptions}
									sortDisabled={viewMode === 'trending'}
									labels={{
										eyebrow: t('commandEyebrow'),
										heading: commandHeading,
										modeChip: t('commandModeChip'),
										results: t('commandResults'),
										filters: t('commandFilters'),
										activeFilters: t('commandActiveFilters'),
										mode: t('commandMode'),
										sort: t('commandSort'),
										sortNewest: t('commandSortNewest'),
										allRecipes: t('allRecipes'),
										trending: t('trending'),
										modeAll: t('commandModeAll'),
										modeTrending: t('commandModeTrending'),
									}}
									className='mb-6'
								>
									<div className='space-y-2.5'>
										<div className='flex items-center gap-2'>
											<div className='group relative flex-1'>
												<Search className='absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand' />
												<Input
													ref={searchInputRef}
													placeholder={t('searchPlaceholder')}
													aria-label={t('searchPlaceholder')}
													role='combobox'
													aria-expanded={
														showAutocomplete &&
														autocompleteSuggestions.length > 0
													}
													aria-autocomplete='list'
													aria-controls='explore-autocomplete-listbox'
													aria-activedescendant={
														selectedSuggestionIndex >= 0
															? `explore-suggestion-${selectedSuggestionIndex}`
															: undefined
													}
													value={searchQuery}
													onChange={e => setSearchQuery(e.target.value)}
													onKeyDown={handleSearchKeyDown}
													onFocus={() => {
														if (autocompleteSuggestions.length > 0) {
															setShowAutocomplete(true)
														}
													}}
													className='h-12 rounded-xl border-border-medium bg-bg-elevated/80 pl-12 pr-10 text-sm transition-all focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/50 sm:text-base'
												/>
												{searchQuery && (
													<button
														type='button'
														onClick={handleClearSearch}
														className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
														aria-label={t('clearSearch')}
													>
														<X className='size-4' />
													</button>
												)}

												{showAutocomplete &&
													autocompleteSuggestions.length > 0 && (
														<div
															id='explore-autocomplete-listbox'
															role='listbox'
															className='absolute z-dropdown mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border-subtle bg-bg-card shadow-xl'
														>
															{autocompleteSuggestions.map(
																(suggestion, index) => (
																	<button
																		type='button'
																		key={`${suggestion}-${index}`}
																		id={`explore-suggestion-${index}`}
																		role='option'
																		aria-selected={
																			selectedSuggestionIndex === index
																		}
																		onClick={() => {
																			setSearchQuery(suggestion)
																			setDebouncedSearch(suggestion)
																			setShowAutocomplete(false)
																		}}
																		className={`flex w-full items-center gap-3 border-b border-border-subtle p-3 text-left transition-colors last:border-b-0 ${
																			selectedSuggestionIndex === index
																				? 'bg-brand/10'
																				: 'hover:bg-bg-hover'
																		}`}
																	>
																		<div className='flex size-8 items-center justify-center rounded-full bg-brand/10 text-brand'>
																			<Search className='size-4' />
																		</div>
																		<p className='min-w-0 flex-1 truncate text-sm font-medium text-text-primary'>
																			{suggestion}
																		</p>
																	</button>
																),
															)}
														</div>
													)}
											</div>

											{shouldShowFilterTrigger && (
												<RecipeFiltersSheet
													onApply={handleFiltersApply}
													initialFilters={filters}
													triggerClassName='h-12 shrink-0 rounded-xl border-border-medium bg-bg-card px-3.5 text-sm font-semibold text-text-secondary hover:border-brand/40 hover:text-text-primary'
												/>
											)}
										</div>
										{/* Trending Searches Loops */}
										<div className='flex items-center gap-1.5 px-1 py-1 text-xs text-text-muted justify-start'>
											<TrendingUp className='size-3.5 text-brand shrink-0' />
											<span className='font-semibold'>{t('trending')}:</span>
											<TextLoop
												texts={[
													'Italian Pasta',
													'High Protein Wraps',
													'Healthy Bowls',
													'Keto Dinners',
													'Foolproof Desserts',
												]}
												interval={3500}
												textClassName='font-semibold text-brand cursor-pointer hover:underline'
											/>
										</div>
									</div>
								</ExploreCommandDeck>
							</BlurFade>
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

							{/* Trending Food Posts (social discovery â€” only when not searching) */}
							{!debouncedSearch && trendingPosts.length > 0 && (
								<section className='mb-6 md:mb-8'>
									<div className='mb-3 flex items-center gap-2'>
										<Flame className='size-4 text-brand' />
										<span className='text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted'>
											Trending in the Community
										</span>
									</div>
									<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
										{trendingPosts.map(post => (
											<PostCard
												key={post.id}
												post={post}
												currentUserId={user?.userId}
											/>
										))}
									</div>
								</section>
							)}

							{/* Hero/Featured Recipe (only when not searching) */}
							<AnimatePresence mode='wait'>
								{!isLoading && featuredRecipe && !debouncedSearch && (
									<HeroRecipe recipe={featuredRecipe} onCook={handleCook} />
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
										â†‘â†“â†â†’
									</kbd>
									<span>{t('kbdNavigate')}</span>
									<kbd className='rounded border border-border-medium bg-bg-elevated px-1.5 py-0.5'>
										Enter
									</kbd>
									<span>{t('kbdOpen')}</span>
									<kbd className='rounded border border-border-medium bg-bg-elevated px-1.5 py-0.5'>
										Esc
									</kbd>
									<span>{t('kbdCancel')}</span>
								</motion.div>
							)}

							{/* Content */}
							{isLoading && (
								<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'>
									{Array.from({ length: 3 }).map((_, index) => (
										<div
											key={`explore-loading-card-${index}`}
											className={`overflow-hidden rounded-2xl border border-border-subtle bg-bg-card p-3.5 shadow-card ${
												index === 2 ? 'hidden sm:block' : ''
											}`}
										>
											<Skeleton className='mb-2.5 aspect-[16/6] w-full rounded-xl' />
											<div className='space-y-1.5'>
												<Skeleton className='h-4 w-5/6' />
												<Skeleton className='h-3 w-3/4' />
												<Skeleton className='mt-1.5 h-7 w-2/3 rounded-xl' />
											</div>
										</div>
									))}
								</div>
							)}
							{error && (
								<ErrorState
									title={t('failedLoadRecipes')}
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
									className={
										hasNoActiveQueryOrFilters ? 'my-2 py-7 md:py-10' : undefined
									}
									title={
										activeFiltersCount > 0
											? t('noMatchingRecipes')
											: t('noRecipesFound')
									}
									description={
										activeFiltersCount > 0
											? t('adjustFiltersHint')
											: debouncedSearch
												? t('noSearchResults', { query: debouncedSearch })
												: t('beFirstToShare')
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
													label: t('clearAll'),
													onClick: handleClearAllFilters,
												}
											: {
													label: t('createRecipe'),
													href: '/create',
												}
									}
									secondaryActions={
										hasNoActiveQueryOrFilters
											? [
													viewMode === 'all'
														? {
																label: t('trending'),
																onClick: () => setViewMode('trending'),
															}
														: {
																label: t('allRecipes'),
																onClick: () => setViewMode('all'),
															},
												]
											: undefined
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
													difficulty={
														(recipe.difficulty as Difficulty) || 'Beginner'
													}
													xpReward={recipe.xpReward ?? 0}
													rating={recipe.averageRating ?? 0}
													cookCount={recipe.cookCount ?? 0}
													skillTags={recipe.skillTags}
													badges={recipe.rewardBadges}
													author={
														recipe.author?.displayName
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
													isSaved={
														recipe.isSaved ?? savedRecipes.has(recipe.id)
													}
													onCook={() => handleCook(recipe.id)}
													onSave={() => handleSave(recipe.id)}
												/>
											</motion.div>
										))}
									</StaggerContainer>

									{/* Infinite scroll sentinel */}
									<div ref={loadMoreRef} className='h-px' />

									{/* Loading indicator for infinite scroll */}
									{isLoadingMore && <RecipeCardSkeleton count={3} />}

									{/* Load more error with retry */}
									{loadMoreError && !isLoadingMore && (
										<motion.div
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											className='flex flex-col items-center gap-2 py-8'
										>
											<span className='text-sm text-text-muted'>
												{t('loadMoreFailed')}
											</span>
											<motion.button
												type='button'
												whileHover={BUTTON_HOVER}
												whileTap={BUTTON_TAP}
												onClick={handleLoadMore}
												className='rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/50'
											>
												{t('tryAgainButton')}
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
												âœ¨ {t('seenAllRecipes', { count: totalCount })}
											</span>
										</motion.div>
									)}
								</>
							)}
							{/* Bottom breathing room for MobileBottomNav */}
							<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
						</div>

						<ExploreContextRail
							trendingSearches={trendingSearches}
							onQuickSearch={term => {
								setSearchQuery(term)
								setDebouncedSearch(term)
							}}
							showDiscoveryWidgets={!debouncedSearch}
						/>
					</div>
				</PageContainer>
			</div>
		</PageTransition>
	)
}
