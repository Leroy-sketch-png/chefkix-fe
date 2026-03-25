'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { EmptyStateGamified } from '@/components/shared'
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
import {
	RecipeSearchDoc,
	UserSearchDoc,
	PostSearchDoc,
} from '@/lib/types/search'
import { logDevError } from '@/lib/dev-log'
import { trackEvent } from '@/lib/eventTracker'
import { ErrorState } from '@/components/ui/error-state'

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
// COMPONENTS
// ============================================

const RecipeResultCard = ({
	recipe,
	onSave,
}: {
	recipe: RecipeResult
	onSave?: (id: string) => void
}) => {
	const [saved, setSaved] = useState(recipe.isSaved)

	const handleSave = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setSaved(!saved)
		onSave?.(recipe.id)
	}

	return (
		<motion.div
			variants={staggerItemVariants}
			whileHover={CARD_FEED_HOVER}
			transition={TRANSITION_SPRING}
		>
			<Link
				href={`/recipes/${recipe.id}`}
				className='group block overflow-hidden rounded-2xl border border-border bg-panel-bg transition-shadow hover:shadow-lg'
			>
				<div className='relative h-44 w-full overflow-hidden'>
					<Image
						src={recipe.imageUrl}
						alt={recipe.title}
						fill
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
							className={cn(
								'flex size-8 flex-shrink-0 items-center justify-center rounded-full transition-colors',
								saved
									? 'bg-primary/10 text-primary'
									: 'text-muted-foreground hover:bg-muted hover:text-primary',
							)}
						>
							<Bookmark className={cn('size-4', saved && 'fill-current')} />
						</motion.button>
					</div>

					<div className='mb-3 flex items-center gap-4 border-b border-border pb-3'>
						{recipe.rating !== undefined && (
							<div className='flex items-center gap-1 text-warning'>
								<Star className='size-3.5 fill-current' />
								<span className='text-caption font-semibold'>
									{recipe.rating.toFixed(1)}
								</span>
							</div>
						)}
						<div className='flex items-center gap-1 text-muted-foreground'>
							<Clock className='size-3.5' />
							<span className='text-caption'>{recipe.cookTime}</span>
						</div>
						<div className='flex items-center gap-1 text-muted-foreground'>
							<Flame className='size-3.5' />
							<span className='text-caption'>{recipe.difficulty}</span>
						</div>
					</div>

					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Image
								src={recipe.author.avatarUrl}
								alt={recipe.author.username}
								width={24}
								height={24}
								className='rounded-full'
							/>
							<span className='text-caption text-muted-foreground'>
								@{recipe.author.username}
							</span>
						</div>
						<span className='text-xs font-semibold text-muted-foreground'>
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

const PersonResultCard = ({
	person,
	onFollow,
}: {
	person: PersonResult
	onFollow?: (id: string) => void
}) => {
	const [following, setFollowing] = useState(person.isFollowing)

	const handleFollow = () => {
		setFollowing(!following)
		trackEvent('USER_FOLLOWED', person.id, 'user', { followed: !following })
		onFollow?.(person.id)
	}

	return (
		<motion.div
			variants={staggerItemVariants}
			className='flex items-center gap-4 rounded-2xl border border-border bg-panel-bg p-4 transition-shadow hover:shadow-md'
		>
			<Image
				src={person.avatarUrl}
				alt={person.displayName}
				width={56}
				height={56}
				className='size-14 flex-shrink-0 rounded-full'
			/>
			<div className='min-w-0 flex-1'>
				<p className='text-base font-bold text-text'>{person.displayName}</p>
				<p className='text-sm text-muted-foreground'>@{person.username}</p>
				<p className='mt-1 truncate text-caption text-muted-foreground'>
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
						? 'border-2 border-border bg-muted text-text hover:border-error hover:bg-error/5 hover:text-error'
						: 'bg-primary text-white',
				)}
			>
				{following ? 'Following' : 'Follow'}
			</motion.button>
		</motion.div>
	)
}

const PostResultCard = ({ post }: { post: PostResult }) => {
	return (
		<motion.div variants={staggerItemVariants}>
			<Link
				href={`/posts/${post.id}`}
				className='group flex gap-3 rounded-2xl border border-border bg-panel-bg p-3 transition-shadow hover:shadow-md'
			>
				<div className='relative size-20 flex-shrink-0 overflow-hidden rounded-xl'>
					<Image
						src={post.imageUrl}
						alt='Post'
						fill
						className='object-cover transition-transform duration-300 group-hover:scale-105'
					/>
				</div>
				<div className='min-w-0 flex-1'>
					<div className='mb-1 flex items-center gap-2'>
						<Image
							src={post.author.avatarUrl}
							alt={post.author.username}
							width={20}
							height={20}
							className='rounded-full'
						/>
						<span className='text-sm font-semibold text-text'>
							@{post.author.username}
						</span>
					</div>
					<p className='line-clamp-2 text-caption text-muted-foreground'>
						{post.caption}
					</p>
					<p className='mt-1 text-xs text-muted-foreground'>
						❤️ {post.likeCount} likes
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
})

const transformPostDoc = (doc: PostSearchDoc): PostResult => ({
	id: doc.id,
	imageUrl: doc.photoUrl || '/placeholder-post.jpg',
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

export default function SearchPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const query = searchParams.get('q') || ''
	const [searchInput, setSearchInput] = useState(query)
	const isInternalNav = useRef(false)
	const [activeTab, setActiveTab] = useState<SearchTab>('recipes')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)
	const [results, setResults] = useState<{
		recipes: RecipeResult[]
		people: PersonResult[]
		posts: PostResult[]
	}>({
		recipes: [],
		people: [],
		posts: [],
	})

	// Update input when URL changes from browser nav (back/forward)
	useEffect(() => {
		if (!isInternalNav.current) {
			setSearchInput(query)
		}
		isInternalNav.current = false
	}, [query])

	const handleSearchInputChange = (value: string) => {
		setSearchInput(value)
		clearTimeout(
			(handleSearchInputChange as { _timer?: ReturnType<typeof setTimeout> })
				._timer,
		)
		;(
			handleSearchInputChange as { _timer?: ReturnType<typeof setTimeout> }
		)._timer = setTimeout(() => {
			isInternalNav.current = true
			const trimmed = value.trim()
			router.replace(
				trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search',
			)
		}, 300)
	}

	// Fetch search results via unified Typesense search
	useEffect(() => {
		const fetchResults = async () => {
			if (!query) return

			setIsLoading(true)
			try {
				const res = await unifiedSearch(query, 'all', 20)

				if (res.success && res.data) {
					const recipes =
						res.data.recipes?.hits?.map(h => transformRecipeDoc(h.document)) ??
						[]
					const people =
						res.data.users?.hits?.map(h => transformUserDoc(h.document)) ?? []
					const posts =
						res.data.posts?.hits?.map(h => transformPostDoc(h.document)) ?? []
					setResults({ recipes, people, posts })
				} else {
					setResults({ recipes: [], people: [], posts: [] })
				}
			} catch (err) {
				logDevError('Search failed:', err)
				setError(true)
			} finally {
				setIsLoading(false)
			}
		}

		fetchResults()
	}, [query, retryKey])

	const totalResults =
		results.recipes.length + results.people.length + results.posts.length

	const tabs = [
		{
			id: 'recipes' as const,
			label: 'Recipes',
			icon: BookOpen,
			count: results.recipes.length,
		},
		{
			id: 'people' as const,
			label: 'People',
			icon: Users,
			count: results.people.length,
		},
		{
			id: 'posts' as const,
			label: 'Posts',
			icon: ImageIcon,
			count: results.posts.length,
		},
	]

	if (error && query) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<ErrorState
						title='Search failed'
						message='We couldn&apos;t complete your search. Please try again.'
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
								className='w-full rounded-2xl border border-border bg-bg-card py-4 pl-12 pr-12 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
							/>
							{searchInput && (
								<button
									onClick={() => handleSearchInputChange('')}
									className='absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text'
									aria-label='Clear search'
								>
									<X className='size-5' />
								</button>
							)}
						</div>
					</div>
					<EmptyStateGamified
						variant='search'
						title='Search ChefKix'
						description='Find recipes, people, and posts'
						primaryAction={{
							label: 'Explore Recipes',
							href: '/explore',
						}}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header - Secondary page pattern with back button */}
				<div className='mb-6'>
					{/* Editable search input - users can refine from within the page */}
					<div className='mb-4 flex items-center gap-3'>
						<button
							onClick={() => router.back()}
							className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
							aria-label='Go back'
						>
							<ArrowLeft className='size-5' />
						</button>
						<div className='relative flex-1'>
							<Search className='pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted' />
							<input
								type='text'
								value={searchInput}
								onChange={e => handleSearchInputChange(e.target.value)}
								placeholder='Search recipes, people, posts...'
								className='w-full rounded-xl border border-border bg-bg-card py-3 pl-12 pr-10 text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
							/>
							{searchInput && (
								<button
									onClick={() => handleSearchInputChange('')}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text'
									aria-label='Clear search'
								>
									<X className='size-4' />
								</button>
							)}
						</div>
					</div>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={TRANSITION_SPRING}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-warm shadow-md'
						>
							<Search className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>
							Results for &quot;{query}&quot;
						</h1>
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						{totalResults} results found
					</p>
				</div>

				{/* Tabs */}
				<div className='mb-8 flex gap-2 overflow-x-auto border-b-2 border-border'>
					{tabs.map(tab => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								'-mb-[2px] flex items-center gap-2 whitespace-nowrap border-b-[3px] px-5 py-3 text-label font-semibold transition-colors',
								activeTab === tab.id
									? 'border-primary text-primary'
									: 'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-text',
							)}
						>
							<tab.icon className='size-4' />
							{tab.label}
							<span
								className={cn(
									'rounded-full px-2 py-0.5 text-xs font-bold',
									activeTab === tab.id
										? 'bg-primary/15 text-primary'
										: 'bg-muted text-muted-foreground',
								)}
							>
								{tab.count}
							</span>
						</button>
					))}
				</div>

				{/* Results */}
				<AnimatePresence mode='wait'>
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
								<EmptyStateGamified
									variant='search'
									title='No recipes found'
									description={`We couldn't find any recipes matching "${query}"`}
									primaryAction={{
										label: 'Explore All',
										href: '/explore',
									}}
								/>
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
								<EmptyStateGamified
									variant='search'
									title='No people found'
									description={`We couldn't find anyone matching "${query}"`}
									primaryAction={{
										label: 'Discover People',
										href: '/discover',
									}}
								/>
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
								<EmptyStateGamified
									variant='search'
									title='No posts found'
									description={`We couldn't find any posts matching "${query}"`}
									primaryAction={{
										label: 'View Feed',
										href: '/dashboard',
									}}
								/>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</PageContainer>
		</PageTransition>
	)
}
