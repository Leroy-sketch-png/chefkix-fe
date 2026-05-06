'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Loader2, MessageSquare, Sparkles } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/ui/error-state'
import { PostCard } from '@/components/social/PostCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { Button } from '@/components/ui/button'
import { getFeedPosts } from '@/services/post'
import { useAuth } from '@/hooks/useAuth'
import { logDevError } from '@/lib/dev-log'

const POSTS_PER_PAGE = 10

type FeedMode = 'latest' | 'trending'

export default function FeedPage() {
	const { user } = useAuth()
	const [feedMode, setFeedMode] = useState<FeedMode>('latest')
	const [posts, setPosts] = useState<import('@/lib/types/post').Post[]>([])
	const [currentPage, setCurrentPage] = useState(0)
	const [hasMore, setHasMore] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)

	useEffect(() => {
		let cancelled = false

		const fetchFeed = async () => {
			setIsLoading(true)
			setError(false)
			setCurrentPage(0)
			try {
				const response = await getFeedPosts({
					page: 0,
					size: POSTS_PER_PAGE,
					mode: feedMode,
				})

				if (cancelled) return

				if (response.success && response.data) {
					const visiblePosts = response.data.filter(
						post => post.postType !== 'GROUP',
					)
					setPosts(visiblePosts)
					if (response.pagination) {
						setHasMore(!response.pagination.last)
					} else {
						setHasMore(visiblePosts.length >= POSTS_PER_PAGE)
					}
					return
				}

				setError(true)
			} catch (err) {
				if (cancelled) return
				logDevError('Failed to load public feed:', err)
				setError(true)
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchFeed()
		return () => {
			cancelled = true
		}
	}, [feedMode, retryKey])

	const handleLoadMore = async () => {
		if (isLoadingMore || !hasMore) return

		const nextPage = currentPage + 1
		setIsLoadingMore(true)
		try {
			const response = await getFeedPosts({
				page: nextPage,
				size: POSTS_PER_PAGE,
				mode: feedMode,
			})

			if (response.success && response.data) {
				const visiblePosts = response.data.filter(
					post => post.postType !== 'GROUP',
				)
				setPosts(prev => {
					const existingIds = new Set(prev.map(post => post.id))
					const nextPosts = visiblePosts.filter(
						post => !existingIds.has(post.id),
					)
					return [...prev, ...nextPosts]
				})
				setCurrentPage(nextPage)
				if (response.pagination) {
					setHasMore(!response.pagination.last)
				} else {
					setHasMore(visiblePosts.length >= POSTS_PER_PAGE)
				}
			}
		} catch (err) {
			logDevError('Failed to load more public feed posts:', err)
			setHasMore(false)
		} finally {
			setIsLoadingMore(false)
		}
	}

	if (error && posts.length === 0) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<ErrorState
						title='Feed unavailable'
						message='We could not load the public feed right now. Try again in a moment.'
						showHomeButton={false}
						onRetry={() => setRetryKey(key => key + 1)}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<AnimatePresence>
				{isLoadingMore && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed left-1/2 top-20 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-2 rounded-full bg-bg-card px-4 py-2 text-sm font-semibold text-brand-text shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
							Loading more posts
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageContainer maxWidth='lg'>
				<PageHeader
					icon={MessageSquare}
					title='Feed'
					subtitle='See what cooks are sharing, rating, and celebrating right now.'
					gradient='pink'
					marginBottom='md'
					showBack
				/>

				<div className='mb-6 flex flex-wrap gap-2'>
					<Button
						type='button'
						variant={feedMode === 'latest' ? 'default' : 'outline'}
						onClick={() => setFeedMode('latest')}
						className='gap-2 rounded-full'
					>
						<Sparkles className='size-4' />
						Latest
					</Button>
					<Button
						type='button'
						variant={feedMode === 'trending' ? 'default' : 'outline'}
						onClick={() => setFeedMode('trending')}
						className='gap-2 rounded-full'
					>
						<Flame className='size-4' />
						Trending
					</Button>
				</div>

				{isLoading ? (
					<div className='space-y-4'>
						<PostCardSkeleton />
						<PostCardSkeleton />
						<PostCardSkeleton />
					</div>
				) : posts.length === 0 ? (
					<div className='rounded-2xl border border-border-subtle bg-bg-card p-6 text-center shadow-card'>
						<div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand'>
							<MessageSquare className='size-6' />
						</div>
						<h2 className='mb-2 text-lg font-bold text-text'>No posts yet</h2>
						<p className='text-sm text-text-secondary'>
							The public feed is quiet right now. Check back soon for fresh
							cooks, tips, and kitchen wins.
						</p>
					</div>
				) : (
					<>
						<div className='space-y-4'>
							{posts.map(post => (
								<PostCard
									key={post.id}
									post={post}
									currentUserId={user?.userId}
								/>
							))}
						</div>

						{hasMore && (
							<div className='mt-6 flex justify-center'>
								<Button
									type='button'
									variant='outline'
									onClick={handleLoadMore}
									disabled={isLoadingMore}
									className='rounded-full'
								>
									{isLoadingMore ? (
										<Loader2 className='size-4 animate-spin' />
									) : null}
									Load more
								</Button>
							</div>
						)}
					</>
				)}

				<div className='pb-24 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
