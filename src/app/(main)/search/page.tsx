'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { getAllRecipes } from '@/services/recipe'
import { getAllProfiles } from '@/services/profile'
import { getFeedPosts } from '@/services/post'
import { Recipe, Profile, Post } from '@/lib/types'

// ============================================
// TYPES
// ============================================

type SearchTab = 'recipes' | 'people' | 'posts'

interface RecipeResult {
	id: string
	title: string
	imageUrl: string
	rating: number
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
						<div className='flex items-center gap-1 text-amber-500'>
							<Star className='size-3.5 fill-current' />
							<span className='text-[13px] font-semibold'>{recipe.rating}</span>
						</div>
						<div className='flex items-center gap-1 text-muted-foreground'>
							<Clock className='size-3.5' />
							<span className='text-[13px]'>{recipe.cookTime}</span>
						</div>
						<div className='flex items-center gap-1 text-muted-foreground'>
							<Flame className='size-3.5' />
							<span className='text-[13px]'>{recipe.difficulty}</span>
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
							<span className='text-[13px] text-muted-foreground'>
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
				<p className='mt-1 truncate text-[13px] text-muted-foreground'>
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
						? 'border-2 border-border bg-muted text-text hover:border-red-500 hover:bg-red-50 hover:text-red-500'
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
					<p className='line-clamp-2 text-[13px] text-muted-foreground'>
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

const transformRecipe = (recipe: Recipe): RecipeResult => ({
	id: recipe.id,
	title: recipe.title,
	imageUrl: recipe.imageUrl || '/placeholder-recipe.jpg',
	rating: 4.5, // TODO: Add rating to Recipe type when backend supports
	cookTime: `${recipe.prepTime + recipe.cookTime} min`,
	difficulty: difficultyToDisplay(recipe.difficulty),
	author: {
		username: recipe.author?.username || 'chef',
		avatarUrl: recipe.author?.avatarUrl || '/placeholder-avatar.png',
	},
	cookCount: recipe.cookCount || 0,
	isSaved: recipe.isSaved,
})

const transformProfile = (profile: Profile): PersonResult => ({
	id: profile.userId,
	displayName: profile.displayName || profile.username,
	username: profile.username,
	avatarUrl: profile.avatarUrl || '/placeholder-avatar.png',
	bio: profile.bio || '',
	isFollowing: profile.isFollowing,
})

const transformPost = (post: Post): PostResult => ({
	id: post.id,
	imageUrl: post.photoUrls?.[0] || post.photoUrl || '/placeholder-post.jpg',
	caption: post.content || '',
	author: {
		username: post.displayName || 'user',
		avatarUrl: post.avatarUrl || '/placeholder-avatar.png',
	},
	likeCount: post.likes || 0,
	recipeId: undefined, // Post type doesn't have recipeId field
})

// ============================================
// PAGE
// ============================================

export default function SearchPage() {
	const searchParams = useSearchParams()
	const query = searchParams.get('q') || ''
	const [activeTab, setActiveTab] = useState<SearchTab>('recipes')
	const [isLoading, setIsLoading] = useState(false)
	const [results, setResults] = useState<{
		recipes: RecipeResult[]
		people: PersonResult[]
		posts: PostResult[]
	}>({
		recipes: [],
		people: [],
		posts: [],
	})

	// Fetch search results when query changes
	useEffect(() => {
		const fetchResults = async () => {
			if (!query) return

			setIsLoading(true)
			try {
				// Fetch all result types in parallel
				// TODO: Replace with actual search endpoints when available
				const [recipesRes, profilesRes, postsRes] = await Promise.all([
					getAllRecipes(), // TODO: Add search param when endpoint supports
					getAllProfiles(),
					getFeedPosts({ limit: 20 }),
				])

				// Filter results client-side for now (until search endpoint exists)
				const queryLower = query.toLowerCase()

				const recipes =
					recipesRes.success && recipesRes.data
						? recipesRes.data
								.filter(r => r.title.toLowerCase().includes(queryLower))
								.map(transformRecipe)
						: []

				const people =
					profilesRes.success && profilesRes.data
						? profilesRes.data
								.filter(
									p =>
										p.username.toLowerCase().includes(queryLower) ||
										p.displayName?.toLowerCase().includes(queryLower),
								)
								.map(transformProfile)
						: []

				const posts =
					postsRes.success && postsRes.data
						? postsRes.data
								.filter(p => p.content?.toLowerCase().includes(queryLower))
								.map(transformPost)
						: []

				setResults({ recipes, people, posts })
			} catch (err) {
				console.error('Search failed:', err)
			} finally {
				setIsLoading(false)
			}
		}

		fetchResults()
	}, [query])

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

	if (!query) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='py-20'>
						<EmptyStateGamified
							variant='search'
							title='Search Chefkix'
							description='Find recipes, people, and posts'
							primaryAction={{
								label: 'Explore Recipes',
								href: '/explore',
							}}
						/>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header */}
				<div className='mb-6'>
					<h1 className='mb-2 text-2xl font-extrabold text-text md:text-3xl'>
						Results for &quot;{query}&quot;
					</h1>
					<p className='text-sm text-muted-foreground'>
						{totalResults} results
					</p>
				</div>

				{/* Tabs */}
				<div className='mb-8 flex gap-2 overflow-x-auto border-b-2 border-border'>
					{tabs.map(tab => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								'-mb-[2px] flex items-center gap-2 whitespace-nowrap border-b-[3px] px-5 py-3 text-[15px] font-semibold transition-colors',
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
