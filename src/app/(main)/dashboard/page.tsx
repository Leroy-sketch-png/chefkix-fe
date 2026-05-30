'use client'

import { useEffect, useState, useRef, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Post } from '@/lib/types'
import { getFeedPosts, getFollowingFeedPosts } from '@/services/post'

import {
	getPendingSessions,
	linkPostToSession,
	SessionHistoryItem,
} from '@/services/cookingSession'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PremiumSurface } from '@/components/layout/PremiumSurface'
import { BlurFade } from '@/components/ui/blur-fade'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { PostCard } from '@/components/social/PostCard'
import { PollCard } from '@/components/social/PollCard'
import { RecentCookCard } from '@/components/social/RecentCookCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { CreatePostForm } from '@/components/social/CreatePostForm'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { FeedModeTabBar, type FeedMode } from '@/components/shared/FeedTabBar'
import Link from 'next/link'
import {
	StaggerContainer,
	staggerItemVariants,
} from '@/components/ui/stagger-animation'
import {
	Users,
	MessageSquare,
	Home,
	Sparkles,
	TrendingUp,
	Loader2,
	ChefHat,
	BookOpen,
	Camera,
	PenLine,
	AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useFilterBlockedContent } from '@/hooks/useBlockedUsers'
import { usePostKeyboardNav } from '@/hooks/usePostKeyboardNav'
import { StreakRiskBanner } from '@/components/streak'
import { PendingPostsSection, type PendingSession } from '@/components/pending'
import { FriendsCookingNow, ResumeCookingBanner } from '@/components/cooking'
import {
	SinceLastVisitCard,
	TonightsPick,
	SeasonalBanner,
	ActiveChallengesWidget,
	DashboardCommandDeck,
} from '@/components/dashboard'
import {
	InterestPicker,
	dismissInterestPicker,
	hasInterestPickerBeenDismissed,
} from '@/components/onboarding/InterestPicker'
import { ColdStartExperience } from '@/components/onboarding/ColdStartExperience'
import { MeshGradient } from '@/components/ui/mesh-gradient'
import { useRouter } from 'next/navigation'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n/hooks'

const POSTS_PER_PAGE = 10
const DASHBOARD_FEED_TIMEOUT_MS = 12000
const DASHBOARD_AUX_TIMEOUT_MS = 8000
const DASHBOARD_XP_SYNC_TIMEOUT_MS = 10000

interface PendingPostLink {
	sessionId: string
	postId: string
	createdAt: string
}

const PENDING_POST_LINK_KEY = 'pendingPostLink'

const getPendingStatus = (
	daysRemaining: number,
): 'urgent' | 'warning' | 'normal' | 'expired' => {
	if (daysRemaining <= 0) return 'expired'
	if (daysRemaining <= 2) return 'urgent'
	if (daysRemaining <= 5) return 'warning'
	return 'normal'
}

const transformToPendingSession = (
	session: SessionHistoryItem,
): PendingSession => {
	const daysRemaining = session.daysRemaining ?? 14
	const cookedAt = new Date(session.completedAt || session.startedAt)
	const startTime = new Date(session.startedAt).getTime()
	const endTime = session.completedAt
		? new Date(session.completedAt).getTime()
		: startTime
	const durationMinutes = Math.round((endTime - startTime) / 60000)
	const expiresAt = session.postDeadline
		? new Date(session.postDeadline)
		: new Date(cookedAt.getTime() + 14 * 24 * 60 * 60 * 1000)

	return {
		id: session.sessionId,
		recipeId: session.recipeId,
		recipeName: session.recipeTitle,
		recipeImage: session.coverImageUrl?.[0] || '/placeholder-recipe.svg',
		cookedAt,
		duration: durationMinutes,
		baseXP: session.baseXpAwarded || 0,
		currentXP: session.pendingXp || 0,
		expiresAt,
		status: getPendingStatus(daysRemaining),
		postId: session.postId || undefined,
	}
}

function FeedItemErrorFallback({
	error,
	onReset,
}: {
	error?: Error
	onReset: () => void
}) {
	const tCommon = useTranslations('common')

	return (
		<div
			role='alert'
			className='rounded-radius border border-destructive/20 bg-bg-card p-4 shadow-card'
		>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div className='flex items-start gap-3'>
					<div className='rounded-full bg-destructive/10 p-2 text-destructive'>
						<AlertCircle className='size-4' />
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-text-primary'>
							{tCommon('somethingWentWrong')}
						</p>
						<p className='mt-1 text-sm text-text-secondary'>
							{error?.message || tCommon('unexpectedError')}
						</p>
					</div>
				</div>
				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={onReset}
					className='h-10 px-4'
				>
					{tCommon('tryAgain')}
				</Button>
			</div>
		</div>
	)
}

export default function DashboardPage() {
	const { user } = useAuth()
	const router = useRouter()
	const t = useTranslations('dashboard')
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
	const [isColdStartFallback, setIsColdStartFallback] = useState(false)
	const [feedRefreshKey, setFeedRefreshKey] = useState(0)
	const [isNavigating, startNavigationTransition] = useTransition()
	const loadMoreRef = useRef<HTMLDivElement>(null)

	const filteredPosts = useFilterBlockedContent(posts)
	const { focusedIndex: focusedPostIndex } = usePostKeyboardNav(filteredPosts)

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
				{ timeoutMs: DASHBOARD_XP_SYNC_TIMEOUT_MS },
			)

			if (linkResponse.success && linkResponse.data) {
				sessionStorage.removeItem(PENDING_POST_LINK_KEY)
				setHasPendingXpSync(false)
				setPendingSessions(prev =>
					prev.filter(session => session.id !== pendingPostLink.sessionId),
				)
				setPosts(prev =>
					prev.map(post =>
						post.id === pendingPostLink.postId
							? {
									...post,
									xpEarned: linkResponse.data?.xpAwarded ?? post.xpEarned,
								}
							: post,
					),
				)

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

	useEffect(() => {
		let cancelled = false

		const loadPendingSessions = async () => {
			try {
				const pendingResponse = await getPendingSessions({
					timeoutMs: DASHBOARD_AUX_TIMEOUT_MS,
				})
				if (cancelled || !pendingResponse.success || !pendingResponse.data) {
					return
				}

				const wasDismissed =
					sessionStorage.getItem('chefkix_pending_dismissed') === 'true'
				if (!wasDismissed) {
					setPendingSessions(
						pendingResponse.data.map(transformToPendingSession),
					)
				}
			} catch (err) {
				logDevError('Failed to load pending dashboard sessions:', err)
			}
		}

		const loadInitialFeed = async () => {
			if (feedMode === 'following') {
				const response = await getFollowingFeedPosts(
					{
						page: 0,
						size: POSTS_PER_PAGE,
						mode: 'latest',
					},
					{ timeoutMs: DASHBOARD_FEED_TIMEOUT_MS },
				)

				return {
					response,
					feedPosts: response.data ?? [],
					usedColdStartFallback: false,
				}
			}

			const response = await getFeedPosts(
				{
					page: 0,
					size: POSTS_PER_PAGE,
					mode: feedMode,
				},
				{ timeoutMs: DASHBOARD_FEED_TIMEOUT_MS },
			)
			const feedPosts = response.data ?? []

			if (feedMode !== 'forYou' || (response.success && feedPosts.length > 0)) {
				return {
					response,
					feedPosts,
					usedColdStartFallback: false,
				}
			}

			const trendingResponse = await getFeedPosts(
				{
					page: 0,
					size: POSTS_PER_PAGE,
					mode: 'trending',
				},
				{ timeoutMs: DASHBOARD_FEED_TIMEOUT_MS },
			)
			const trendingPosts = trendingResponse.data ?? []

			if (trendingResponse.success) {
				return {
					response: trendingResponse,
					feedPosts: trendingPosts,
					usedColdStartFallback: trendingPosts.length > 0,
				}
			}

			return {
				response,
				feedPosts,
				usedColdStartFallback: false,
			}
		}

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
					void retryPendingXpSync()
				}

				void loadPendingSessions()

				const {
					response: feedResponse,
					feedPosts: initialFeedPosts,
					usedColdStartFallback,
				} = await loadInitialFeed()
				if (cancelled) return

				if (!feedResponse.success || !feedResponse.data) {
					setIsColdStartFallback(false)
					setHasMore(false)
					setError(t('failedToLoadFeed'))
					return
				}

				let feedPosts = initialFeedPosts

				const newPostJson = sessionStorage.getItem('newPost')
				if (newPostJson) {
					try {
						const newPost = JSON.parse(newPostJson) as Post
						sessionStorage.removeItem('newPost')
						const exists = feedPosts.some(p => p.id === newPost.id)
						if (!exists) {
							feedPosts = [newPost, ...feedPosts]
						} else {
							feedPosts = feedPosts.map(p =>
								p.id === newPost.id ? { ...p, xpEarned: newPost.xpEarned } : p,
							)
						}
					} catch (e) {
						logDevError('Failed to parse newPost from sessionStorage:', e)
						sessionStorage.removeItem('newPost')
					}
				}

				setPosts(feedPosts)
				setIsColdStartFallback(usedColdStartFallback)

				if (feedResponse.pagination) {
					setHasMore(!feedResponse.pagination.last)
				} else {
					setHasMore(feedPosts.length >= POSTS_PER_PAGE)
				}
			} catch (err) {
				if (cancelled) return
				logDevError('Failed to load dashboard feed:', err)
				setError(t('failedToLoadFeed'))
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		fetchInitialData()
		return () => {
			cancelled = true
		}
	}, [feedMode, retryPendingXpSync, retryCount, feedRefreshKey, t])

	const handleRetryPendingXpSync = async () => {
		if (isRetryingPendingXp) return
		setIsRetryingPendingXp(true)
		const recovered = await retryPendingXpSync()
		if (recovered) {
			toast.success(t('toastXpSyncSuccess'))
		} else {
			toast.error(t('toastXpSyncBusy'))
		}
		setIsRetryingPendingXp(false)
	}

	const loadMorePosts = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setIsLoadingMore(true)
		const nextPage = currentPage + 1

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
					const existingIds = new Set(prev.map(p => p.id))
					const newPosts = response.data.filter(p => !existingIds.has(p.id))
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
			toast.error(t('toastLoadMoreFailed'))
			setHasMore(false)
		} finally {
			setIsLoadingMore(false)
		}
	}, [isLoadingMore, hasMore, currentPage, feedMode, isColdStartFallback, t])

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
		setShowStreakBanner(false)
	}

	const handlePostFromPending = (sessionId: string) => {
		startNavigationTransition(() => {
			router.push(`/post/new?session=${sessionId}`)
		})
	}

	const handleDismissPending = () => {
		setPendingSessions([])
		sessionStorage.setItem('chefkix_pending_dismissed', 'true')
	}

	const handlePostUpdate = useCallback((updatedPost: Post) => {
		setPosts(prev =>
			Array.isArray(prev)
				? prev.map(p => (p.id === updatedPost.id ? updatedPost : p))
				: [],
		)
	}, [])

	const handlePostDelete = useCallback((postId: string) => {
		setPosts(prev =>
			Array.isArray(prev) ? prev.filter(p => p.id !== postId) : [],
		)
	}, [])

	const needsTasteSetup = Boolean(
		!isLoading && user && (!user.preferences || user.preferences.length === 0),
	)
	const [interestPickerDismissed, setInterestPickerDismissed] = useState(true)
	const [isInterestPickerOpen, setIsInterestPickerOpen] = useState(false)
	const shouldShowTasteSetupPrompt = needsTasteSetup && !interestPickerDismissed

	useEffect(() => {
		setInterestPickerDismissed(hasInterestPickerBeenDismissed())
	}, [])

	const isNewUser =
		stats && (stats.currentXP ?? 0) === 0 && (stats.recipeCount ?? 0) === 0
	const shouldShowProfileBoost = Boolean(
		!isNewUser &&
			user &&
			(!user.avatarUrl ||
				user.avatarUrl === '/placeholder-avatar.svg' ||
				!user.bio),
	)
	const profileBoostNudge = (
		<PremiumSurface
			className='px-4 py-3'
			eyebrow={t('profileBoost')}
			chipText={t('actionNeeded')}
			showOrbs={true}
		>
			<div className='flex flex-wrap items-center gap-3'>
				<span className='text-xs font-semibold text-text-secondary'>
					{t('obProfileNudge')}
				</span>
				{(!user?.avatarUrl || user.avatarUrl === '/placeholder-avatar.svg') && (
					<Link
						href='/settings'
						className='inline-flex items-center gap-1.5 rounded-xl bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-brand/10 hover:text-brand'
					>
						<Camera className='size-3.5' />
						{t('obAddPhoto')}
					</Link>
				)}
				{!user?.bio && (
					<Link
						href='/settings'
						className='inline-flex items-center gap-1.5 rounded-xl bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-brand/10 hover:text-brand'
					>
						<PenLine className='size-3.5' />
						{t('obWriteBio')}
					</Link>
				)}
			</div>
		</PremiumSurface>
	)

	const handleInterestPickerComplete = useCallback(() => {
		setIsInterestPickerOpen(false)
		setInterestPickerDismissed(hasInterestPickerBeenDismissed())
		setFeedRefreshKey(k => k + 1)
	}, [])

	const handleDismissTasteSetupPrompt = useCallback(() => {
		dismissInterestPicker()
		setInterestPickerDismissed(true)
		setIsInterestPickerOpen(false)
	}, [])

	return (
		<>
			<AnimatePresence>
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed top-20 left-1/2 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
							{t('loading')}
						</div>
					</motion.div>
				)}
				{isInterestPickerOpen && (
					<InterestPicker onComplete={handleInterestPickerComplete} />
				)}
			</AnimatePresence>
			<PageTransition>
				<MeshGradient className='min-h-full' speed={0.5}>
					<PageContainer maxWidth='lg'>
						<div
							data-testid='dashboard-page'
							data-visual-ready={isLoading ? 'false' : 'true'}
						>
							<div className='mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]'>
								<div className='space-y-6'>
									{!isNewUser ? (
										<div className='grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]'>
											<BlurFade delay={0.05}>
												<TonightsPick className='mb-0 h-full' />
											</BlurFade>
											<div className='space-y-6'>
												<BlurFade delay={0.09}>
													<SinceLastVisitCard className='mb-0' />
												</BlurFade>
												{shouldShowProfileBoost && (
													<motion.div
														initial={{ opacity: 0, y: 12 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ ...TRANSITION_SPRING, delay: 0.12 }}
														className='hidden xl:block'
													>
														{profileBoostNudge}
													</motion.div>
												)}
											</div>
										</div>
									) : (
										<BlurFade delay={0.05}>
											<TonightsPick className='mb-0' />
										</BlurFade>
									)}

									{isNewUser ? (
										<motion.div
											initial={{ opacity: 0, y: 12 }}
											animate={{ opacity: 1, y: 0 }}
											transition={TRANSITION_SPRING}
											className='overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-bg-card via-bg-card to-brand/5 shadow-card'
										>
											<div className='border-b border-brand/10 bg-brand/5 px-5 py-3'>
												<p className='text-2xs font-bold uppercase tracking-widest text-brand'>
													{t('obJoin')}
												</p>
												<h2 className='text-base font-bold text-text-primary'>
													{t('obWelcome', {
														name:
															user?.displayName ||
															user?.firstName ||
															user?.username,
													})}
												</h2>
												<p className='mt-0.5 text-sm text-text-secondary'>
													{t('obHowTo')}
												</p>
											</div>
											<div className='p-4'>
												<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-3'>
													<Link
														href='/explore'
														className='group flex items-center gap-3 rounded-xl bg-bg-elevated p-3 transition-all hover:bg-brand/8 hover:shadow-card'
													>
														<div className='grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 transition-colors group-hover:bg-brand/20'>
															<BookOpen className='size-[18px] text-brand' />
														</div>
														<div>
															<span className='text-sm font-semibold text-text-primary'>
																{t('obBrowse')}
															</span>
															<p className='text-xs text-text-muted'>
																{t('obBrowseDesc')}
															</p>
														</div>
													</Link>
													<Link
														href='/explore?difficulty=Beginner'
														className='group flex items-center gap-3 rounded-xl bg-bg-elevated p-3 transition-all hover:bg-xp/8 hover:shadow-card'
													>
														<div className='grid size-9 shrink-0 place-items-center rounded-xl bg-xp/10 transition-colors group-hover:bg-xp/20'>
															<ChefHat className='size-[18px] text-xp' />
														</div>
														<div>
															<span className='text-sm font-semibold text-text-primary'>
																{t('obTryFirst')}
															</span>
															<p className='text-xs text-text-muted'>
																{t('obTryFirstDesc')}
															</p>
														</div>
													</Link>
													<Link
														href='/community'
														className='group flex items-center gap-3 rounded-xl bg-bg-elevated p-3 transition-all hover:bg-streak/8 hover:shadow-card'
													>
														<div className='grid size-9 shrink-0 place-items-center rounded-xl bg-streak/10 transition-colors group-hover:bg-streak/20'>
															<Users className='size-[18px] text-streak' />
														</div>
														<div>
															<span className='text-sm font-semibold text-text-primary'>
																{t('obJoin')}
															</span>
															<p className='text-xs text-text-muted'>
																{t('obJoinDesc')}
															</p>
														</div>
													</Link>
												</div>
												{user &&
													(!user.avatarUrl ||
														user.avatarUrl === '/placeholder-avatar.svg' ||
														!user.bio) && (
														<div className='mt-3.5 flex flex-wrap items-center gap-2 border-t border-border-subtle/60 pt-3.5'>
															<span className='text-xs font-medium text-text-muted'>
																{t('obQuickWins')}
															</span>
															{(!user.avatarUrl ||
																user.avatarUrl ===
																	'/placeholder-avatar.svg') && (
																<Link
																	href='/settings'
																	className='inline-flex items-center gap-1.5 rounded-full bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all hover:bg-brand/10 hover:text-brand'
																>
																	<Camera className='size-3.5' />
																	{t('obAddPhoto')}
																</Link>
															)}
															{!user.bio && (
																<Link
																	href='/settings'
																	className='inline-flex items-center gap-1.5 rounded-full bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all hover:bg-brand/10 hover:text-brand'
																>
																	<PenLine className='size-3.5' />
																	{t('obWriteBio')}
																</Link>
															)}
														</div>
													)}
											</div>
										</motion.div>
									) : null}

									<BlurFade delay={0.14}>
										<DashboardCommandDeck
											stats={stats}
											hasStreakAtRisk={hasStreakAtRisk}
											pendingSessionCount={pendingSessions.length}
										/>
									</BlurFade>
								</div>

								<aside className='space-y-6 xl:sticky xl:top-24 xl:self-start'>
									<BlurFade delay={0.12}>
										<FriendsCookingNow className='mb-0' />
									</BlurFade>
									{!isNewUser && (
										<BlurFade delay={0.16}>
											<ActiveChallengesWidget className='mb-0' />
										</BlurFade>
									)}
									{!isNewUser && (
										<BlurFade delay={0.2}>
											<SeasonalBanner className='mb-0' />
										</BlurFade>
									)}
								</aside>
							</div>

							{hasPendingXpSync && (
								<div className='mb-4 rounded-radius border border-brand/30 bg-brand/5 p-4'>
									<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
										<div>
											<p className='text-sm font-semibold text-brand'>
												{t('xpSyncingTitle')}
											</p>
											<p className='text-sm text-text-secondary'>
												{t('xpConfirmingText')}
											</p>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={handleRetryPendingXpSync}
											disabled={isRetryingPendingXp}
											className='sm:w-auto'
										>
											{isRetryingPendingXp ? t('syncing') : t('syncNow')}
										</Button>
									</div>
								</div>
							)}

							<div className='space-y-6'>
								<BlurFade delay={0.3}>
									<ResumeCookingBanner className='mb-0' />
								</BlurFade>
								{!isNewUser && hasStreakAtRisk && showStreakBanner && (
									<BlurFade delay={0.35}>
										<StreakRiskBanner
											currentStreak={stats?.streakCount ?? 0}
											timeRemaining={{ hours: hoursUntilBreak, minutes: 0 }}
											isUrgent={isUrgent}
											onQuickCook={() =>
												startNavigationTransition(() => {
													router.push('/explore')
												})
											}
											onDismiss={() => setShowStreakBanner(false)}
										/>
									</BlurFade>
								)}
								{!isNewUser && pendingSessions.length > 0 && (
									<BlurFade delay={0.4}>
										<PendingPostsSection
											sessions={pendingSessions}
											onPost={handlePostFromPending}
											onDismiss={handleDismissPending}
											onViewAll={() =>
												startNavigationTransition(() => {
													router.push(`/${user?.userId}?tab=cooking`)
												})
											}
										/>
									</BlurFade>
								)}
								<BlurFade delay={0.45}>
									<PremiumSurface
										className='p-3 md:p-4'
										eyebrow={t('feedControls')}
										chipText={
											feedMode === 'following'
												? t('feedModeFollowing')
												: t('feedModeForYou')
										}
										showOrbs={true}
									>
										{shouldShowTasteSetupPrompt && (
											<div className='mb-4 rounded-2xl border border-brand/15 bg-gradient-to-r from-brand/6 via-bg-card to-streak/6 p-4'>
												<div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
													<div>
														<div className='mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-2xs font-bold uppercase tracking-widest text-brand'>
															<Sparkles className='size-3.5' />
															{t('tasteSetupEyebrow')}
														</div>
														<h3 className='text-sm font-semibold text-text-primary'>
															{t('tasteSetupTitle')}
														</h3>
														<p className='mt-1 max-w-2xl text-sm text-text-secondary'>
															{t('tasteSetupDesc')}
														</p>
													</div>
													<div className='flex flex-wrap gap-2'>
														<Button
															type='button'
															size='sm'
															variant='brand'
															onClick={() => setIsInterestPickerOpen(true)}
														>
															{t('tasteSetupCta')}
														</Button>
														<Button
															type='button'
															size='sm'
															variant='ghost'
															onClick={handleDismissTasteSetupPrompt}
														>
															{t('tasteSetupDismiss')}
														</Button>
													</div>
												</div>
											</div>
										)}
										<FeedModeTabBar
											activeMode={feedMode}
											onModeChange={setFeedMode}
										/>
									</PremiumSurface>
								</BlurFade>
								<BlurFade delay={0.5}>
									<PremiumSurface
										className='p-3 md:p-4'
										eyebrow={t('creatorComposer')}
										chipText={t('readyToPost')}
										showOrbs={true}
									>
										<CreatePostForm
											onPostCreated={handlePostCreated}
											currentUser={
												user
													? {
															userId: user.userId ?? '',
															displayName:
																user.displayName || user.username || 'User',
															avatarUrl: user.avatarUrl,
														}
													: undefined
											}
										/>
									</PremiumSurface>
								</BlurFade>
								<ColdStartExperience
									isAuthenticated={!!user}
									onColdStartComplete={() => setFeedRefreshKey(k => k + 1)}
								>
									{isLoading && (
										<div className='space-y-4 md:space-y-6'>
											<PostCardSkeleton count={3} showImages={false} />
										</div>
									)}
									{error && (
										<ErrorState
											title={t('failedToLoad')}
											message={error}
											onRetry={() => {
												setError(null)
												setRetryCount(c => c + 1)
											}}
										/>
									)}
									{!isLoading &&
										!error &&
										isColdStartFallback &&
										feedMode === 'forYou' && (
											<div className='mb-4 flex items-center gap-3 rounded-radius border border-brand/20 bg-brand/5 p-3 text-sm text-text-secondary'>
												<TrendingUp className='size-4 shrink-0 text-brand' />
												<span>
													{t.rich('coldStartBanner', {
														strong: chunks => (
															<strong className='text-text-primary'>
																{chunks}
															</strong>
														),
													})}
												</span>
											</div>
										)}
									{!isLoading &&
										!error &&
										filteredPosts.length === 0 &&
										feedMode === 'following' && (
											<EmptyStateGamified
												variant='feed'
												title={t('emptyFollowing')}
												description={t('emptyFollowingDesc')}
												primaryAction={{
													label: t('discoverPeople'),
													href: '/community',
													icon: <Users className='size-4' />,
												}}
											/>
										)}
									{!isLoading &&
										!error &&
										filteredPosts.length === 0 &&
										feedMode === 'forYou' && (
											<EmptyStateGamified
												variant='feed'
												title={t('emptyForYou')}
												description={t('emptyForYouDesc')}
												primaryAction={{
													label: t('exploreTrending'),
													href: '/explore',
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
												title={t('emptyFeed')}
												description={t('emptyFeedDesc')}
												primaryAction={{
													label: t('discoverPeople'),
													href: '/community',
													icon: <Users className='size-4' />,
												}}
												secondaryActions={[
													{
														label: t('explorePosts'),
														href: '/explore',
														icon: <MessageSquare className='size-4' />,
													},
												]}
											/>
										)}
									{!isLoading && !error && filteredPosts.length > 0 && (
										<>
											<StaggerContainer className='space-y-4 md:space-y-6'>
												<AnimatePresence mode='popLayout'>
													{filteredPosts.map((post, i) => (
														<motion.div
															key={post.id}
															variants={staggerItemVariants}
															exit={{ opacity: 0, y: -10 }}
															layout
															data-post-index={i}
															className={cn(
																'rounded-2xl transition-shadow',
																focusedPostIndex === i &&
																	'ring-2 ring-brand/50 shadow-warm',
															)}
														>
															<ErrorBoundary
																fallbackRender={({ error, onReset }) => (
																	<FeedItemErrorFallback
																		error={error}
																		onReset={onReset}
																	/>
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
															</ErrorBoundary>
														</motion.div>
													))}
												</AnimatePresence>
											</StaggerContainer>

											<div
												ref={loadMoreRef}
												className='flex justify-center py-8'
												aria-live='polite'
												aria-atomic='true'
											>
												{isLoadingMore && (
													<motion.div
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														className='flex items-center gap-2 text-text-secondary'
														role='status'
													>
														<Loader2 className='size-5 animate-spin text-brand' />
														<span className='text-sm font-medium'>
															{t('loadingMore')}
														</span>
													</motion.div>
												)}
												{!hasMore && filteredPosts.length > POSTS_PER_PAGE && (
													<p className='text-sm text-text-muted'>
														{t('endOfFeed')}
													</p>
												)}
											</div>
										</>
									)}
								</ColdStartExperience>
							</div>
							{shouldShowProfileBoost && (
								<BlurFade delay={0.58} className='mt-6 xl:hidden'>
									{profileBoostNudge}
								</BlurFade>
							)}
							<div className='pb-[calc(var(--h-mobile-nav)+var(--space-24))] md:pb-8' />
						</div>
					</PageContainer>
				</MeshGradient>
			</PageTransition>
		</>
	)
}
