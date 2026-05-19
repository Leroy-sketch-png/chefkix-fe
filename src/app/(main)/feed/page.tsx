'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Loader2, MessageSquare, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/PageContainer'
import { BlurFade } from '@/components/ui/blur-fade'
import { PageTransition } from '@/components/layout/PageTransition'
import { SurfaceSectionHeader } from '@/components/layout/PremiumSurface'
import { ErrorState } from '@/components/ui/error-state'
import { FeedCommandDeck } from '@/components/social/FeedCommandDeck'
import { FeedContextRail } from '@/components/social/FeedContextRail'
import { PostCard } from '@/components/social/PostCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { Button } from '@/components/ui/button'
import { MagicCard } from '@/components/ui/magic-card'
import { getFeedPosts, getFollowingFeedPosts } from '@/services/post'
import { useAuth } from '@/hooks/useAuth'
import { logDevError } from '@/lib/dev-log'
import type { FeedMode } from '@/components/shared/FeedTabBar'
import { EmptyStateGamified } from '@/components/shared'

const POSTS_PER_PAGE = 10

export default function FeedPage() {
	const { user } = useAuth()
	const t = useTranslations('feed')
	const [feedMode, setFeedMode] = useState<FeedMode>(() =>
		user ? 'forYou' : 'trending',
	)
	const [posts, setPosts] = useState<import('@/lib/types/post').Post[]>([])
	const [currentPage, setCurrentPage] = useState(0)
	const [hasMore, setHasMore] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)
	const [isColdStartFallback, setIsColdStartFallback] = useState(false)
	const initializedAuthMode = useRef(false)
	const availableModes: FeedMode[] = user
		? ['forYou', 'trending', 'following', 'latest']
		: ['trending', 'latest']

	useEffect(() => {
		if (user && !initializedAuthMode.current) {
			setFeedMode('forYou')
			initializedAuthMode.current = true
			return
		}

		if (!user) {
			initializedAuthMode.current = false
			setFeedMode(current =>
				current === 'forYou' || current === 'following' ? 'trending' : current,
			)
		}
	}, [user])

	useEffect(() => {
		let cancelled = false

		const fetchFeed = async () => {
			setIsLoading(true)
			setError(false)
			setCurrentPage(0)
			setIsColdStartFallback(false)
			try {
				const loadInitialFeed = async () => {
					if (feedMode === 'following') {
						const response = await getFollowingFeedPosts({
							page: 0,
							size: POSTS_PER_PAGE,
							mode: 'latest',
						})

						return {
							response,
							feedPosts: response.data ?? [],
							usedColdStartFallback: false,
						}
					}

					const response = await getFeedPosts({
						page: 0,
						size: POSTS_PER_PAGE,
						mode: feedMode,
					})
					const feedPosts = response.data ?? []

					if (
						feedMode !== 'forYou' ||
						(response.success && feedPosts.length > 0)
					) {
						return {
							response,
							feedPosts,
							usedColdStartFallback: false,
						}
					}

					const trendingResponse = await getFeedPosts({
						page: 0,
						size: POSTS_PER_PAGE,
						mode: 'trending',
					})

					return {
						response: trendingResponse.success ? trendingResponse : response,
						feedPosts: trendingResponse.success
							? (trendingResponse.data ?? [])
							: feedPosts,
						usedColdStartFallback:
							trendingResponse.success &&
							(trendingResponse.data?.length ?? 0) > 0,
					}
				}

				const { response, feedPosts, usedColdStartFallback } =
					await loadInitialFeed()

				if (cancelled) return

				if (response.success && response.data) {
					setPosts(feedPosts)
					setIsColdStartFallback(usedColdStartFallback)
					if (response.pagination) {
						setHasMore(!response.pagination.last)
					} else {
						setHasMore(feedPosts.length >= POSTS_PER_PAGE)
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
			const effectiveMode: 'forYou' | 'latest' | 'trending' =
				isColdStartFallback
					? 'trending'
					: feedMode === 'following'
						? 'latest'
						: feedMode
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
							mode: effectiveMode,
						})

			if (response.success && response.data) {
				setPosts(prev => {
					const existingIds = new Set(prev.map(post => post.id))
					const nextPosts = response.data.filter(
						post => !existingIds.has(post.id),
					)
					return [...prev, ...nextPosts]
				})
				setCurrentPage(nextPage)
				if (response.pagination) {
					setHasMore(!response.pagination.last)
				} else {
					setHasMore(response.data.length >= POSTS_PER_PAGE)
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
						title={t('unavailable')}
						message={t('unavailableDesc')}
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
							{t('loadingMore')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageContainer maxWidth='2xl'>
				<div
					data-testid='feed-page'
					data-visual-ready={isLoading ? 'false' : 'true'}
				>
					<div className='grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]'>
						<div>
							<FeedCommandDeck
								feedMode={feedMode}
								onFeedModeChange={setFeedMode}
								availableModes={availableModes}
								postCount={posts.length}
								hasMore={hasMore}
								className='mb-4 sm:mb-6'
							/>

							{isLoading ? (
								<div className='space-y-4'>
									<PostCardSkeleton />
									<PostCardSkeleton />
									<PostCardSkeleton />
								</div>
							) : posts.length === 0 ? (
								feedMode === 'following' ? (
									<EmptyStateGamified
										variant='feed'
										title={t('emptyFollowing')}
										description={t('emptyFollowingDesc')}
										primaryAction={{
											label: t('quickMovesCommunity'),
											href: '/community',
											icon: <MessageSquare className='size-4' />,
										}}
										secondaryActions={[
											{
												label: t('quickMovesExplore'),
												href: '/explore',
												icon: <Sparkles className='size-4' />,
											},
										]}
									/>
								) : feedMode === 'forYou' ? (
									<EmptyStateGamified
										variant='feed'
										title={t('emptyForYou')}
										description={t('emptyForYouDesc')}
										primaryAction={{
											label: t('quickMovesExplore'),
											href: '/explore',
											icon: <Sparkles className='size-4' />,
										}}
										secondaryActions={[
											{
												label: t('quickMovesCommunity'),
												href: '/community',
												icon: <MessageSquare className='size-4' />,
											},
										]}
									/>
								) : (
									<BlurFade delay={0.1} duration={0.4}>
										<MagicCard
											mode='orb'
											glowFrom='var(--color-brand)'
											glowTo='var(--color-xp)'
											className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card/75 backdrop-blur-md shadow-card p-0'
										>
											<div className='relative z-10 w-full'>
												<div className='p-8 text-center'>
													<div className='mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand/10'>
														<Flame className='size-7 text-brand' />
													</div>
													<p className='mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand'>
														{t('emptyEyebrow')}
													</p>
													<h2 className='mb-3 text-xl font-black text-text-primary'>
														{t('emptyTitle')}
													</h2>
													<p className='mx-auto mb-6 max-w-sm text-sm leading-relaxed text-text-secondary'>
														{t('emptyDesc')}
													</p>
													<div className='flex flex-wrap justify-center gap-3'>
														<Button
															asChild
															variant='brand'
															className='h-10 gap-2 rounded-xl px-5'
														>
															<Link href='/explore'>
																<Sparkles className='size-4' />
																Explore trending
															</Link>
														</Button>
														<Button
															asChild
															variant='outline'
															className='h-10 gap-2 rounded-xl px-5'
														>
															<Link href='/search'>Find people to follow</Link>
														</Button>
													</div>
												</div>
												<div className='border-t border-border-subtle/60 bg-bg-elevated/40 px-8 py-4'>
													<div className='flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted'>
														<span className='flex items-center gap-1.5'>
															<span className='inline-block size-2 rounded-full bg-success' />
															Community of home cooks
														</span>
														<span className='flex items-center gap-1.5'>
															<span className='inline-block size-2 rounded-full bg-brand' />
															Recipes shared every day
														</span>
														<span className='flex items-center gap-1.5'>
															<span className='inline-block size-2 rounded-full bg-xp' />
															Real kitchen experiences
														</span>
													</div>
												</div>
											</div>
										</MagicCard>
									</BlurFade>
								)
							) : (
								<>
									<SurfaceSectionHeader
										className='mb-3'
										eyebrow={t('liveFeed')}
										chipText={t('postsCount', { count: posts.length })}
									/>
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
												{t('loadMore')}
											</Button>
										</div>
									)}
								</>
							)}

							{/* Bottom breathing room for MobileBottomNav */}
							<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
						</div>

						<FeedContextRail
							postCount={posts.length}
							feedMode={feedMode}
							showFriendsOnline={Boolean(user)}
						/>
					</div>
				</div>
			</PageContainer>
		</PageTransition>
	)
}
