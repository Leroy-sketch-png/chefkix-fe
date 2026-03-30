'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Post } from '@/lib/types'
import { getFeedPosts, getFollowingFeedPosts } from '@/services/post'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PostCard } from '@/components/social/PostCard'
import { PollCard } from '@/components/social/PollCard'
import { RecentCookCard } from '@/components/social/RecentCookCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { CreatePostForm } from '@/components/social/CreatePostForm'
import { QuickPostFAB } from '@/components/social/QuickPostFAB'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import {
	Newspaper,
	Users2,
	TrendingUp,
	Sparkles,
	Users,
	MessageSquare,
	Loader2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFilterBlockedContent } from '@/hooks/useBlockedUsers'
import { usePostKeyboardNav } from '@/hooks/usePostKeyboardNav'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'

// ============================================
// CONSTANTS
// ============================================

const POSTS_PER_PAGE = 15

// ============================================
// TYPES
// ============================================

type FeedTab = 'forYou' | 'following' | 'trending'

// ============================================
// PAGE
// ============================================

export default function FeedPage() {
	const { user } = useAuth()
	const [posts, setPosts] = useState<Post[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<FeedTab>('forYou')
	const [currentPage, setCurrentPage] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [retryCount, setRetryCount] = useState(0)
	const loadMoreRef = useRef<HTMLDivElement>(null)

	// Filter out posts from blocked users AND group posts (Facebook pattern)
	const filteredPosts = useFilterBlockedContent(posts).filter(
		post => post.postType !== 'GROUP',
	)

	// j/k keyboard navigation for posts
	const { focusedIndex: focusedPostIndex } = usePostKeyboardNav(filteredPosts)

	// Fetch initial page when tab changes
	useEffect(() => {
		const fetchPosts = async () => {
			setIsLoading(true)
			setError(null)
			setCurrentPage(0)
			setPosts([])

			try {
				const fetchByTab = {
					forYou: () =>
						getFeedPosts({ page: 0, size: POSTS_PER_PAGE, mode: 'forYou' }),
					following: () =>
						getFollowingFeedPosts({
							page: 0,
							size: POSTS_PER_PAGE,
							mode: 'latest',
						}),
					trending: () =>
						getFeedPosts({ page: 0, size: POSTS_PER_PAGE, mode: 'trending' }),
				}
				const response = await fetchByTab[activeTab]()

				if (response.success && response.data) {
					setPosts(response.data)
					if (response.pagination) {
						setHasMore(!response.pagination.last)
					} else {
						setHasMore(response.data.length >= POSTS_PER_PAGE)
					}
				}
			} catch (error) {
				logDevError('Failed to load feed:', error)
				setError('Failed to load feed')
			} finally {
				setIsLoading(false)
			}
		}

		fetchPosts()
	}, [activeTab, retryCount])

	// Load more posts on scroll
	const loadMorePosts = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setIsLoadingMore(true)
		const nextPage = currentPage + 1

		try {
			const fetchByTab = {
				forYou: () =>
					getFeedPosts({
						page: nextPage,
						size: POSTS_PER_PAGE,
						mode: 'forYou',
					}),
				following: () =>
					getFollowingFeedPosts({
						page: nextPage,
						size: POSTS_PER_PAGE,
						mode: 'latest',
					}),
				trending: () =>
					getFeedPosts({
						page: nextPage,
						size: POSTS_PER_PAGE,
						mode: 'trending',
					}),
			}
			const response = await fetchByTab[activeTab]()

			if (response.success && response.data) {
				setPosts(prev => {
					const existingIds = new Set(prev.map(p => p.id))
					const newPosts = response.data!.filter(p => !existingIds.has(p.id))
					return [...prev, ...newPosts]
				})
				setCurrentPage(nextPage)
				if (response.pagination) {
					setHasMore(!response.pagination.last)
				} else {
					setHasMore(response.data.length >= POSTS_PER_PAGE)
				}
			}
		} catch (err) {
			logDevError('Failed to load more posts:', err)
			toast.error('Failed to load more posts')
			setHasMore(false)
		} finally {
			setIsLoadingMore(false)
		}
	}, [isLoadingMore, hasMore, currentPage, activeTab])

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
				{/* Header */}
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
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-social shadow-card shadow-primary/25'
						>
							<Newspaper className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold leading-tight text-text'>Feed</h1>
					</div>
					<p className='flex items-center gap-2 leading-normal text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						See what the community is cooking
					</p>
				</motion.div>

				{/* Tabs */}
				<div className='mb-4 flex gap-2'>
					{(
						[
							{ key: 'forYou' as FeedTab, label: 'For You', icon: Sparkles },
							{ key: 'following' as FeedTab, label: 'Following', icon: Users2 },
							{
								key: 'trending' as FeedTab,
								label: 'Trending',
								icon: TrendingUp,
							},
						] as const
					).map(tab => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key)}
							className={cn(
								'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
								activeTab === tab.key
									? 'bg-gradient-brand text-white shadow-card shadow-brand/25'
									: 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text',
							)}
						>
							<tab.icon className='size-4' />
							{tab.label}
						</button>
					))}
				</div>

				{/* Create Post */}
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

				{/* Loading State */}
				{isLoading && (
					<div className='space-y-4 md:space-y-6'>
						<PostCardSkeleton count={3} showImages={false} />
					</div>
				)}

				{/* Error State */}
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

				{/* Empty State — Following */}
				{!isLoading &&
					!error &&
					filteredPosts.length === 0 &&
					activeTab === 'following' && (
						<EmptyStateGamified
							variant='feed'
							title='Your following feed is empty'
							description='Follow creators to see their cooking posts here!'
							primaryAction={{
								label: 'Discover Creators',
								href: '/community',
								icon: <Users className='size-4' />,
							}}
						/>
					)}

				{/* Empty State — For You */}
				{!isLoading &&
					!error &&
					filteredPosts.length === 0 &&
					activeTab === 'forYou' && (
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

				{/* Empty State — Trending */}
				{!isLoading &&
					!error &&
					filteredPosts.length === 0 &&
					activeTab === 'trending' && (
						<EmptyStateGamified
							variant='feed'
							title='No posts yet'
							description='Be the first to cook something and share it with the community!'
							primaryAction={{
								label: 'Explore Recipes',
								href: '/explore',
								icon: <MessageSquare className='size-4' />,
							}}
						/>
					)}

				{/* Posts */}
				{!isLoading && !error && filteredPosts.length > 0 && (
					<>
						<StaggerContainer className='space-y-4 md:space-y-6'>
							<AnimatePresence mode='popLayout'>
								{filteredPosts.map((post, i) => (
									<div
										key={post.id}
										data-post-index={i}
										className={cn(
											'rounded-2xl transition-shadow',
											focusedPostIndex === i &&
												'ring-2 ring-brand/50 shadow-warm',
										)}
									>
										{post.postType === 'POLL' ? (
											<PollCard
												post={post}
												onUpdate={handlePostUpdate}
												currentUserId={user?.userId}
											/>
										) : post.postType === 'RECENT_COOK' ? (
											<RecentCookCard post={post} />
										) : (
											<PostCard
												post={post}
												onUpdate={handlePostUpdate}
												onDelete={handlePostDelete}
												currentUserId={user?.userId}
											/>
										)}
									</div>
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

			{/* Quick Post FAB */}
			<QuickPostFAB onPostCreated={handlePostCreated} />
		</PageTransition>
	)
}
