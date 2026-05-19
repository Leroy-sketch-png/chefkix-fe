'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/constants'
import { StreakWidget } from '@/components/streak'
import { ExpandableDailyChallengeBanner } from '@/components/challenges'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getTodaysChallenge } from '@/services/challenge'
import {
	getSuggestedFollows,
	toggleFollow as toggleFollowApi,
} from '@/services/social'
import { getSessionHistory } from '@/services/cookingSession'
import { Profile } from '@/lib/types'
import { logDevError } from '@/lib/dev-log'
import { cn } from '@/lib/utils'
import { FriendsOnlineWidget } from '@/components/social/FriendsOnlineWidget'
import { usePresence } from '@/hooks/usePresence'
import { toast } from 'sonner'
import {
	AlertTriangle,
	RefreshCw,
	ChefHat,
	Zap,
	Trophy,
	Users,
	ArrowRight,
} from 'lucide-react'
import { FOLLOW_PULSE, TRANSITION_SPRING } from '@/lib/motion'

// ============================================
// HELPER: Compute week progress from cooking session history
// ============================================

type DayStatus = 'cooked' | 'today' | 'missed' | 'future'

function computeWeekProgress(
	cookDates: Date[],
	lastCookDate?: string,
): { weekProgress: DayStatus[]; isActiveToday: boolean } {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	// Get start of week (Monday)
	const dayOfWeek = today.getDay()
	const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
	const monday = new Date(today)
	monday.setDate(today.getDate() + mondayOffset)

	// Create set of cooked dates (as date strings for comparison)
	const cookedDateSet = new Set(
		cookDates.map(d => {
			const normalized = new Date(d)
			normalized.setHours(0, 0, 0, 0)
			return normalized.toDateString()
		}),
	)

	// Check if last cook was today
	const isActiveToday = lastCookDate
		? new Date(lastCookDate).toDateString() === today.toDateString()
		: cookedDateSet.has(today.toDateString())

	// Build week progress array (Mon-Sun)
	const weekProgress: DayStatus[] = []
	for (let i = 0; i < 7; i++) {
		const date = new Date(monday)
		date.setDate(monday.getDate() + i)
		date.setHours(0, 0, 0, 0)

		if (date.toDateString() === today.toDateString()) {
			weekProgress.push('today')
		} else if (date > today) {
			weekProgress.push('future')
		} else if (cookedDateSet.has(date.toDateString())) {
			weekProgress.push('cooked')
		} else {
			weekProgress.push('missed') // Past days where user did not cook
		}
	}

	return { weekProgress, isActiveToday }
}

// ============================================
// COMPONENT
// ============================================

export const RightSidebar = () => {
	const t = useTranslations('common')
	const tNav = useTranslations('nav')
	const { user } = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	usePresence() // Send heartbeat while sidebar is mounted
	const isDiscoverySurface =
		pathname.startsWith('/search') ||
		pathname.startsWith('/explore') ||
		pathname.startsWith('/feed') ||
		pathname.startsWith('/community')
	const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	const guestSignInHref = `${PATHS.AUTH.SIGN_IN}?returnTo=${encodeURIComponent(currentPath)}`
	const guestSignUpHref = `${PATHS.AUTH.SIGN_UP}?returnTo=${encodeURIComponent(currentPath)}`
	const [followedIds, setFollowedIds] = useState<string[]>([])
	const followingLockRef = useRef(new Set<string>())
	const [suggestions, setSuggestions] = useState<Profile[]>([])
	const [cookDates, setCookDates] = useState<Date[]>([])
	const [sidebarError, setSidebarError] = useState(false)
	const [retryCount, setRetryCount] = useState(0)
	const [dailyChallenge, setDailyChallenge] = useState<{
		id: string
		title: string
		description: string
		icon: string
		bonusXp: number
		endsAt: Date
	} | null>(null)

	useEffect(() => {
		// Don't fetch until user is authenticated
		if (!user) return
		let cancelled = false

		const fetchData = async () => {
			setSidebarError(false)
			try {
				// Fetch daily challenge, profile suggestions, and session history in parallel
				const [challengeResponse, profilesResponse, sessionResponse] =
					await Promise.all([
						getTodaysChallenge(),
						getSuggestedFollows(5),
						getSessionHistory({ status: 'all', size: 100 }),
					])
				if (cancelled) return

				if (challengeResponse.success && challengeResponse.data) {
					const data = challengeResponse.data
					// Validate shape — API mocks/errors may return Page<T> instead of a challenge object
					if (typeof data.title === 'string' && data.endsAt) {
						setDailyChallenge({
							id: data.id,
							title: data.title,
							description: data.description,
							icon: data.icon,
							bonusXp: data.bonusXp ?? 0,
							endsAt: new Date(data.endsAt),
						})
					}
				}

				if (profilesResponse.success && profilesResponse.data) {
					setSuggestions(profilesResponse.data)
				}

				// Extract completed session dates for streak calculation
				if (sessionResponse.success && sessionResponse.data?.sessions) {
					const completedDates = sessionResponse.data.sessions
						.filter(
							s =>
								s.status === 'completed' ||
								s.status === 'posted' ||
								s.status === 'post_deleted',
						)
						.map(s => new Date(s.completedAt || s.startedAt))
					setCookDates(completedDates)
				}
			} catch (err) {
				logDevError('Failed to fetch sidebar data:', err)
				if (!cancelled) setSidebarError(true)
			}
		}

		fetchData()
		return () => {
			cancelled = true
		}
	}, [user, retryCount]) // Re-fetch when user changes or on retry

	const handleFollow = useCallback(
		async (userId: string) => {
			if (followingLockRef.current.has(userId)) return
			followingLockRef.current.add(userId)
			const wasFollowed = followedIds.includes(userId)
			// Optimistic UI update
			setFollowedIds(prev =>
				prev.includes(userId)
					? prev.filter(id => id !== userId)
					: [...prev, userId],
			)
			try {
				const response = await toggleFollowApi(userId)
				if (!response.success) {
					// Revert on failure
					setFollowedIds(prev =>
						prev.includes(userId)
							? prev.filter(id => id !== userId)
							: [...prev, userId],
					)
					toast.error(wasFollowed ? t('failedToUnfollow') : t('failedToFollow'))
				}
			} catch (err) {
				// Revert on error
				setFollowedIds(prev =>
					prev.includes(userId)
						? prev.filter(id => id !== userId)
						: [...prev, userId],
				)
				logDevError('Failed to toggle follow:', err)
				toast.error(wasFollowed ? t('failedToUnfollow') : t('failedToFollow'))
			} finally {
				followingLockRef.current.delete(userId)
			}
		},
		[followedIds, t],
	)

	// Compute streak data from user stats + cooking session history
	const streakData = useMemo(() => {
		const { weekProgress, isActiveToday } = computeWeekProgress(cookDates)
		const currentStreak = user?.statistics?.streakCount ?? 0

		// Determine streak status (must match StreakWidget props: 'active' | 'at-risk')
		let status: 'active' | 'at-risk' = 'active'
		if (currentStreak > 0 && !isActiveToday) {
			status = 'at-risk' // Has streak but hasn't cooked today
		}

		return {
			currentStreak,
			weekProgress,
			isActiveToday,
			status,
		}
	}, [cookDates, user?.statistics?.streakCount])

	const topSuggestions = useMemo(() => suggestions.slice(0, 3), [suggestions])

	return (
		<aside
			className='relative hidden w-right flex-shrink-0 overflow-y-auto border-l border-border-subtle/60 bg-bg-card p-5 xl:flex xl:flex-col xl:gap-5'
			aria-label={t('ariaComplementaryContent')}
		>
			{/* Guest experience — compelling sign-up prompt instead of dead space */}
			{!user && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={TRANSITION_SPRING}
					className='overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card shadow-card'
				>
					<div
						className={cn(
							'rounded-[inherit]',
							isDiscoverySurface ? 'p-4' : 'p-6',
						)}
					>
						<p className='mb-2 text-2xs font-bold uppercase tracking-[0.18em] text-text-muted'>
							Guest Mode
						</p>
						<div className='mb-4 flex items-center gap-2'>
							<ChefHat className='size-5 text-brand' />
							<h3 className='text-sm font-bold text-text-primary sm:text-base'>
								{t('guestSidebarTitle')}
							</h3>
						</div>
						<p className='mb-4 text-sm leading-relaxed text-text-secondary'>
							{t('guestSidebarDesc')}
						</p>
						<div className='mb-4 rounded-xl border border-border-subtle/50 bg-bg-elevated p-3'>
							<p className='mb-2 text-xs font-bold uppercase tracking-[0.14em] text-text-muted'>
								{t('exploreNow')}
							</p>
							<div className='grid gap-2'>
								<Link
									href={PATHS.EXPLORE}
									className='group flex items-center justify-between rounded-lg border border-border-subtle/40 px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-brand/30 hover:bg-bg-card'
								>
									<span>{tNav('explore')}</span>
									<ArrowRight className='size-4 text-text-muted transition-transform group-hover:translate-x-0.5' />
								</Link>
								<Link
									href={PATHS.COMMUNITY ?? '/community'}
									className='group flex items-center justify-between rounded-lg border border-border-subtle/40 px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-brand/30 hover:bg-bg-card'
								>
									<span>{tNav('community')}</span>
									<ArrowRight className='size-4 text-text-muted transition-transform group-hover:translate-x-0.5' />
								</Link>
								<Link
									href={PATHS.LEADERBOARD}
									className='group flex items-center justify-between rounded-lg border border-border-subtle/40 px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-brand/30 hover:bg-bg-card'
								>
									<span>{tNav('leaderboard')}</span>
									<ArrowRight className='size-4 text-text-muted transition-transform group-hover:translate-x-0.5' />
								</Link>
							</div>
						</div>
						{!isDiscoverySurface && (
							<div className='mb-5 flex flex-col gap-2.5'>
								{[
									{ icon: Zap, text: t('guestBenefitXp'), color: 'text-xp' },
									{
										icon: Trophy,
										text: t('guestBenefitLevel'),
										color: 'text-level',
									},
									{
										icon: Users,
										text: t('guestBenefitCommunity'),
										color: 'text-brand',
									},
								].map(({ icon: Icon, text, color }) => (
									<div key={text} className='flex items-center gap-2.5'>
										<Icon className={cn('size-4 flex-shrink-0', color)} />
										<span className='text-sm text-text-secondary'>{text}</span>
									</div>
								))}
							</div>
						)}
						<Link
							href={guestSignUpHref}
							className='flex h-10 w-full items-center justify-center rounded-xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand/90'
						>
							{t('guestSidebarCta')}
						</Link>
						<p className='mt-2 text-center text-xs text-text-muted'>
							<Link
								href={guestSignInHref}
								className='font-semibold text-brand transition-colors hover:text-brand/80'
							>
								{t('guestSidebarSignIn')}
							</Link>
						</p>
					</div>
				</motion.div>
			)}

			{/* Authenticated sidebar content */}
			{user && (
				<div className='relative z-10 space-y-5'>
					{/* Sidebar error state — shown when data fetch fails entirely */}
					{sidebarError && (
						<div className='flex flex-col items-center gap-3 rounded-2xl border border-border-subtle/80 bg-gradient-to-br from-bg-card to-bg-elevated/60 p-4 text-center shadow-card'>
							<AlertTriangle className='size-5 text-text-muted' />
							<p className='text-xs text-text-secondary'>
								{t('sidebarLoadFailed')}
							</p>
							<button
								type='button'
								onClick={() => setRetryCount(c => c + 1)}
								className='flex items-center gap-1.5 rounded-xl bg-bg-card px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-hover'
							>
								<RefreshCw className='size-3' />
								{t('retry')}
							</button>
						</div>
					)}

					{/* Friends Online Widget — real-time via presence heartbeat */}
					<FriendsOnlineWidget />

					{/* Streak Widget */}
					<StreakWidget
						currentStreak={streakData.currentStreak}
						weekProgress={streakData.weekProgress}
						isActiveToday={streakData.isActiveToday}
						status={streakData.status}
					/>

					{/* Daily Challenge Banner (Expandable) */}
					{dailyChallenge && (
						<ExpandableDailyChallengeBanner
							challenge={dailyChallenge}
							onFindRecipe={() =>
								router.push(
									`/explore?search=${encodeURIComponent(dailyChallenge.title)}`,
								)
							}
						/>
					)}

					{/* Trending Creators Card */}
					{topSuggestions.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={TRANSITION_SPRING}
							className='overflow-hidden rounded-2xl border border-border-subtle/80 bg-bg-card shadow-card'
						>
							<div className='p-4'>
								<div className='mb-3.5 flex items-center justify-between'>
									<p className='text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted'>
										{t('suggestedCreators')}
									</p>
									<Link
										href={PATHS.COMMUNITY ?? '/community'}
										className='text-[11px] font-medium text-brand hover:underline'
									>
										{t('seeAll')}
									</Link>
								</div>
								<div className='flex flex-col gap-2.5'>
									{topSuggestions.map(suggestion => {
										const isFollowed = followedIds.includes(suggestion.userId)
										return (
											<div
												key={suggestion.userId}
												className='flex items-center gap-2.5 rounded-xl border border-border-subtle/50 bg-bg-elevated px-2.5 py-2'
											>
												<div className='relative size-9 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-border-subtle transition-all duration-200 hover:ring-border-medium'>
													<Image
														src={
															suggestion.avatarUrl || '/placeholder-avatar.svg'
														}
														alt={suggestion.displayName || suggestion.username}
														fill
														sizes='36px'
														className='object-cover'
													/>
												</div>
												<div className='min-w-0 flex-1'>
													<strong className='block truncate text-[13px] font-semibold leading-tight text-text-primary'>
														{suggestion.displayName || suggestion.username}
													</strong>
													<span className='block truncate text-[11px] leading-normal text-text-muted'>
														@{suggestion.username}
													</span>
												</div>
												<motion.button
													type='button'
													onClick={() => handleFollow(suggestion.userId)}
													aria-pressed={isFollowed}
													animate={
														isFollowed ? FOLLOW_PULSE.followed : undefined
													}
													initial={false}
													transition={TRANSITION_SPRING}
													className={cn(
														'relative h-8 shrink-0 overflow-hidden rounded-full px-3 text-[11px] font-semibold transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50',
														isFollowed
															? 'border border-border-medium bg-bg-elevated text-text-secondary hover:border-error/50 hover:text-error'
															: 'bg-brand text-white hover:bg-brand/90',
													)}
												>
													{isFollowed ? t('following') : t('follow')}
												</motion.button>
											</div>
										)
									})}
								</div>
							</div>
						</motion.div>
					)}
				</div>
			)}
		</aside>
	)
}
