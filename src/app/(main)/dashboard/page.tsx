'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Post } from '@/lib/types'
import { getFeedPosts, getFollowingFeedPosts } from '@/services/post'
import {
	getPendingSessions,
	linkPostToSession,
	SessionHistoryItem,
} from '@/services/cookingSession'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PostCard } from '@/components/social/PostCard'
import { PollCard } from '@/components/social/PollCard'
import { RecentCookCard } from '@/components/social/RecentCookCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { CreatePostForm } from '@/components/social/CreatePostForm'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import {
	Users,
	Users2,
	MessageSquare,
	Home,
	Sparkles,
	TrendingUp,
	Clock,
	Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useFilterBlockedContent } from '@/hooks/useBlockedUsers'
import { AnimatePresence } from 'framer-motion'
import { StreakRiskBanner } from '@/components/streak'
import { PendingPostsSection, type PendingSession } from '@/components/pending'
import { ResumeCookingBanner } from '@/components/cooking'
import { FriendsCookingNow } from '@/components/cooking'
import { SinceLastVisitCard } from '@/components/dashboard'
import { TonightsPick } from '@/components/dashboard'
import { useRouter } from 'next/navigation'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'

// ============================================
// CONSTANTS
// ============================================

const POSTS_PER_PAGE = 10

// ============================================
// TYPES
// ============================================

type FeedMode = 'forYou' | 'latest' | 'trending' | 'following'

interface PendingPostLink {
	sessionId: string
	postId: string
	createdAt: string
}

const PENDING_POST_LINK_KEY = 'pendingPostLink'

// ============================================
// HELPERS
// ============================================

/**
 * Calculate pending status based on days remaining
 */
const getPendingStatus = (
	daysRemaining: number,
): 'urgent' | 'warning' | 'normal' | 'expired' => {
	if (daysRemaining <= 0) return 'expired'
	if (daysRemaining <= 2) return 'urgent'
	if (daysRemaining <= 5) return 'warning'
	return 'normal'
}

/**
 * Transform SessionHistoryItem to PendingSession format for UI component
 */
const transformToPendingSession = (
	session: SessionHistoryItem,
): PendingSession => {
	const daysRemaining = session.daysRemaining ?? 14
	const cookedAt = new Date(session.completedAt || session.startedAt)
	// Calculate expiresAt: postDeadline from API or 14 days from completion
	const expiresAt = session.postDeadline
		? new Date(session.postDeadline)
		: new Date(cookedAt.getTime() + 14 * 24 * 60 * 60 * 1000)

	return {
		id: session.sessionId,
		recipeId: session.recipeId,
		recipeName: session.recipeTitle,
		recipeImage: session.coverImageUrl?.[0] || '/placeholder-recipe.svg',
		cookedAt,
		duration: 0, // API doesn't provide cook duration
		baseXP: session.baseXpAwarded || 0,
		currentXP: session.pendingXp || 0,
		expiresAt,
		status: getPendingStatus(daysRemaining),
		postId: session.postId || undefined,
	}
}

// ============================================
// PAGE
// ============================================

export default function DashboardPage() {
	const { user } = useAuth()
	const router = useRouter()
	const [posts, setPosts] = useState<Post[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [showStreakBanner, setShowStreakBanner] = useState(true)
	const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([])
	const [feedMode, setFeedMode] = useState<FeedMode>('forYou')
	const [currentPage, setCurrentPage] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [hasPendingXpSync, setHasPendingXpSync] = useState(false)
	const [isRetryingPendingXp, setIsRetryingPendingXp] = useState(false)
	const [retryCount, setRetryCount] = useState(0)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	// Filter out posts from blocked users
	const filteredPosts = useFilterBlockedContent(posts)

	// Streak at risk = has active streak AND hasn't cooked within window
	// Backend computes cookedToday (within 72h window) and hoursUntilStreakBreaks
	const stats = user?.statistics
	const hasActiveStreak = (stats?.streakCount ?? 0) > 0
	const hasStreakAtRisk = hasActiveStreak && !stats?.cookedToday
	const hoursUntilBreak = stats?.hoursUntilStreakBreaks ?? 0
	const isUrgent =
		hasStreakAtRisk && hoursUntilBreak > 0 && hoursUntilBreak <= 2

	const retryPendingXpSync = useCallback(async (): Promise<boolean> => {
		const pendingPostLinkJson = sessionStorage.getItem(PENDING_POST_LINK_KEY)
		if (!pendingPostLinkJson) {
			setHasPendingXpSync(false)
			return true
		}

		try {
			const pendingPostLink = JSON.parse(pendingPostLinkJson) as PendingPostLink
			const linkResponse = await linkPostToSession(
				pendingPostLink.sessionId,
				pendingPostLink.postId,
			)

			if (linkResponse.success && linkResponse.data) {
				sessionStorage.removeItem(PENDING_POST_LINK_KEY)
				setHasPendingXpSync(false)

				const newPostJson = sessionStorage.getItem('newPost')
				if (newPostJson) {
					try {
						const newPost = JSON.parse(newPostJson) as Post
						sessionStorage.setItem(
							'newPost',
							JSON.stringify({
								...newPost,
								xpEarned: linkResponse.data.xpAwarded ?? 0,
								badgesEarned: linkResponse.data.badgesEarned ?? [],
							}),
						)
					} catch (e) {
						logDevError('Failed to update recovered newPost payload:', e)
					}
				}

				return true
			}

			logDevError('Pending post XP claim retry failed:', linkResponse.message)
			setHasPendingXpSync(true)
			return false
		} catch (e) {
			logDevError('Failed to process pending post link retry:', e)
			setHasPendingXpSync(true)
			return false
		}
	}, [])

	// Fetch initial page
	useEffect(() => {
		const fetchInitialData = async () => {
			setIsLoading(true)
			setError(null)
			setCurrentPage(0)
			setPosts([])

			try {
				const pendingPostLinkJson = sessionStorage.getItem(
					PENDING_POST_LINK_KEY,
				)
				setHasPendingXpSync(Boolean(pendingPostLinkJson))
				if (pendingPostLinkJson) {
					const recovered = await retryPendingXpSync()
					if (!recovered) {
						toast.warning(
							'Your post was shared, but XP is still syncing. You can retry from the banner on this page.',
						)
					}
				}

				// Fetch feed posts and pending sessions in parallel
				const [feedResponse, pendingResponse] = await Promise.all([
					feedMode === 'following'
						? getFollowingFeedPosts({
								page: 0,
								size: POSTS_PER_PAGE,
								mode: 'latest',
							})
						: getFeedPosts({ page: 0, size: POSTS_PER_PAGE, mode: feedMode }),
					getPendingSessions(),
				])

				if (feedResponse.success && feedResponse.data) {
					let feedPosts = feedResponse.data

					// Filter to only show PERSONAL posts (not GROUP posts)
					feedPosts = feedPosts.filter(post => post.postType !== 'GROUP')

					// OPTIMISTIC UPDATE: Check for newly created post with XP
					// This handles the "Two Truths" problem where the FE has the
					// correct XP from linkPostToSession, but the social module DB
					// hasn't been updated yet by the Kafka consumer.
					const newPostJson = sessionStorage.getItem('newPost')
					if (newPostJson) {
						try {
							const newPost = JSON.parse(newPostJson) as Post
							// Remove from sessionStorage immediately (one-time use)
							sessionStorage.removeItem('newPost')
							// Prepend to feed if not already present
							const exists = feedPosts.some(p => p.id === newPost.id)
							if (!exists) {
								feedPosts = [newPost, ...feedPosts]
							} else {
								// Post exists but may have stale xpEarned - update it
								feedPosts = feedPosts.map(p =>
									p.id === newPost.id
										? { ...p, xpEarned: newPost.xpEarned }
										: p,
								)
							}
						} catch (e) {
							logDevError('Failed to parse newPost from sessionStorage:', e)
							sessionStorage.removeItem('newPost')
						}
					}

					setPosts(feedPosts)
					// Use pagination info from backend - check if current page is the last
					if (feedResponse.pagination) {
						setHasMore(!feedResponse.pagination.last)
					} else {
						setHasMore(feedPosts.length >= POSTS_PER_PAGE)
					}
				}

				if (pendingResponse.success && pendingResponse.data) {
					setPendingSessions(
						pendingResponse.data.map(transformToPendingSession),
					)
				}
			} catch (err) {
				logDevError('Failed to load dashboard feed:', err)
				setError('Failed to load feed')
			} finally {
				setIsLoading(false)
			}
		}

		fetchInitialData()
	}, [feedMode, retryPendingXpSync, retryCount])

	const handleRetryPendingXpSync = async () => {
		setIsRetryingPendingXp(true)
		const recovered = await retryPendingXpSync()
		if (recovered) {
			toast.success('XP sync completed successfully.')
		} else {
			toast.error('Still syncing XP. Please try again in a moment.')
		}
		setIsRetryingPendingXp(false)
	}

	// Load more posts when scrolling
	const loadMorePosts = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setIsLoadingMore(true)
		const nextPage = currentPage + 1

		try {
			const response =
				feedMode === 'following'
					? await getFollowingFeedPosts({
							page: nextPage,
							size: POSTS_PER_PAGE,
							mode: 'latest',
						})
					: await getFeedPosts({
							page: nextPage,
							size: POSTS_PER_PAGE,
							mode: feedMode,
						})

			if (response.success && response.data) {
				// Filter to only show PERSONAL posts (not GROUP posts)
				const filteredPosts = response.data.filter(post => post.postType !== 'GROUP')
				setPosts(prev => [...prev, ...filteredPosts])
				setCurrentPage(nextPage)
				if (response.pagination) {
					setHasMore(!response.pagination.last)
				} else {
					setHasMore(filteredPosts.length >= POSTS_PER_PAGE)
				}
			}
		} catch (err) {
			logDevError('Failed to load more posts:', err)
		} finally {
			setIsLoadingMore(false)
		}
	}, [isLoadingMore, hasMore, currentPage, feedMode])

	// Intersection Observer for infinite scroll
	useEffect(() => {
		const observer = new IntersectionObserver(
			entries => {
				if (
					entries[0].isIntersecting &&
					hasMore &&
					!isLoadingMore &&
					!isLoading
				) {
					loadMorePosts()
				}
			},
			{ threshold: 0.1, rootMargin: '100px' },
		)

		if (loadMoreRef.current) {
			observer.observe(loadMoreRef.current)
		}

		return () => observer.disconnect()
	}, [hasMore, isLoadingMore, isLoading, loadMorePosts])

	const handlePostCreated = (newPost: Post) => {
		setPosts(prev => (Array.isArray(prev) ? [newPost, ...prev] : [newPost]))
		// Dismiss streak banner when user creates a post (cooking activity)
		setShowStreakBanner(false)
	}

	const handlePostFromPending = (sessionId: string) => {
		// Navigate to dedicated post composer with session context for XP unlock
		router.push(`/post/new?session=${sessionId}`)
	}

	const handleDismissPending = () => {
		// Optionally hide pending section temporarily
		setPendingSessions([])
	}

	const handlePostUpdate = (updatedPost: Post) => {
		setPosts(prev =>
			Array.isArray(prev)
				? prev.map(p => (p.id === updatedPost.id ? updatedPost : p))
				: [],
		)
	}

	const handlePostDelete = (postId: string) => {
		setPosts(prev =>
			Array.isArray(prev) ? prev.filter(p => p.id !== postId) : [],
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Tonight's Pick — hero recipe suggestion */}
				<TonightsPick className='mb-4' />
				{/* Since Last Visit Summary - Welcome back card with activity summary */}
				<SinceLastVisitCard className='mb-4' />
				{hasPendingXpSync && (
					<div className='mb-4 rounded-xl border border-warning/30 bg-warning/10 p-4'>
						<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
							<div>
								<p className='text-sm font-semibold text-warning'>
									XP Sync Pending
								</p>
								<p className='text-sm text-text-secondary'>
									Your post is published, but XP confirmation is still pending.
								</p>
							</div>
							<Button
								onClick={handleRetryPendingXpSync}
								disabled={isRetryingPendingXp}
								className='sm:w-auto'
							>
								{isRetryingPendingXp ? 'Retrying...' : 'Retry XP Sync'}
							</Button>
						</div>
					</div>
				)}
				{/* Resume Cooking Banner - Show when user has an interrupted/paused session */}
				<ResumeCookingBanner className='mb-4' />
				{/* Friends Cooking Now — live activity from followed users' rooms */}
				<FriendsCookingNow className='mb-4' />
				{/* Streak Risk Banner - Show when user has a streak but hasn't cooked within window */}
				{hasStreakAtRisk && showStreakBanner && (
					<StreakRiskBanner
						currentStreak={stats?.streakCount ?? 0}
						timeRemaining={{ hours: hoursUntilBreak, minutes: 0 }}
						isUrgent={isUrgent}
						onQuickCook={() => router.push('/explore')}
						onDismiss={() => setShowStreakBanner(false)}
						className='mb-4'
					/>
				)}
				{/* Pending Posts Section - Show when user has cooked but not posted */}
				{pendingSessions.length > 0 && (
					<PendingPostsSection
						sessions={pendingSessions}
						onPost={handlePostFromPending}
						onDismiss={handleDismissPending}
						onViewAll={() => router.push(`/${user?.userId}?tab=cooking`)}
						className='mb-4'
					/>
				)}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-6'
				>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, ...TRANSITION_SPRING }}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-hero shadow-md shadow-brand/25'
						>
							<Home className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold leading-tight text-text'>
							Your Feed
						</h1>
					</div>
					<p className='flex items-center gap-2 leading-normal text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						Share your culinary journey and see what people you follow are
						cooking
					</p>
				</motion.div>
				{/* Feed Mode Tabs */}
				<div className='mb-4 flex gap-2 overflow-x-auto scrollbar-none'>
					{([
						{ key: 'forYou' as FeedMode, label: 'For You', icon: Sparkles },
						{ key: 'trending' as FeedMode, label: 'Trending', icon: TrendingUp },
						{ key: 'following' as FeedMode, label: 'Following', icon: Users2 },
						{ key: 'latest' as FeedMode, label: 'Latest', icon: Clock },
					] as const).map(tab => (
						<button
							key={tab.key}
							onClick={() => setFeedMode(tab.key)}
							className={cn(
								'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
								feedMode === tab.key
									? 'bg-gradient-brand text-white shadow-md shadow-brand/25'
									: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text',
							)}
						>
							<tab.icon className='size-4' />
							{tab.label}
						</button>
					))}
				</div>
				{/* Create Post Form */}
				<div className='mb-4 md:mb-6'>
					<CreatePostForm
						onPostCreated={handlePostCreated}
						currentUser={
							user
								? {
										userId: user.userId ?? '',
										displayName: user.displayName || user.username || 'User',
										avatarUrl: user.avatarUrl,
									}
								: undefined
						}
					/>
				</div>
				{/* Content */}
				{isLoading && (
					<div className='space-y-4 md:space-y-6'>
						<PostCardSkeleton count={3} showImages={false} />
					</div>
				)}{' '}
				{error && (
					<ErrorState
						title='Failed to load feed'
						message={error}
						onRetry={() => {
							setError(null)
							setRetryCount(c => c + 1)
						}}
					/>
				)}
				{!isLoading &&
					!error &&
					filteredPosts.length === 0 &&
					feedMode === 'following' && (
						<EmptyStateGamified
							variant='feed'
							title='Your following feed is empty'
							description='Follow people to see their posts here!'
							primaryAction={{
								label: 'Discover People',
								href: '/community',
								icon: <Users className='h-4 w-4' />,
							}}
						/>
					)}
				{!isLoading &&
					!error &&
					filteredPosts.length === 0 &&
					feedMode === 'forYou' && (
						<EmptyStateGamified
							variant='feed'
							title='Your personalized feed is warming up'
							description='Like and save posts to teach the algorithm your taste. The more you interact, the better your feed gets!'
							primaryAction={{
								label: 'Explore Trending',
								href: '/feed',
								icon: <TrendingUp className='size-4' />,
							}}
						/>
					)}
				{!isLoading &&
					!error &&
					filteredPosts.length === 0 &&
					feedMode !== 'following' &&
					feedMode !== 'forYou' && (
						<EmptyStateGamified
							variant='feed'
							title='Your feed is empty'
							description='Follow chefs to see their latest posts here!'
							primaryAction={{
								label: 'Discover People',
								href: '/discover',
								icon: <Users className='size-4' />,
							}}
							secondaryActions={[
								{
									label: 'Explore Posts',
									href: '/explore',
									icon: <MessageSquare className='size-4' />,
								},
							]}
							fomoStats={[
								{ label: 'Recipes posted today', value: '1,234' },
								{ label: 'Active chefs', value: '567' },
							]}
						/>
					)}
				{!isLoading && !error && filteredPosts.length > 0 && (
					<>
						<StaggerContainer className='space-y-4 md:space-y-6'>
							<AnimatePresence mode='popLayout'>
							{filteredPosts.map(post =>
								post.postType === 'POLL' ? (
									<PollCard
										key={post.id}
										post={post}
										onUpdate={handlePostUpdate}
										currentUserId={user?.userId}
									/>
								) : post.postType === 'RECENT_COOK' ? (
									<RecentCookCard key={post.id} post={post} />
								) : (
									<PostCard
										key={post.id}
										post={post}
										onUpdate={handlePostUpdate}
										onDelete={handlePostDelete}
										currentUserId={user?.userId}
									/>
								),
							)}
							</AnimatePresence>
						</StaggerContainer>

						{/* Infinite scroll trigger */}
						<div ref={loadMoreRef} className='flex justify-center py-8'>
							{isLoadingMore && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className='flex items-center gap-2 text-text-secondary'
								>
									<Loader2 className='size-5 animate-spin text-brand' />
									<span className='text-sm font-medium'>
										Loading more posts...
									</span>
								</motion.div>
							)}
							{!hasMore && filteredPosts.length > POSTS_PER_PAGE && (
								<p className='text-sm text-text-muted'>
									You&apos;ve reached the end of the feed
								</p>
							)}
						</div>
					</>
				)}
			</PageContainer>
		</PageTransition>
	)
}
