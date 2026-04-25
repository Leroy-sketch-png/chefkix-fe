'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { UserDiscoveryClient } from '@/components/discover/UserDiscoveryClient'
import { FollowSuggestionCard } from '@/components/social/FollowSuggestionCard'
import { FriendCard } from '@/components/social/FriendCard'
import { CommunitySkeleton } from '@/components/social/CommunitySkeleton'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { GroupsExploreGrid } from '@/components/groups'
import {
	getFriends,
	getFollowers,
	getSuggestedFollows,
} from '@/services/social'
import {
	getLeaderboard,
	type LeaderboardEntry as LeaderboardServiceEntry,
} from '@/services/leaderboard'
import { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
	Users,
	UserPlus,
	Trophy,
	Search,
	Sparkles,
	UsersRound,
	Loader2,
} from 'lucide-react'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import {
	FriendsLeaderboard,
	type LeaderboardEntry,
} from '@/components/leaderboard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export default function CommunityPage() {
	const { user, isAuthenticated } = useAuth()
	const t = useTranslations('community')
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()
	const [activeTab, setActiveTab] = useState('discover')
	const [friends, setFriends] = useState<Profile[]>([])
	const [followers, setFollowers] = useState<Profile[]>([])
	const [suggestedFollows, setSuggestedFollows] = useState<Profile[]>([])
	const [leaderboardEntries, setLeaderboardEntries] = useState<
		LeaderboardEntry[]
	>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)

	// Onboarding hints
	useOnboardingOrchestrator({ delay: 1000, condition: !loading })

	// Compute closest competitor for CatchingUpAlert
	const closestCompetitor = useMemo(() => {
		const currentUser = leaderboardEntries.find(e => e.isCurrentUser)
		if (!currentUser || currentUser.rank !== 1) return undefined
		const runnerUp = leaderboardEntries.find(e => e.rank === 2)
		if (!runnerUp) return undefined
		return {
			entry: runnerUp,
			xpBehind: currentUser.xpThisWeek - runnerUp.xpThisWeek,
		}
	}, [leaderboardEntries])

	useEffect(() => {
		let cancelled = false

		const fetchData = async () => {
			try {
				// Leaderboard is public — always fetch
				const leaderboardRes = await getLeaderboard({
					type: 'global',
					timeframe: 'weekly',
				})

				if (cancelled) return

				if (leaderboardRes.success && leaderboardRes.data?.entries) {
					const entries: LeaderboardEntry[] = leaderboardRes.data.entries.map(
						entry => ({
							...entry,
							isCurrentUser: entry.userId === user?.userId,
						}),
					)
					setLeaderboardEntries(entries)
				}

				// Auth-only data: friends, followers, suggested follows
				if (isAuthenticated) {
					const [friendsRes, followersRes, suggestedRes] = await Promise.all([
						getFriends(),
						getFollowers(),
						getSuggestedFollows(12),
					])

					if (cancelled) return

					if (friendsRes.success && friendsRes.data) {
						setFriends(friendsRes.data)
					}

					if (followersRes.success && followersRes.data) {
						const friendIds = new Set(
							(friendsRes.data || []).map(f => f.userId),
						)
						const followBackSuggestions = followersRes.data.filter(
							f => !friendIds.has(f.userId),
						)
						setFollowers(followBackSuggestions)
					}

					if (suggestedRes.success && suggestedRes.data) {
						setSuggestedFollows(suggestedRes.data)
					}

					if (!friendsRes.success && !followersRes.success) {
						setError(true)
					}
				}
			} catch {
				if (!cancelled) {
					setError(true)
					toast.error(t('failedToLoadData'))
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		fetchData()
		return () => {
			cancelled = true
		}
	}, [user?.userId, isAuthenticated, retryKey, t])

	const handleFollowBack = (userId: string) => {
		// User followed back, move them from followers to friends
		const follower = followers.find(f => f.userId === userId)
		if (follower) {
			setFollowers(prev => prev.filter(f => f.userId !== userId))
			setFriends(prev => [...prev, follower])
		}
	}

	const handleDismiss = (userId: string) => {
		// Just remove from suggestions list (don't follow back)
		setFollowers(prev => prev.filter(f => f.userId !== userId))
	}

	const handleSuggestedFollow = (userId: string) => {
		setSuggestedFollows(prev => prev.filter(f => f.userId !== userId))
	}

	const handleSuggestedDismiss = (userId: string) => {
		setSuggestedFollows(prev => prev.filter(f => f.userId !== userId))
	}

	const handleUnfollow = (userId: string) => {
		// Unfollowing removes them from friends list
		setFriends(prev => prev.filter(friend => friend.userId !== userId))
	}

	const handleLeaderboardUserClick = (entry: LeaderboardEntry) => {
		if (!entry.isCurrentUser) {
			startNavigationTransition(() => {
				router.push(`/${entry.userId}`)
			})
		}
	}

	if (error) {
		return (
			<PageContainer maxWidth='xl'>
				<ErrorState
					title={t('failedToLoad')}
					message={t('failedToLoadMessage')}
					onRetry={() => {
						setError(false)
						setRetryKey(k => k + 1)
					}}
				/>
			</PageContainer>
		)
	}

	if (loading) {
		return (
			<PageContainer maxWidth='xl'>
				<CommunitySkeleton />
			</PageContainer>
		)
	}

	return (
		<PageTransition>
			{/* Global navigation loading indicator */}
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
			</AnimatePresence>

			<PageContainer maxWidth='xl'>
				{/* Header */}
				<PageHeader
					icon={Users}
					title={t('title')}
					subtitle={t('subtitle')}
					gradient='pink'
					marginBottom='md'
				/>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList
						className={cn(
							'mb-6 grid w-full lg:w-auto',
							isAuthenticated ? 'grid-cols-4' : 'grid-cols-2',
						)}
					>
						<TabsTrigger value='discover' className='gap-2'>
							<Search className='size-4' />
							<span className='hidden sm:inline'>{t('discover')}</span>
						</TabsTrigger>
						{isAuthenticated && (
							<TabsTrigger value='friends' className='gap-2'>
								<Users className='size-4' />
								<span className='hidden sm:inline'>{t('friends')}</span>
								{friends.length > 0 && (
									<span className='ml-1 rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium tabular-nums text-brand'>
										{friends.length}
									</span>
								)}
							</TabsTrigger>
						)}
						{isAuthenticated && (
							<TabsTrigger value='groups' className='gap-2'>
								<UsersRound className='size-4' />
								<span className='hidden sm:inline'>{t('groups')}</span>
							</TabsTrigger>
						)}
						<TabsTrigger value='leaderboard' className='gap-2'>
							<Trophy className='size-4' />
							<span className='hidden sm:inline'>{t('leaderboard')}</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value='discover' className='mt-0 animate-fadeIn'>
						{/* UserDiscoveryClient handles its own data fetching with pagination */}
						<UserDiscoveryClient />
					</TabsContent>

					<TabsContent
						value='friends'
						className='mt-0 space-y-8 animate-fadeIn'
					>
						<section>
							<div className='mb-4 flex items-center gap-2'>
								<UserPlus className='size-5 text-xp' />
								<h2 className='text-xl font-semibold'>
									{t('followBackSuggestions')}{' '}
									{followers.length > 0 && `(${followers.length})`}
								</h2>
							</div>
							{followers.length === 0 ? (
								<EmptyStateGamified
									variant='feed'
									title={t('noFollowRequests')}
									description={t('noFollowRequestsDesc')}
									quickActions={[
										{
											label: t('browseDiscover'),
											emoji: '🔍',
											onClick: () => setActiveTab('discover'),
										},
									]}
								/>
							) : (
								<StaggerContainer staggerDelay={0.05}>
									<AnimatePresence mode='popLayout'>
										<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
											{followers.map(follower => (
												<FollowSuggestionCard
													key={follower.userId}
													profile={follower}
													onFollowBack={handleFollowBack}
													onDismiss={handleDismiss}
												/>
											))}
										</div>
									</AnimatePresence>
								</StaggerContainer>
							)}
						</section>

						{/* {t('suggestedForYou')} — AI-powered user discovery */}
						{suggestedFollows.length > 0 && (
							<section>
								<div className='mb-4 flex items-center gap-2'>
									<Sparkles className='size-5 text-brand' />
									<h2 className='text-xl font-semibold'>
										{t('suggestedForYou')}
									</h2>
								</div>
								<StaggerContainer staggerDelay={0.05}>
									<AnimatePresence mode='popLayout'>
										<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
											{suggestedFollows.map(user => (
												<FollowSuggestionCard
													key={user.userId}
													profile={user}
													variant='suggested'
													onFollowBack={handleSuggestedFollow}
													onDismiss={handleSuggestedDismiss}
												/>
											))}
										</div>
									</AnimatePresence>
								</StaggerContainer>
							</section>
						)}

						<section>
							<div className='mb-4 flex items-center gap-2'>
								<Users className='size-5 text-xp' />
								<h2 className='text-xl font-semibold'>
									{t('myFriends')} {friends.length > 0 && `(${friends.length})`}
								</h2>
							</div>
							{friends.length === 0 ? (
								<EmptyStateGamified
									variant='feed'
									title={t('noFriendsYet')}
									description={t('noFriendsDesc')}
									quickActions={[
										{
											label: t('browseDiscover'),
											emoji: '🔍',
											onClick: () => setActiveTab('discover'),
										},
									]}
								/>
							) : (
								<StaggerContainer staggerDelay={0.05}>
									<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
										{friends.map(friend => (
											<FriendCard
												key={friend.userId}
												profile={friend}
												onUnfollow={handleUnfollow}
											/>
										))}
									</div>
								</StaggerContainer>
							)}
						</section>
					</TabsContent>

					<TabsContent value='groups' className='mt-0 animate-fadeIn'>
						<GroupsExploreGrid currentUserId={user?.userId} />
					</TabsContent>

					<TabsContent value='leaderboard' className='mt-0 animate-fadeIn'>
						<FriendsLeaderboard
							entries={leaderboardEntries}
							totalFriends={friends.length}
							isGlobal={true}
							closestCompetitor={closestCompetitor}
							onUserClick={handleLeaderboardUserClick}
							onInviteFriends={() => setActiveTab('discover')}
							onCookToDefend={() =>
								startNavigationTransition(() => {
									router.push('/explore')
								})
							}
						/>
					</TabsContent>
				</Tabs>

				{/* Bottom breathing room for MobileBottomNav */}
				<div className='pb-40 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
