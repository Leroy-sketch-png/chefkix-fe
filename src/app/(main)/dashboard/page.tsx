'use client'

import { useEffect, useState } from 'react'
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
import { Users, MessageSquare, Home, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { AnimatePresence } from 'framer-motion'
import { StreakRiskBanner } from '@/components/streak'
import { PendingPostsSection, type PendingSession } from '@/components/pending'
import { useRouter } from 'next/navigation'
import { TRANSITION_SPRING } from '@/lib/motion'

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
	const [error, setError] = useState<string | null>(null)
	const [showStreakBanner, setShowStreakBanner] = useState(true)
	const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([])

	// TODO: Fetch streak status from API - check if user has cooked today
	const hasStreakAtRisk =
		user?.statistics?.streakCount && user.statistics.streakCount > 0
	const hoursUntilMidnight = 24 - new Date().getHours()
	const isUrgent = hoursUntilMidnight <= 2

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true)
			setError(null)

			try {
				// Fetch feed posts and pending sessions in parallel
				const [feedResponse, pendingResponse] = await Promise.all([
					getFeedPosts({ limit: 20 }),
					getPendingSessions(),
				])

				if (feedResponse.success && feedResponse.data) {
					setPosts(feedResponse.data)
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

		fetchData()
	}, [])

	const handlePostCreated = (newPost: Post) => {
		setPosts(prev => (Array.isArray(prev) ? [newPost, ...prev] : [newPost]))
		// Dismiss streak banner when user creates a post (cooking activity)
		setShowStreakBanner(false)
	}

	const handlePostFromPending = (sessionId: string) => {
		// Navigate to composer with pre-filled session data
		router.push(`/create?session=${sessionId}`)
		// In production, remove from pending after successful post
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
				{/* Streak Risk Banner - Show when user has a streak but hasn't cooked today */}
				{hasStreakAtRisk && showStreakBanner && (
					<StreakRiskBanner
						currentStreak={user.statistics?.streakCount ?? 0}
						timeRemaining={{ hours: hoursUntilMidnight, minutes: 0 }}
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
						onViewAll={() => router.push('/settings?tab=cooking-history')}
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
						Share your culinary journey and see what your friends are cooking
					</p>
				</motion.div>
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
				{!isLoading && !error && posts.length === 0 && (
					<EmptyStateGamified
						variant='feed'
						title='Your feed is empty'
						description='Follow chefs and add friends to see their latest posts here!'
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
				{!isLoading && !error && posts.length > 0 && (
					<StaggerContainer className='space-y-4 md:space-y-6'>
						<AnimatePresence mode='popLayout'>
							{posts.map(post => (
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
				)}
			</PageContainer>
		</PageTransition>
	)
}
