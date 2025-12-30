'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Post } from '@/lib/types'
import { getFeedPosts } from '@/services/post'
import {
	getPendingSessions,
	SessionHistoryItem,
} from '@/services/cookingSession'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PostCard } from '@/components/social/PostCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { CreatePostForm } from '@/components/social/CreatePostForm'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { Stories } from '@/components/social/Stories'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import {
	Users,
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
import { SinceLastVisitCard } from '@/components/dashboard'
import { useRouter } from 'next/navigation'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

// ============================================
// CONSTANTS
// ============================================

const POSTS_PER_PAGE = 10

// ============================================
// TYPES
// ============================================

type FeedMode = 'latest' | 'trending'

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
		recipeImage: session.coverImageUrl?.[0] || '/placeholder-recipe.jpg',
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
	const [feedMode, setFeedMode] = useState<FeedMode>('latest')
	const [currentPage, setCurrentPage] = useState(0)
	const [hasMore, setHasMore] = useState(true)
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

	// Fetch initial page
	useEffect(() => {
		const fetchInitialData = async () => {
			setIsLoading(true)
			setError(null)
			setCurrentPage(0)
			setPosts([])

			try {
				// Fetch feed posts and pending sessions in parallel
				const [feedResponse, pendingResponse] = await Promise.all([
					getFeedPosts({ page: 0, size: POSTS_PER_PAGE, mode: feedMode }),
					getPendingSessions(),
				])

				if (feedResponse.success && feedResponse.data) {
					let feedPosts = feedResponse.data

					// OPTIMISTIC UPDATE: Check for newly created post with XP
					// This handles the "Two Truths" problem where the FE has the
					// correct XP from linkPostToSession, but the post-service DB
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
							console.error('Failed to parse newPost from sessionStorage:', e)
							sessionStorage.removeItem('newPost')
						}
					}

					setPosts(feedPosts)
					// Use pagination info from backend - check if current page is the last
					if (feedResponse.pagination) {
						setHasMore(
							feedResponse.pagination.currentPage <
								feedResponse.pagination.totalPages - 1,
						)
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
				setError('Failed to load feed')
			} finally {
				setIsLoading(false)
			}
		}

		fetchInitialData()
	}, [feedMode])

	// Load more posts when scrolling
	const loadMorePosts = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setIsLoadingMore(true)
		const nextPage = currentPage + 1

		try {
			const response = await getFeedPosts({
				page: nextPage,
				size: POSTS_PER_PAGE,
				mode: feedMode,
			})

			if (response.success && response.data) {
				setPosts(prev => [...prev, ...response.data!])
				setCurrentPage(nextPage)
				if (response.pagination) {
					setHasMore(
						response.pagination.currentPage <
							response.pagination.totalPages - 1,
					)
				} else {
					setHasMore(response.data.length >= POSTS_PER_PAGE)
				}
			}
		} catch (err) {
			console.error('Failed to load more posts:', err)
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
				{/* Since Last Visit Summary - Welcome back card with activity summary */}
				<SinceLastVisitCard className='mb-4' />
				{/* Resume Cooking Banner - Show when user has an interrupted/paused session */}
				<ResumeCookingBanner className='mb-4' />
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
				<div className='mb-4 md:mb-6 lg:hidden'>
					<Stories variant='horizontal' />
				</div>
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
				<div className='mb-4 flex gap-2'>
					<button
						onClick={() => setFeedMode('latest')}
						className={cn(
							'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
							feedMode === 'latest'
								? 'bg-gradient-brand text-white shadow-md shadow-brand/25'
								: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text',
						)}
					>
						<Clock className='size-4' />
						Latest
					</button>
					<button
						onClick={() => setFeedMode('trending')}
						className={cn(
							'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
							feedMode === 'trending'
								? 'bg-gradient-brand text-white shadow-md shadow-brand/25'
								: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text',
						)}
					>
						<TrendingUp className='size-4' />
						Trending
					</button>
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
						onRetry={() => window.location.reload()}
					/>
				)}
				{!isLoading && !error && filteredPosts.length === 0 && (
					<EmptyStateGamified
						variant='feed'
						title='Your feed is empty'
						description='Follow chefs to see their latest posts here!'
						primaryAction={{
							label: 'Discover People',
							href: '/discover',
							icon: <Users className='h-4 w-4' />,
						}}
						secondaryActions={[
							{
								label: 'Explore Posts',
								href: '/explore',
								icon: <MessageSquare className='h-4 w-4' />,
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
								{filteredPosts.map(post => (
									<PostCard
										key={post.id}
										post={post}
										onUpdate={handlePostUpdate}
										onDelete={handlePostDelete}
										currentUserId={user?.userId}
									/>
								))}
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
