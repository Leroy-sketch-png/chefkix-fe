'use client'

import { useEffect, useState, useRef, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Post } from '@/lib/types'
import { getFeedPosts, getFollowingFeedPosts } from '@/services/post'
import { getStoryFeed } from '@/services/story'
import { UserStoryFeedResponse } from '@/lib/types/story' // 🌟 Import Type chuẩn của Story
import {
	getPendingSessions,
	linkPostToSession,
	SessionHistoryItem,
} from '@/services/cookingSession'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { PostCard } from '@/components/social/PostCard'
import { PollCard } from '@/components/social/PollCard'
import { RecentCookCard } from '@/components/social/RecentCookCard'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { CreatePostForm } from '@/components/social/CreatePostForm'
import { QuickPostFAB } from '@/components/social/QuickPostFAB'
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
	Users2,
	MessageSquare,
	Home,
	Sparkles,
	TrendingUp,
	Clock,
	Loader2,
	ChefHat,
	BookOpen,
	Camera,
	PenLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useFilterBlockedContent } from '@/hooks/useBlockedUsers'
import { usePostKeyboardNav } from '@/hooks/usePostKeyboardNav'
import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator'
import { StreakRiskBanner } from '@/components/streak'
import { PendingPostsSection, type PendingSession } from '@/components/pending'
import { ResumeCookingBanner } from '@/components/cooking'
import {
	SinceLastVisitCard,
	TonightsPick,
	SeasonalBanner,
	ActiveChallengesWidget,
} from '@/components/dashboard'
import { InterestPicker } from '@/components/onboarding/InterestPicker'
import { ColdStartExperience } from '@/components/onboarding/ColdStartExperience'
import { useRouter } from 'next/navigation'
import { TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n/hooks'
import { StoryFeed } from '@/components/story/StoryFeed'
import { useStoryStore } from '@/store/storyStore'

const POSTS_PER_PAGE = 10

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

export default function DashboardPage() {
	const { user } = useAuth()
	const router = useRouter()
	const t = useTranslations('dashboard')
	const [posts, setPosts] = useState<Post[]>([])
	const [storyUsers, setStoryUsers] = useState<UserStoryFeedResponse[]>([]) // 🌟 State đã được định kiểu chuẩn
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

	useOnboardingOrchestrator({ delay: 1200, condition: !isLoading })

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

	// 🌟 USE-EFFECT ĐỘC LẬP ĐỂ LẤY STORY (Không bao giờ bị crash lây)
	// 🌟 USE-EFFECT ĐỘC LẬP ĐỂ LẤY STORY
	// 🌟 USE-EFFECT LẤY STORY (Bulletproof - Bất chấp mọi loại vỏ bọc)
	// 🌟 USE-EFFECT LẤY STORY (Thuật toán săn tìm mảng tự động)
	useEffect(() => {
		let cancelled = false

		const fetchStories = async () => {
			try {
				console.log('👉 1. Bắt đầu gọi API getStoryFeed...')
				const res = await getStoryFeed()

				if (cancelled) return
				console.log('👉 2. RAW DATA trả về từ Service:', res)

				// Thuật toán quét mọi ngóc ngách để tìm cái mảng array
				let storyArray = null

				if (Array.isArray(res)) {
					storyArray = res // Trạng thái đã bóc hết vỏ
				} else if (res?.data && Array.isArray(res.data)) {
					storyArray = res.data // Vỏ của API Response
				} else if (res?.data?.data && Array.isArray(res.data.data)) {
					storyArray = res.data.data // Bị kẹt vỏ Axios
				}

				console.log('👉 3. Mảng Array trích xuất được:', storyArray)

				// Nếu tìm thấy mảng hợp lệ
				if (storyArray && storyArray.length > 0) {
					const formattedStories: UserStoryFeedResponse[] = storyArray.map(
						(s: any) => ({
							userId: s.userId || s.authorId || s.id,
							displayName: s.displayName || s.username || 'User',
							avatarUrl: s.avatarUrl,
							hasUnseenStory: s.hasUnseenStory ?? s.hasUnseen ?? false,
							hasStories: true, // 🌟 Bắt buộc phải có để StoryAvatar hiện viền
						}),
					)

					console.log('👉 4. Data chuấn bị nhét vào State:', formattedStories)
					setStoryUsers(formattedStories)
				} else {
					console.log(
						'⚠️ Tìm thấy data, nhưng mảng Story đang trống hoặc không map được.',
					)
				}
			} catch (err) {
				console.error('❌ Lỗi khi gọi API Story feed:', err)
			}
		}

		fetchStories()

		return () => {
			cancelled = true
		}
	}, [feedRefreshKey])

	// 🌟 USE-EFFECT ĐỂ LẤY BÀI VIẾT (Đã dọn dẹp phần Story ra ngoài)
	useEffect(() => {
		let cancelled = false
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
					if (cancelled) return
					if (!recovered) {
						toast.warning(t('toastXpStillSyncing'))
					}
				}

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
				if (cancelled) return

				if (feedResponse.success && feedResponse.data) {
					let feedPosts = feedResponse.data
					feedPosts = feedPosts.filter(post => post.postType !== 'GROUP')

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
					setIsColdStartFallback(false)

					if (feedMode === 'forYou' && feedPosts.length === 0) {
						const trendingResponse = await getFeedPosts({
							page: 0,
							size: POSTS_PER_PAGE,
							mode: 'trending',
						})
						if (
							!cancelled &&
							trendingResponse.success &&
							trendingResponse.data
						) {
							const trendingPosts = trendingResponse.data.filter(
								post => post.postType !== 'GROUP',
							)
							if (trendingPosts.length > 0) {
								setPosts(trendingPosts)
								setIsColdStartFallback(true)
								if (trendingResponse.pagination) {
									setHasMore(!trendingResponse.pagination.last)
								} else {
									setHasMore(trendingPosts.length >= POSTS_PER_PAGE)
								}
							}
						}
					}

					if (feedResponse.pagination) {
						setHasMore(!feedResponse.pagination.last)
					} else {
						setHasMore(feedPosts.length >= POSTS_PER_PAGE)
					}
				}

				if (pendingResponse.success && pendingResponse.data) {
					const wasDismissed =
						sessionStorage.getItem('chefkix_pending_dismissed') === 'true'
					if (!wasDismissed) {
						setPendingSessions(
							pendingResponse.data.map(transformToPendingSession),
						)
					}
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
				const filteredPosts = response.data.filter(
					post => post.postType !== 'GROUP',
				)
				setPosts(prev => {
					const existingIds = new Set(prev.map(p => p.id))
					const newPosts = filteredPosts.filter(p => !existingIds.has(p.id))
					return [...prev, ...newPosts]
				})
				setCurrentPage(nextPage)
				if (response.pagination) {
					setHasMore(!response.pagination.last)
				} else {
					setHasMore(filteredPosts.length >= POSTS_PER_PAGE)
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

	const showInterestPicker =
		!isLoading && user && (!user.preferences || user.preferences.length === 0)
	const [interestPickerDismissed, setInterestPickerDismissed] = useState(false)

	const isNewUser =
		stats && (stats.currentXP ?? 0) === 0 && (stats.recipeCount ?? 0) === 0

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
				{showInterestPicker && !interestPickerDismissed && (
					<InterestPicker
						onComplete={() => {
							setInterestPickerDismissed(true)
							setFeedRefreshKey(k => k + 1)
						}}
					/>
				)}
			</AnimatePresence>
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<PageHeader
						icon={Home}
						title={t('title')}
						subtitle={t('subtitle')}
						gradient='orange'
						marginBottom='md'
					/>

					{/* 🌟 COMPONENT STORY HOÀN CHỈNH */}
					<div className='mb-6'>
						<StoryFeed
							stories={storyUsers}
							isLoading={isLoading}
							onStoryClick={storyUser => {
								const isMe = storyUser.userId === user?.userId
								// Kiểm tra xem user có story không bằng trường hasUnseenStory, hoặc bạn có thể bổ sung hasStories vào DTO nếu cần
								const hasStory =
									storyUser.hasUnseenStory || (storyUser as any).hasStories

								if (isMe && !hasStory) {
									router.push('/story/create')
								} else {
									router.push(`/story/view/${storyUser.userId}`)
								}
							}}
						/>
					</div>

					<TonightsPick className='mb-6' />

					{!isNewUser && <SeasonalBanner className='mb-6' />}

					{!isNewUser && <ActiveChallengesWidget className='mb-6' />}

					{isNewUser ? (
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={TRANSITION_SPRING}
							className='mb-6 rounded-radius border border-brand/30 bg-gradient-to-r from-brand/5 via-bg-card to-xp/5 p-5'
						>
							<h2 className='text-lg font-bold text-text'>
								{t('obWelcome', {
									name: user?.displayName || user?.firstName || user?.username,
								})}
							</h2>

							<p className='mt-1 text-sm text-text-secondary'>{t('obHowTo')}</p>
							<div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3'>
								<Link
									href='/explore'
									className='group flex items-center gap-3 rounded-lg bg-bg-elevated p-3 transition-colors hover:bg-bg-card'
								>
									<div className='grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 transition-colors group-hover:bg-brand/20'>
										<BookOpen className='size-5 text-brand' />
									</div>
									<div>
										<span className='text-sm font-medium text-text'>
											{t('obBrowse')}
										</span>
										<p className='text-xs text-text-muted'>
											{t('obBrowseDesc')}
										</p>
									</div>
								</Link>
								<Link
									href='/explore?difficulty=Beginner'
									className='group flex items-center gap-3 rounded-lg bg-bg-elevated p-3 transition-colors hover:bg-bg-card'
								>
									<div className='grid size-9 shrink-0 place-items-center rounded-lg bg-xp/10 transition-colors group-hover:bg-xp/20'>
										<ChefHat className='size-5 text-xp' />
									</div>
									<div>
										<span className='text-sm font-medium text-text'>
											{t('obTryFirst')}
										</span>
										<p className='text-xs text-text-muted'>
											{t('obTryFirstDesc')}
										</p>
									</div>
								</Link>
								<Link
									href='/community'
									className='group flex items-center gap-3 rounded-lg bg-bg-elevated p-3 transition-colors hover:bg-bg-card'
								>
									<div className='grid size-9 shrink-0 place-items-center rounded-lg bg-streak/10 transition-colors group-hover:bg-streak/20'>
										<Users className='size-5 text-streak' />
									</div>
									<div>
										<span className='text-sm font-medium text-text'>
											{t('obJoin')}
										</span>
										<p className='text-xs text-text-muted'>{t('obJoinDesc')}</p>
									</div>
								</Link>
							</div>
							{user &&
								(!user.avatarUrl ||
									user.avatarUrl === '/placeholder-avatar.svg' ||
									!user.bio) && (
									<div className='mt-4 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3'>
										<span className='text-xs font-medium text-text-muted'>
											{t('obQuickWins')}
										</span>
										{(!user.avatarUrl ||
											user.avatarUrl === '/placeholder-avatar.svg') && (
											<Link
												href='/settings'
												className='inline-flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-brand/10 hover:text-brand'
											>
												<Camera className='size-3.5' />

												{t('obAddPhoto')}
											</Link>
										)}
										{!user.bio && (
											<Link
												href='/settings'
												className='inline-flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-brand/10 hover:text-brand'
											>
												<PenLine className='size-3.5' />

												{t('obWriteBio')}
											</Link>
										)}
									</div>
								)}
						</motion.div>
					) : (
						user &&
						(!user.avatarUrl ||
							user.avatarUrl === '/placeholder-avatar.svg' ||
							!user.bio) && (
							<motion.div
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...TRANSITION_SPRING, delay: 0.1 }}
								className='mb-6 flex flex-wrap items-center gap-3 rounded-radius border border-border-subtle bg-bg-card px-4 py-3 shadow-card'
							>
								<span className='text-xs font-semibold text-text-secondary'>
									{t('obProfileNudge')}
								</span>
								{(!user.avatarUrl ||
									user.avatarUrl === '/placeholder-avatar.svg') && (
									<Link
										href='/settings'
										className='inline-flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-brand/10 hover:text-brand'
									>
										<Camera className='size-3.5' />

										{t('obAddPhoto')}
									</Link>
								)}
								{!user.bio && (
									<Link
										href='/settings'
										className='inline-flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-brand/10 hover:text-brand'
									>
										<PenLine className='size-3.5' />

										{t('obWriteBio')}
									</Link>
								)}
							</motion.div>
						)
					)}

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
					<ResumeCookingBanner className='mb-6' />
					{!isNewUser && hasStreakAtRisk && showStreakBanner && (
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
							className='mb-6'
						/>
					)}
					{!isNewUser && pendingSessions.length > 0 && (
						<PendingPostsSection
							sessions={pendingSessions}
							onPost={handlePostFromPending}
							onDismiss={handleDismissPending}
							onViewAll={() =>
								startNavigationTransition(() => {
									router.push(`/${user?.userId}?tab=cooking`)
								})
							}
							className='mb-6'
						/>
					)}
					<FeedModeTabBar
						activeMode={feedMode}
						onModeChange={setFeedMode}
						className='mb-6'
					/>
					{!isNewUser && <SinceLastVisitCard className='mb-6' />}
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
												<strong className='text-text'>{chunks}</strong>
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
										<p className='text-sm text-text-muted'>{t('endOfFeed')}</p>
									)}
								</div>
							</>
						)}
					</ColdStartExperience>
					<div className='pb-24 md:pb-8' />
				</PageContainer>
				<QuickPostFAB onPostCreated={handlePostCreated} />
			</PageTransition>
		</>
	)
}
