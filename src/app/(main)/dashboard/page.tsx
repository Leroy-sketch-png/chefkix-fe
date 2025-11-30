'use client'

import { useEffect, useState } from 'react'
import { Post } from '@/lib/types'
import { getFeedPosts } from '@/services/post'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PostCard } from '@/components/social/PostCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { CreatePostForm } from '@/components/social/CreatePostForm'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { Stories } from '@/components/social/Stories'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { AnimatePresence } from 'framer-motion'
import { StreakRiskBanner } from '@/components/streak'
import { PendingPostsSection, type PendingSession } from '@/components/pending'
import { useRouter } from 'next/navigation'

// Mock pending sessions - in production, fetch from backend
const mockPendingSessions: PendingSession[] = [
	{
		id: 'pending-1',
		recipeId: 'recipe-1',
		recipeName: 'Spicy Tomato Ramen',
		recipeImage: 'https://i.imgur.com/v8SjYfT.jpeg',
		cookedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
		duration: 35,
		baseXP: 50,
		currentXP: 50,
		expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours left
		status: 'normal',
	},
]

export default function DashboardPage() {
	const { user } = useAuth()
	const router = useRouter()
	const [posts, setPosts] = useState<Post[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showStreakBanner, setShowStreakBanner] = useState(true)
	const [pendingSessions, setPendingSessions] =
		useState<PendingSession[]>(mockPendingSessions)

	// Mock streak risk data - in production, derive from user.statistics
	const hasStreakAtRisk =
		user?.statistics?.streakCount && user.statistics.streakCount > 0
	const hoursUntilMidnight = 24 - new Date().getHours()
	const isUrgent = hoursUntilMidnight <= 2

	useEffect(() => {
		const fetchFeed = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await getFeedPosts({ limit: 20 })
				if (response.success && response.data) {
					setPosts(response.data)
				}
			} catch (err) {
				setError('Failed to load feed')
			} finally {
				setIsLoading(false)
			}
		}

		fetchFeed()
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
				<div className='mb-4 md:mb-6'>
					<h1 className='mb-2 text-3xl font-bold leading-tight text-text-primary'>
						Your Feed
					</h1>
					<p className='leading-normal text-text-secondary'>
						Share your culinary journey and see what your friends are cooking
					</p>
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
