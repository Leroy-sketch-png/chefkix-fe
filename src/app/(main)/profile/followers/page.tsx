'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { FollowUserCard } from '@/components/profile/FollowUserCard'
import { FollowSuggestionCard } from '@/components/social/FollowSuggestionCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import {
	getFollowers,
	getFollowing,
	getFriends,
	getSuggestedFollows,
} from '@/services/social'
import { Profile } from '@/lib/types/profile'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { Users, UserCheck, Heart, ArrowLeft, Sparkles } from 'lucide-react'
import { TRANSITION_SPRING, BUTTON_SUBTLE_TAP } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import {
	PremiumSurface,
	SurfaceSectionHeader,
} from '@/components/layout/PremiumSurface'
import {
	getSettledProfileNetworkCount,
	getSettledProfileNetworkTotal,
	parseProfileNetworkTab,
	PROFILE_NETWORK_TABS,
	type ProfileNetworkTab,
} from '@/lib/profile-network-proof'

const TABS: {
	key: ProfileNetworkTab
	labelKey: string
	icon: React.ReactNode
}[] = [
	{
		key: 'followers',
		labelKey: 'tabFollowers',
		icon: <Users className='size-4' />,
	},
	{
		key: 'following',
		labelKey: 'tabFollowing',
		icon: <UserCheck className='size-4' />,
	},
	{
		key: 'friends',
		labelKey: 'tabFriends',
		icon: <Heart className='size-4' />,
	},
]

const TAB_FETCHERS: Record<
	ProfileNetworkTab,
	() => ReturnType<typeof getFollowers>
> = {
	followers: getFollowers,
	following: getFollowing,
	friends: getFriends,
}

interface RequestGuard {
	cancelled: boolean
}

function FollowersSkeleton() {
	return (
		<div className='space-y-3'>
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					key={i}
					className='flex items-center gap-3 rounded-radius border border-border-subtle bg-bg-card p-4'
				>
					<Skeleton className='size-10 rounded-full' />
					<div className='flex-1 space-y-1.5'>
						<Skeleton className='h-4 w-32' />
						<Skeleton className='h-3 w-20' />
					</div>
					<Skeleton className='h-8 w-24 rounded-md' />
				</div>
			))}
		</div>
	)
}

function FollowersContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const t = useTranslations('followers')
	const tc = useTranslations('common')
	const [activeTab, setActiveTab] = useState<ProfileNetworkTab>(() =>
		parseProfileNetworkTab(searchParams.get('tab')),
	)
	const [data, setData] = useState<Record<ProfileNetworkTab, Profile[]>>({
		followers: [],
		following: [],
		friends: [],
	})
	const [loading, setLoading] = useState<Record<ProfileNetworkTab, boolean>>({
		followers: true,
		following: true,
		friends: true,
	})
	const [errors, setErrors] = useState<
		Record<ProfileNetworkTab, string | null>
	>({
		followers: null,
		following: null,
		friends: null,
	})

	// Suggested follows state
	const [suggestions, setSuggestions] = useState<Profile[]>([])
	const [suggestionsLoading, setSuggestionsLoading] = useState(false)
	const [suggestionsLoaded, setSuggestionsLoaded] = useState(false)
	const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

	const fetchTab = useCallback(
		async (tab: ProfileNetworkTab, guard?: RequestGuard) => {
			setLoading(prev => ({ ...prev, [tab]: true }))
			setErrors(prev => ({ ...prev, [tab]: null }))

			try {
				const response = await TAB_FETCHERS[tab]()
				if (guard?.cancelled) return
				if (response.success && response.data) {
					setData(prev => ({ ...prev, [tab]: response.data! }))
				} else {
					setErrors(prev => ({
						...prev,
						[tab]: response.message || t('failedToLoad', { tab }),
					}))
				}
			} catch {
				if (guard?.cancelled) return
				setErrors(prev => ({ ...prev, [tab]: t('failedToLoad', { tab }) }))
			} finally {
				if (!guard?.cancelled) {
					setLoading(prev => ({ ...prev, [tab]: false }))
				}
			}
		},
		[t],
	)

	const fetchSuggestions = useCallback(async () => {
		if (suggestionsLoaded || suggestionsLoading) return
		setSuggestionsLoading(true)
		try {
			const response = await getSuggestedFollows(8)
			if (response.success && response.data) {
				setSuggestions(response.data)
			}
		} catch {
			// Silent fail — suggestions are non-critical
		} finally {
			setSuggestionsLoading(false)
			setSuggestionsLoaded(true)
		}
	}, [suggestionsLoaded, suggestionsLoading])

	// Prepare all three lanes together; each request still settles independently.
	useEffect(() => {
		const guard: RequestGuard = { cancelled: false }
		void Promise.all(PROFILE_NETWORK_TABS.map(tab => fetchTab(tab, guard)))
		return () => {
			guard.cancelled = true
		}
	}, [fetchTab])

	useEffect(() => {
		const shouldLoadSuggestions =
			(activeTab === 'following' || activeTab === 'friends') &&
			!loading[activeTab] &&
			!errors[activeTab] &&
			data[activeTab].length === 0 &&
			!suggestionsLoaded

		if (shouldLoadSuggestions) {
			void fetchSuggestions()
		}
	}, [activeTab, data, errors, fetchSuggestions, loading, suggestionsLoaded])

	const handleSuggestionFollowed = (userId: string) => {
		// Move from suggestions to following list
		const followed = suggestions.find(p => p.userId === userId)
		if (followed) {
			setSuggestions(prev => prev.filter(p => p.userId !== userId))
			setData(prev => ({
				...prev,
				following: [...prev.following, { ...followed, isFollowing: true }],
			}))
		}
	}

	const handleSuggestionDismissed = (userId: string) => {
		setDismissedIds(prev => new Set(prev).add(userId))
		setSuggestions(prev => prev.filter(p => p.userId !== userId))
	}

	const visibleSuggestions = suggestions.filter(
		s => !dismissedIds.has(s.userId),
	)

	const handleFollowChange = (userId: string, isNowFollowing: boolean) => {
		// Update local state when follow status changes
		setData(prev => {
			const updated = { ...prev }
			// If we unfollowed someone, remove from "following" list
			if (!isNowFollowing) {
				updated.following = updated.following.filter(p => p.userId !== userId)
				// Also remove from friends (no longer mutual)
				updated.friends = updated.friends.filter(p => p.userId !== userId)
			}
			return updated
		})
	}

	const currentList = data[activeTab]
	const isLoading = loading[activeTab]
	const error = errors[activeTab]
	const settledCounts: Record<ProfileNetworkTab, number | null> = {
		followers: getSettledProfileNetworkCount({
			isLoading: loading.followers,
			error: errors.followers,
			count: data.followers.length,
		}),
		following: getSettledProfileNetworkCount({
			isLoading: loading.following,
			error: errors.following,
			count: data.following.length,
		}),
		friends: getSettledProfileNetworkCount({
			isLoading: loading.friends,
			error: errors.friends,
			count: data.friends.length,
		}),
	}
	const settledTotalLinks = getSettledProfileNetworkTotal([
		{
			isLoading: loading.followers,
			error: errors.followers,
			count: data.followers.length,
		},
		{
			isLoading: loading.following,
			error: errors.following,
			count: data.following.length,
		},
	])

	return (
		<PageTransition>
			<PageContainer maxWidth='md'>
				<PremiumSurface
					eyebrow={tc('eyebrows.socialGraph')}
					chipText={
						settledTotalLinks === null
							? undefined
							: tc('eyebrows.totalLinks', { n: settledTotalLinks })
					}
					tone='xp'
					className='mb-6 p-3 md:p-4'
				>
					<div className='flex items-center gap-3'>
						<motion.button
							type='button'
							onClick={() => router.back()}
							whileTap={BUTTON_SUBTLE_TAP}
							className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand/50'
							aria-label={t('ariaGoBack')}
						>
							<ArrowLeft className='size-5' />
						</motion.button>
						<div className='flex-1'>
							<PageHeader
								icon={Users}
								title={t('networkTitle')}
								subtitle={t('networkSubtitle')}
								gradient='purple'
								marginBottom='sm'
								className='mb-0'
							/>
						</div>
					</div>
				</PremiumSurface>

				<PremiumSurface
					eyebrow={tc('eyebrows.networkLanes')}
					chipText={t(
						TABS.find(tab => tab.key === activeTab)?.labelKey || 'tabFollowers',
					)}
					className='mb-6 p-3 md:p-4'
				>
					<div className='flex gap-2 rounded-radius border border-border-subtle bg-bg-elevated p-1'>
						{TABS.map(tab => {
							const count = settledCounts[tab.key]
							return (
								<button
									type='button'
									key={tab.key}
									onClick={() => setActiveTab(tab.key)}
									className={cn(
										'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
										activeTab === tab.key
											? 'bg-bg-card text-text-primary shadow-card'
											: 'text-text-muted hover:text-text-secondary',
									)}
								>
									{tab.icon}
									{t(tab.labelKey)}
									{count !== null ? (
										<span
											className={cn(
												'ml-1 flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-2xs font-bold',
												activeTab === tab.key
													? 'bg-brand/15 text-brand'
													: 'bg-bg-elevated text-text-muted',
											)}
										>
											{count}
										</span>
									) : null}
								</button>
							)
						})}
					</div>
				</PremiumSurface>

				{/* Content */}
				<PremiumSurface
					eyebrow={tc('eyebrows.peopleResults')}
					chipText={
						isLoading
							? tc('eyebrows.loading')
							: error
								? undefined
								: tc('eyebrows.nProfiles', { n: currentList.length })
					}
					className='p-3 md:p-4'
				>
					<SurfaceSectionHeader
						eyebrow={tc('eyebrows.relationshipActions')}
						chipText={tc('eyebrows.followUnfollowConnect')}
						className='mb-3'
					/>
					<AnimatePresence mode='wait'>
						<motion.div
							key={activeTab}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={TRANSITION_SPRING}
						>
							{isLoading ? (
								<FollowersSkeleton />
							) : error ? (
								<ErrorState
									title={t('failedToLoad', { tab: activeTab })}
									message={error}
									onRetry={() => fetchTab(activeTab)}
								/>
							) : currentList.length === 0 ? (
								<div className='space-y-6'>
									{/* Suggested follows section — shown on empty following/friends tabs */}
									{(activeTab === 'following' || activeTab === 'friends') &&
									suggestionsLoading ? (
										<FollowersSkeleton />
									) : (activeTab === 'following' || activeTab === 'friends') &&
									  visibleSuggestions.length > 0 ? (
										<div className='space-y-4'>
											<div className='flex items-center gap-2 text-text-secondary'>
												<Sparkles className='size-4 text-brand' />
												<h3 className='text-sm font-semibold'>
													{activeTab === 'following'
														? t('chefsYouMightLike')
														: t('followChefsToMakeFriends')}
												</h3>
											</div>
											<StaggerContainer className='space-y-3'>
												{visibleSuggestions.map(profile => (
													<FollowSuggestionCard
														key={profile.userId}
														profile={profile}
														variant='suggested'
														onFollowBack={handleSuggestionFollowed}
														onDismiss={handleSuggestionDismissed}
													/>
												))}
											</StaggerContainer>
										</div>
									) : (
										<EmptyStateGamified
											title={t('noFollowersYet', { tab: activeTab })}
											description={
												activeTab === 'followers'
													? t('followersEmptyDesc')
													: activeTab === 'following'
														? t('followingEmptyDesc')
														: t('friendsEmptyDesc')
											}
											illustration={
												TABS.find(t => t.key === activeTab)?.icon || (
													<Users className='size-6' />
												)
											}
										/>
									)}
								</div>
							) : (
								<StaggerContainer className='space-y-3'>
									{currentList.map(profile => (
										<FollowUserCard
											key={profile.userId}
											profile={profile}
											isMutual={
												activeTab === 'friends' ||
												profile.relationshipStatus === 'FRIENDS'
											}
											onFollowChange={handleFollowChange}
										/>
									))}
								</StaggerContainer>
							)}
						</motion.div>
					</AnimatePresence>
				</PremiumSurface>

				<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}

export default function FollowersPage() {
	return (
		<Suspense
			fallback={
				<PageContainer maxWidth='lg'>
					<div className='space-y-6 py-6'>
						<div className='space-y-3'>
							<Skeleton className='h-8 w-48 rounded-xl' />
							<Skeleton className='h-5 w-72 rounded-xl' />
						</div>
						<div className='grid gap-4 sm:grid-cols-2'>
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={i} className='h-40 w-full rounded-xl' />
							))}
						</div>
					</div>
				</PageContainer>
			}
		>
			<FollowersContent />
		</Suspense>
	)
}
