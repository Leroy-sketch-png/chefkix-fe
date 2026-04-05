'use client'
import { useTranslations } from 'next-intl'

import { useState, useEffect, useRef, useMemo, Suspense, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	BookOpen,
	Users,
	Image as ImageIcon,
	Star,
	Clock,
	Flame,
	Bookmark,
	Search,
	ArrowLeft,
	Sparkles,
	X,
	History,
	TrendingUp,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { EmptyStateGamified } from '@/components/shared'
import { FeedTabBar, type TabItem } from '@/components/shared/FeedTabBar'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import {
	StaggerContainer,
	staggerItemVariants,
} from '@/components/ui/stagger-animation'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_FEED_HOVER,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import { difficultyToDisplay, DifficultyDisplay } from '@/lib/apiUtils'
import { unifiedSearch } from '@/services/search'
import { toggleFollow } from '@/services/social'
import { toggleSaveRecipe } from '@/services/recipe'
import {
	RecipeSearchDoc,
	UserSearchDoc,
	PostSearchDoc,
} from '@/lib/types/search'
import { logDevError } from '@/lib/dev-log'
import { trackEvent, trackSearch } from '@/lib/eventTracker'
import { ErrorState } from '@/components/ui/error-state'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { triggerSaveConfetti } from '@/lib/confetti'
import { toast } from 'sonner'
import { useAuthGate } from '@/hooks/useAuthGate'

// ============================================
// TYPES
// ============================================

type SearchTab = 'recipes' | 'people' | 'posts'

interface RecipeResult {
	id: string
	title: string
	imageUrl: string
	rating?: number // Optional until BE rating system is implemented
	cookTime: string
	difficulty: DifficultyDisplay
	author: {
		username: string
		avatarUrl: string
	}
	cookCount: number
	isSaved?: boolean
}

interface PersonResult {
	id: string
	displayName: string
	username: string
	avatarUrl: string
	bio: string
	isFollowing?: boolean
	isVerified?: boolean
}

interface PostResult {
	id: string
	imageUrl: string
	caption: string
	author: {
		username: string
		avatarUrl: string
	}
	likeCount: number
	recipeId?: string
}

// ============================================
// RECENT SEARCHES (shared utility)
// ============================================

import {
	getRecentSearches,
	addRecentSearch,
	removeRecentSearch,
} from '@/lib/recentSearches'

const SEARCH_SUGGESTIONS = [
	'Pasta',
	'Chicken',
	'Vegan',
	'Quick meals',
	'Desserts',
	'Breakfast',
	'Soup',
	'Salad',
	'Stir fry',
	'Baking',
]

// Extended vocabulary for "Did you mean?" fuzzy matching
const SEARCH_VOCABULARY = [
	...SEARCH_SUGGESTIONS,
	'Pizza', 'Burger', 'Sushi', 'Tacos', 'Curry', 'Rice', 'Noodles',
	'Grilling', 'Vegetarian', 'Gluten-free', 'Low-carb', 'Keto',
	'Smoothie', 'Sandwich', 'Seafood', 'Beef', 'Pork', 'Lamb',
	'Chocolate', 'Cake', 'Cookies', 'Bread', 'Pancakes', 'Waffles',
	'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'Thai',
	'French', 'Japanese', 'Korean', 'Chinese', 'American', 'Middle Eastern',
]

/** Simple Levenshtein distance for "Did you mean?" */
function levenshtein(a: string, b: string): number {
	const al = a.length, bl = b.length
	const dp: number[][] = Array.from({ length: al + 1 }, (_, i) =>
		Array.from({ length: bl + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
	)
	for (let i = 1; i <= al; i++)
		for (let j = 1; j <= bl; j++)
			dp[i][j] = a[i - 1] === b[j - 1]
				? dp[i - 1][j - 1]
				: 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
	return dp[al][bl]
}

/** Find closest matching term from vocabulary (max distance 3) */
function findSuggestion(query: string): string | null {
	const q = query.toLowerCase().trim()
	if (q.length < 2) return null
	let best: string | null = null
	let bestDist = Infinity
	for (const term of SEARCH_VOCABULARY) {
		const t = term.toLowerCase()
		if (t === q) return null // exact match — no suggestion needed
		const dist = levenshtein(q, t)
		if (dist < bestDist && dist <= 3 && dist < q.length * 0.6) {
			bestDist = dist
			best = term
		}
	}
	return best
}

// ============================================
// COMPONENTS
// ============================================

const RecipeResultCard = ({ recipe }: { recipe: RecipeResult }) => {
	const [saved, setSaved] = useState(recipe.isSaved)
	const requireAuth = useAuthGate()
	const t = useTranslations('search')

	const handleSave = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!requireAuth('save this recipe')) return
		const prev = saved
		setSaved(!prev)
		try {
			const res = await toggleSaveRecipe(recipe.id)
			if (res.success && res.data) {
				setSaved(res.data.isSaved)
				if (res.data.isSaved) triggerSaveConfetti()
				toast.success(res.data.isSaved ? t('recipeSaved') : t('recipeUnsaved'))
			} else {
				setSaved(prev)
				toast.error(t('failedToSave'))
			}
		} catch {
			setSaved(prev)
			toast.error(t('failedToSave'))
		}
	}

	return (
		<motion.div
			variants={staggerItemVariants}
			whileHover={CARD_FEED_HOVER}
			transition={TRANSITION_SPRING}
		>
			<Link
				href={`/recipes/${recipe.id}`}
				className='group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card transition-shadow hover:shadow-warm'
			>
				<div className='relative h-44 w-full overflow-hidden'>
					<Image
						src={recipe.imageUrl || '/placeholder-recipe.svg'}
						alt={recipe.title}
						fill
						sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
						className='object-cover transition-transform duration-300 group-hover:scale-105'
					/>
				</div>
				<div className='p-4'>
					<div className='mb-3 flex items-start justify-between gap-2'>
						<h4 className='flex-1 text-base font-bold leading-snug text-text'>
							{recipe.title}
						</h4>
						<motion.button
							onClick={handleSave}
							whileHover={ICON_BUTTON_HOVER}
							whileTap={ICON_BUTTON_TAP}
							aria-label={saved ? t('unsaveRecipe') : t('saveRecipe')}
							className={cn(
								'flex size-8 flex-shrink-0 items-center justify-center rounded-full transition-colors',
								saved
									? 'bg-brand/10 text-brand'
									: 'text-text-secondary hover:bg-bg-hover hover:text-brand',
							)}
						>
							<Bookmark className={cn('size-4', saved && 'fill-current')} />
						</motion.button>
					</div>

					<div className='mb-3 flex items-center gap-4 border-b border-border-subtle pb-3'>
						{recipe.rating !== undefined && (
							<div className='flex items-center gap-1 text-warning'>
								<Star className='size-3.5 fill-current' />
								<span className='text-caption font-semibold'>
									{recipe.rating.toFixed(1)}
								</span>
							</div>
						)}
						<div className='flex items-center gap-1 text-text-secondary'>
							<Clock className='size-3.5' />
							<span className='text-caption'>{recipe.cookTime}</span>
						</div>
						<div className='flex items-center gap-1 text-text-secondary'>
							<Flame className='size-3.5' />
							<span className='text-caption'>{recipe.difficulty}</span>
						</div>
					</div>

					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Avatar size='xs'>
								<AvatarImage
									src={recipe.author.avatarUrl}
									alt={recipe.author.username}
								/>
								<AvatarFallback>
									{recipe.author.username?.slice(0, 2).toUpperCase() || '??'}
								</AvatarFallback>
							</Avatar>
							<span className='text-caption text-text-secondary'>
								@{recipe.author.username}
							</span>
						</div>
						<span className='tabular-nums text-xs font-semibold text-text-secondary'>
							{recipe.cookCount >= 1000
								? `${(recipe.cookCount / 1000).toFixed(1)}k cooks`
								: `${recipe.cookCount} cooks`}
						</span>
					</div>
				</div>
			</Link>
		</motion.div>
	)
}

const PersonResultCard = ({ person }: { person: PersonResult }) => {
	const [following, setFollowing] = useState(person.isFollowing)
	const followLockRef = useRef(false)
	const requireAuth = useAuthGate()
	const t = useTranslations('search')

	const handleFollow = async () => {
		if (!requireAuth('follow this chef')) return
		if (followLockRef.current) return
		followLockRef.current = true
		const prev = following
		setFollowing(!prev)
		trackEvent('USER_FOLLOWED', person.id, 'user', { followed: !prev })
		try {
			const res = await toggleFollow(person.id)
			if (res.success && res.data) {
				setFollowing(res.data.isFollowing)
				toast.success(
					res.data.isFollowing
						? t('nowFollowing', { username: person.username })
						: t('unfollowed', { username: person.username }),
				)
			} else {
				setFollowing(prev)
				toast.error(t('failedToFollow'))
			}
		} catch {
			setFollowing(prev)
			toast.error(t('failedToFollow'))
		} finally {
			followLockRef.current = false
		}
	}

	return (
		<motion.div
			variants={staggerItemVariants}
			className='flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4 transition-shadow hover:shadow-card'
		>
			<Avatar size='lg' className='size-14 flex-shrink-0'>
				<AvatarImage src={person.avatarUrl} alt={person.displayName} />
				<AvatarFallback>
					{person.displayName
						?.split(' ')
						.map(n => n[0])
						.join('')
						.toUpperCase()
						.slice(0, 2) || '??'}
				</AvatarFallback>
			</Avatar>
			<div className='min-w-0 flex-1'>
				<p className='flex items-center gap-1 text-base font-bold text-text'>
					{person.displayName}
					{person.isVerified && <VerifiedBadge size='sm' />}
				</p>
				<p className='text-sm text-text-secondary'>@{person.username}</p>
				<p className='mt-1 truncate text-caption text-text-secondary'>
					{person.bio}
				</p>
			</div>
			<motion.button
				onClick={handleFollow}
				whileHover={BUTTON_HOVER}
				whileTap={BUTTON_TAP}
				className={cn(
					'flex-shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors',
					following
						? 'border-2 border-border-subtle bg-bg-elevated text-text hover:border-error hover:bg-error/5 hover:text-error'
						: 'bg-brand text-white',
				)}
			>
				{following ? t('following') : t('follow')}
			</motion.button>
		</motion.div>
	)
}

const PostResultCard = ({ post }: { post: PostResult }) => {
	return (
		<motion.div variants={staggerItemVariants}>
			<Link
				href={`/post/${post.id}`}
				className='group flex gap-3 rounded-2xl border border-border-subtle bg-bg-card p-3 transition-shadow hover:shadow-card'
			>
				<div className='relative size-20 flex-shrink-0 overflow-hidden rounded-xl'>
					<Image
						src={post.imageUrl || '/placeholder-recipe.svg'}
						alt={`Post by ${post.author.username}${post.caption ? `: ${post.caption.slice(0, 80)}` : ''}`}
						fill
						sizes='80px'
						className='object-cover transition-transform duration-300 group-hover:scale-105'
					/>
				</div>
				<div className='min-w-0 flex-1'>
					<div className='mb-1 flex items-center gap-2'>
						<Avatar size='xs'>
							<AvatarImage
								src={post.author.avatarUrl}
								alt={post.author.username}
							/>
							<AvatarFallback>
								{post.author.username?.slice(0, 2).toUpperCase() || '??'}
							</AvatarFallback>
						</Avatar>
						<span className='text-sm font-semibold text-text'>
							@{post.author.username}
						</span>
					</div>
					<p className='line-clamp-2 text-caption text-text-secondary'>
						{post.caption}
					</p>
					<p className='mt-1 tabular-nums text-xs text-text-secondary'>
						â¤ï¸ {post.likeCount} likes
					</p>
				</div>
			</Link>
		</motion.div>
	)
}

// ============================================
// HELPERS
// ============================================

const transformRecipeDoc = (doc: RecipeSearchDoc): RecipeResult => ({
	id: doc.id,
	title: doc.title,
	imageUrl: doc.coverImageUrl || '/placeholder-recipe.svg',
	rating: doc.avgRating > 0 ? doc.avgRating : undefined,
	cookTime: `${doc.totalTime || 0} min`,
	difficulty: difficultyToDisplay(
		doc.difficulty as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
	),
	author: {
		username: doc.authorName || 'chef',
		avatarUrl: '/placeholder-avatar.svg',
	},
	cookCount: doc.cookCount || 0,
})

const transformUserDoc = (doc: UserSearchDoc): PersonResult => ({
	id: doc.id,
	displayName: doc.displayName || doc.firstName || doc.username,
	username: doc.username,
	avatarUrl: doc.avatarUrl || '/placeholder-avatar.svg',
	bio: doc.bio || '',
	isVerified: (doc as UserSearchDoc & { isVerified?: boolean }).isVerified,
})

const transformPostDoc = (doc: PostSearchDoc): PostResult => ({
	id: doc.id,
	imageUrl: doc.photoUrl || '/placeholder-recipe.svg',
	caption: doc.content || '',
	author: {
		username: doc.authorName || 'user',
		avatarUrl: '/placeholder-avatar.svg',
	},
	likeCount: doc.likeCount || 0,
})

// ============================================
// PAGE
// ============================================

function SearchContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const t = useTranslations('search')
	const query = searchParams.get('q') || ''
	const [searchInput, setSearchInput] = useState(query)
	const isInternalNav = useRef(false)
	const [activeTab, setActiveTab] = useState<SearchTab>('recipes')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)
	const [recentSearches, setRecentSearches] = useState<string[]>([])
	const [isNavigating, startNavigationTransition] = useTransition()
	const [results, setResults] = useState<{
		recipes: RecipeResult[]
		people: PersonResult[]
		posts: PostResult[]
	}>({
		recipes: [],
		people: [],
		posts: [],
	})
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// "Did you mean?" suggestion for empty results
	const suggestion = useMemo(() => query ? findSuggestion(query) : null, [query])

	// Clean up debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current)
			}
		}
	}, [])

	// Update input when URL changes from browser nav (back/forward)
	useEffect(() => {
		if (!isInternalNav.current) {
			setSearchInput(query)
		}
		isInternalNav.current = false
	}, [query])

	// Load recent searches from localStorage on mount
	useEffect(() => {
		setRecentSearches(getRecentSearches())
	}, [])

	const handleSearchInputChange = (value: string) => {
		setSearchInput(value)
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current)
		}
		debounceTimerRef.current = setTimeout(() => {
			isInternalNav.current = true
			const trimmed = value.trim()
			router.replace(
				trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search',
			)
		}, 300)
	}

	// Fetch search results via unified Typesense search
	useEffect(() => {
		if (!query) return
		let cancelled = false

		const fetchResults = async () => {
			setIsLoading(true)
			addRecentSearch(query)
			setRecentSearches(getRecentSearches())
			try {
				const res = await unifiedSearch(query, 'all', 20)
				if (cancelled) return

				if (res.success && res.data) {
					const recipes =
						res.data.recipes?.hits?.map(h => transformRecipeDoc(h.document)) ??
						[]
					const people =
						res.data.users?.hits?.map(h => transformUserDoc(h.document)) ?? []
					const posts =
						res.data.posts?.hits?.map(h => transformPostDoc(h.document)) ?? []
					setResults({ recipes, people, posts })

					// Track search query for taste vector building
					const totalCount = recipes.length + people.length + posts.length
					trackSearch(query, totalCount)
				} else {
					setResults({ recipes: [], people: [], posts: [] })
					trackSearch(query, 0)
				}
			} catch (err) {
				if (cancelled) return
				logDevError('Search failed:', err)
				setError(true)
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchResults()
		return () => {
			cancelled = true
		}
	}, [query, retryKey])

	const totalResults =
		results.recipes.length + results.people.length + results.posts.length

	const tabs: TabItem<SearchTab>[] = [
		{
			key: 'recipes',
			label: t('tabRecipes'),
			icon: BookOpen,
			count: results.recipes.length,
		},
		{
			key: 'people',
			label: t('tabPeople'),
			icon: Users,
			count: results.people.length,
		},
		{
			key: 'posts',
			label: t('tabPosts'),
			icon: ImageIcon,
			count: results.posts.length,
		},
	]

	if (error && query) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<ErrorState
						title={t('searchFailed')}
						message={t('searchFailedDesc')}
						onRetry={() => {
							setError(false)
							setIsLoading(true)
						}}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	if (!query) {
		const handleSuggestionClick = (term: string) => {
			setSearchInput(term)
			isInternalNav.current = true
			router.replace(`/search?q=${encodeURIComponent(term)}`)
		}

		const handleRemoveRecent = (term: string) => {
			removeRecentSearch(term)
			setRecentSearches(getRecentSearches())
		}

		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					{/* Search input always visible */}
					<div className='mx-auto mt-10 mb-8 max-w-xl'>
						<div className='relative'>
							<Search className='pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted' />
							<input
								type='text'
								value={searchInput}
								onChange={e => handleSearchInputChange(e.target.value)}
								placeholder='Search recipes, people, posts...'
								autoFocus
								className='w-full rounded-2xl border border-border-subtle bg-bg-card py-4 pl-12 pr-12 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
							/>
							{searchInput && (
								<motion.button
									onClick={() => handleSearchInputChange('')}
									whileTap={BUTTON_TAP}
									className='absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text'
									aria-label='Clear search'
								>
									<X className='size-5' />
								</motion.button>
							)}
						</div>
					</div>

					{/* Recent searches */}
					{recentSearches.length > 0 && (
						<div className='mx-auto mb-8 max-w-xl'>
							<div className='mb-3 flex items-center gap-2 text-text-secondary'>
								<History className='size-4' />
								<span className='text-sm font-semibold'>{t('recentSearches')}</span>
							</div>
							<div className='flex flex-wrap gap-2'>
								{recentSearches.map(term => (
									<motion.button
										key={term}
										onClick={() => handleSuggestionClick(term)}
										whileTap={BUTTON_TAP}
										className='group flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card px-3.5 py-2 text-sm text-text transition-colors hover:border-brand/40 hover:bg-brand/5'
									>
										<span>{term}</span>
										<span
											role='button'
											tabIndex={0}
											onClick={e => {
												e.stopPropagation()
												handleRemoveRecent(term)
											}}
											onKeyDown={e => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.stopPropagation()
													handleRemoveRecent(term)
												}
											}}
											className='ml-0.5 rounded-full p-0.5 text-text-muted opacity-70 transition-opacity hover:bg-bg-hover hover:text-text md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
											aria-label={`Remove "${term}" from recent searches`}
										>
											<X className='size-3' />
										</span>
									</motion.button>
								))}
							</div>
						</div>
					)}

					{/* Suggestions */}
					<div className='mx-auto mb-8 max-w-xl'>
						<div className='mb-3 flex items-center gap-2 text-text-secondary'>
							<TrendingUp className='size-4' />
							<span className='text-sm font-semibold'>{t('suggestions')}</span>
						</div>
						<div className='flex flex-wrap gap-2'>
							{SEARCH_SUGGESTIONS.map(term => (
								<motion.button
									key={term}
									onClick={() => handleSuggestionClick(term)}
									whileTap={BUTTON_TAP}
									className='rounded-full border border-border-subtle bg-bg-card px-3.5 py-2 text-sm text-text-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-text'
								>
									{term}
								</motion.button>
							))}
						</div>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

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
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
							>
								<Search className='size-4' />
							</motion.div>
							{t('loading')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageContainer maxWidth='lg'>
				{/* Header - Secondary page pattern with back button */}
				<div className='mb-6'>
					{/* Editable search input - users can refine from within the page */}
					<div className='mb-4 flex items-center gap-3'>
						<motion.button
							onClick={() => router.back()}
							whileTap={BUTTON_TAP}
							className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
							aria-label='Go back'
						>
							<ArrowLeft className='size-5' />
						</motion.button>
						<div className='relative flex-1'>
							<Search className='pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted' />
							<input
								type='text'
								value={searchInput}
								onChange={e => handleSearchInputChange(e.target.value)}
								placeholder='Search recipes, people, posts...'
								className='w-full rounded-xl border border-border-subtle bg-bg-card py-3 pl-12 pr-10 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
							/>
							{searchInput && (
								<motion.button
									onClick={() => handleSearchInputChange('')}
									whileTap={BUTTON_TAP}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text'
									aria-label='Clear search'
								>
									<X className='size-4' />
								</motion.button>
							)}
						</div>
					</div>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={TRANSITION_SPRING}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-warm shadow-card'
						>
							<Search className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>
							Results for &quot;{query}&quot;
						</h1>
					</div>
					<p className='flex items-center gap-2 tabular-nums text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						{totalResults} results found
					</p>
				</div>

				{/* Tabs */}
				<FeedTabBar<SearchTab>
					tabs={tabs}
					activeTab={activeTab}
					onTabChange={setActiveTab}
					variant="underline"
					size="lg"
					className="mb-8"
				/>

				{/* Results */}
				<AnimatePresence mode='wait'>
					{isLoading ? (
						<motion.div
							key='loading-skeleton'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
						>
							{activeTab === 'recipes' && (
								<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
									{Array.from({ length: 6 }).map((_, i) => (
										<div
											key={i}
											className='overflow-hidden rounded-radius border border-border-subtle bg-bg-card'
										>
											<Skeleton className='aspect-[4/3] w-full' />
											<div className='space-y-3 p-4'>
												<Skeleton className='h-5 w-full' />
												<Skeleton className='h-5 w-3/4' />
												<Skeleton className='h-4 w-24' />
											</div>
										</div>
									))}
								</div>
							)}
							{activeTab === 'people' && (
								<div className='space-y-4'>
									{Array.from({ length: 4 }).map((_, i) => (
										<div key={i} className='flex items-center gap-4 rounded-2xl bg-bg-card p-4'>
											<Skeleton className='size-14 shrink-0 rounded-full' />
											<div className='flex-1 space-y-2'>
												<Skeleton className='h-5 w-32' />
												<Skeleton className='h-4 w-24' />
												<Skeleton className='h-4 w-48' />
											</div>
											<Skeleton className='h-9 w-24 rounded-xl' />
										</div>
									))}
								</div>
							)}
							{activeTab === 'posts' && (
								<div className='space-y-3'>
									{Array.from({ length: 4 }).map((_, i) => (
										<div key={i} className='rounded-2xl bg-bg-card p-4 space-y-3'>
											<div className='flex items-center gap-3'>
												<Skeleton className='size-10 rounded-full' />
												<div className='flex-1 space-y-1'>
													<Skeleton className='h-4 w-28' />
													<Skeleton className='h-3 w-20' />
												</div>
											</div>
											<Skeleton className='h-4 w-full' />
											<Skeleton className='h-4 w-3/4' />
											<Skeleton className='aspect-video w-full rounded-xl' />
										</div>
									))}
								</div>
							)}
						</motion.div>
					) : (
					<>
					{activeTab === 'recipes' && (
						<motion.div
							key='recipes'
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							{results.recipes.length > 0 ? (
								<StaggerContainer staggerDelay={0.05}>
									<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
										{results.recipes.map(recipe => (
											<RecipeResultCard key={recipe.id} recipe={recipe} />
										))}
									</div>
								</StaggerContainer>
							) : (
								<>
									{suggestion && (
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className='mb-4 text-center text-sm text-text-secondary'
										>
											Did you mean{' '}
											<motion.button
												onClick={() => {
													isInternalNav.current = true
													setSearchInput(suggestion)
													startNavigationTransition(() => {
														router.push(`/search?q=${encodeURIComponent(suggestion)}`)
													})
												}}
												disabled={isNavigating}
												whileTap={BUTTON_TAP}
												className='font-semibold text-brand underline underline-offset-2 hover:text-brand/80 disabled:opacity-50'
											>
												{suggestion}
											</motion.button>
											?
										</motion.p>
									)}
									<EmptyStateGamified
										variant='search'
										title={t('noRecipes')}
										description={t('noRecipesDesc', { query })}
										primaryAction={{
											label: t('exploreAll'),
											href: '/explore',
										}}
									/>
								</>
							)}
						</motion.div>
					)}

					{activeTab === 'people' && (
						<motion.div
							key='people'
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							{results.people.length > 0 ? (
								<StaggerContainer staggerDelay={0.05}>
									<div className='space-y-4'>
										{results.people.map(person => (
											<PersonResultCard key={person.id} person={person} />
										))}
									</div>
								</StaggerContainer>
							) : (
								<>
									{suggestion && (
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className='mb-4 text-center text-sm text-text-secondary'
										>
											Did you mean{' '}
											<motion.button
												onClick={() => {
													isInternalNav.current = true
													setSearchInput(suggestion)
													startNavigationTransition(() => {
														router.push(`/search?q=${encodeURIComponent(suggestion)}`)
													})
												}}
												disabled={isNavigating}
												whileTap={BUTTON_TAP}
												className='font-semibold text-brand underline underline-offset-2 hover:text-brand/80 disabled:opacity-50'
											>
												{suggestion}
											</motion.button>
											?
										</motion.p>
									)}
									<EmptyStateGamified
										variant='search'
										title={t('noPeople')}
										description={t('noPeopleDesc', { query })}
										primaryAction={{
											label: t('discoverPeople'),
											href: '/community',
										}}
									/>
								</>
							)}
						</motion.div>
					)}

					{activeTab === 'posts' && (
						<motion.div
							key='posts'
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							{results.posts.length > 0 ? (
								<StaggerContainer staggerDelay={0.05}>
									<div className='space-y-3'>
										{results.posts.map(post => (
											<PostResultCard key={post.id} post={post} />
										))}
									</div>
								</StaggerContainer>
							) : (
								<>
									{suggestion && (
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className='mb-4 text-center text-sm text-text-secondary'
										>
											Did you mean{' '}
											<motion.button
												onClick={() => {
													isInternalNav.current = true
													setSearchInput(suggestion)
													startNavigationTransition(() => {
														router.push(`/search?q=${encodeURIComponent(suggestion)}`)
													})
												}}
												disabled={isNavigating}
												whileTap={BUTTON_TAP}
												className='font-semibold text-brand underline underline-offset-2 hover:text-brand/80 disabled:opacity-50'
											>
												{suggestion}
											</motion.button>
											?
										</motion.p>
									)}
									<EmptyStateGamified
										variant='search'
										title={t('noPosts')}
										description={t('noPostsDesc', { query })}
										primaryAction={{
											label: t('viewFeed'),
											href: '/dashboard',
										}}
									/>
								</>
							)}
						</motion.div>
					)}
					</>
					)}
				</AnimatePresence>
			</PageContainer>
		</PageTransition>
	)
}

function SearchSkeleton() {
	return (
		<PageContainer maxWidth='lg'>
			<div className='space-y-6'>
				{/* Search bar */}
				<Skeleton className='h-14 w-full rounded-2xl' />
				{/* Tab bar */}
				<div className='flex gap-3'>
					{[1, 2, 3].map(i => (
						<Skeleton key={i} className='h-10 w-24 rounded-xl' />
					))}
				</div>
				{/* Result cards */}
				{[1, 2, 3, 4].map(i => (
					<div
						key={i}
						className='flex gap-4 rounded-2xl border border-border-subtle bg-bg-card p-4'
					>
						<Skeleton className='size-20 shrink-0 rounded-xl' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-5 w-3/4' />
							<Skeleton className='h-4 w-1/2' />
							<Skeleton className='h-4 w-1/3' />
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}

export default function SearchPage() {
	return (
		<Suspense fallback={<SearchSkeleton />}>
			<SearchContent />
		</Suspense>
	)
}
