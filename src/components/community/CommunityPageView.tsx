'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { SurfaceSectionHeader } from '@/components/layout/PremiumSurface'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { CommunityCommandDeck } from '@/components/community/CommunityCommandDeck'
import { CommunityContextRail } from '@/components/community/CommunityContextRail'
import { UserDiscoveryClient } from '@/components/discover/UserDiscoveryClient'
import { FollowSuggestionCard } from '@/components/social/FollowSuggestionCard'
import { FriendCard } from '@/components/social/FriendCard'
import { CommunitySkeleton } from '@/components/social/CommunitySkeleton'
import { PostCard } from '@/components/social/PostCard'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { GroupsExploreGrid } from '@/components/groups'
import {
	getFriends,
	getFollowers,
	getSuggestedFollows,
} from '@/services/social'
import { getLeaderboard } from '@/services/leaderboard'
import { getFeedPosts } from '@/services/post'
import { Profile } from '@/lib/types'
import type { Post } from '@/lib/types/post'
import { Loader2 } from 'lucide-react'
import {
	FriendsLeaderboard,
	type LeaderboardEntry,
} from '@/components/leaderboard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useOnboardingOrchestrator } from '@/hooks/useOnboardingOrchestrator'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export type CommunityTab = 'discover' | 'friends' | 'groups' | 'leaderboard'

interface CommunityPageViewProps {
	initialTab?: CommunityTab
}

function getSafeTab(tab: CommunityTab, isAuthenticated: boolean): CommunityTab {
	if (!isAuthenticated && (tab === 'friends' || tab === 'groups')) {
		return 'discover'
	}

	return tab
}

export function CommunityPageView({
	initialTab = 'discover',
}: CommunityPageViewProps) {
	const { user, isAuthenticated } = useAuth()
	const t = useTranslations('community')
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()
	const [activeTab, setActiveTab] = useState<CommunityTab>(() =>
		getSafeTab(initialTab, isAuthenticated),
	)
	const [friends, setFriends] = useState<Profile[]>([])
	const [followers, setFollowers] = useState<Profile[]>([])
	const [suggestedFollows, setSuggestedFollows] = useState<Profile[]>([])
	const [leaderboardEntries, setLeaderboardEntries] = useState<
		LeaderboardEntry[]
	>([])
	const [pulsePosts, setPulsePosts] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)

	useOnboardingOrchestrator({ delay: 1000, condition: !loading })

	useEffect(() => {
		setActiveTab(currentTab => {
			const nextTab = getSafeTab(initialTab, isAuthenticated)
			return currentTab === nextTab ? currentTab : nextTab
		})
	}, [initialTab, isAuthenticated])

	const closestCompetitor = useMemo(() => {
		const currentUser = leaderboardEntries.find(entry => entry.isCurrentUser)
		if (!currentUser || currentUser.rank !== 1) return undefined
		const runnerUp = leaderboardEntries.find(entry => entry.rank === 2)
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
				const [leaderboardRes, pulseRes] = await Promise.allSettled([
					getLeaderboard({
						type: 'global',
						timeframe: 'weekly',
					}),
					getFeedPosts({ page: 0, size: 6, mode: 'trending' }),
				])

				if (cancelled) return

				if (
					pulseRes.status === 'fulfilled' &&
					pulseRes.value.success &&
					pulseRes.value.data
				) {
					setPulsePosts(pulseRes.value.data.slice(0, 6))
				}

				if (leaderboardRes.status !== 'fulfilled') throw leaderboardRes.reason
				const leaderboardData = leaderboardRes.value

				if (leaderboardData.success && leaderboardData.data?.entries) {
					const entries: LeaderboardEntry[] = leaderboardData.data.entries.map(
						entry => ({
							...entry,
							isCurrentUser: entry.userId === user?.userId,
						}),
					)
					setLeaderboardEntries(entries)
				}

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
							(friendsRes.data || []).map(friend => friend.userId),
						)
						const followBackSuggestions = followersRes.data.filter(
							follower => !friendIds.has(follower.userId),
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
		const follower = followers.find(profile => profile.userId === userId)
		if (follower) {
			setFollowers(prev => prev.filter(profile => profile.userId !== userId))
			setFriends(prev => [...prev, follower])
		}
	}

	const handleDismiss = (userId: string) => {
		setFollowers(prev => prev.filter(profile => profile.userId !== userId))
	}

	const handleSuggestedFollow = (userId: string) => {
		setSuggestedFollows(prev =>
			prev.filter(profile => profile.userId !== userId),
		)
	}

	const handleSuggestedDismiss = (userId: string) => {
		setSuggestedFollows(prev =>
			prev.filter(profile => profile.userId !== userId),
		)
	}

	const handleUnfollow = (userId: string) => {
		setFriends(prev => prev.filter(profile => profile.userId !== userId))
	}

	const handleLeaderboardUserClick = (entry: LeaderboardEntry) => {
		if (!entry.isCurrentUser) {
			startNavigationTransition(() => {
				router.push(`/${entry.userId}`)
			})
		}
	}

	const showContextRail = isAuthenticated

	if (error) {
		return (
			<div data-testid='community-page'>
				<PageContainer maxWidth='xl'>
					<ErrorState
						title={t('failedToLoad')}
						message={t('failedToLoadMessage')}
						onRetry={() => {
							setError(false)
							setRetryKey(key => key + 1)
						}}
					/>
				</PageContainer>
			</div>
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
			<div data-testid='community-page'>
				<AnimatePresence>
					{isNavigating && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed top-20 left-1/2 z-toast -translate-x-1/2'
						>
							<div className='flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow'>
								<Loader2 className='size-4 animate-spin' />
								{t('loading')}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<PageContainer maxWidth='2xl'>
					<div
						className={
							showContextRail
								? 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]'
								: 'grid grid-cols-1 gap-6'
						}
					>
						<div>
							<CommunityCommandDeck
								activeTab={activeTab}
								onTabChange={setActiveTab}
								isAuthenticated={isAuthenticated}
								counts={{
									friends: friends.length,
									followers: followers.length,
									suggested: suggestedFollows.length,
									leaderboard: leaderboardEntries.length,
								}}
								className='mb-4 sm:mb-5'
							/>

							{activeTab === 'discover' && (
								<div className='space-y-6 animate-fadeIn'>
									{pulsePosts.length > 0 && (
										<section className='space-y-3'>
											<SurfaceSectionHeader
												eyebrow='Live Food Pulse'
												chipText={`${pulsePosts.length} trending`}
											/>
											<div className='space-y-4'>
												{pulsePosts.map(post => (
													<PostCard
														key={post.id}
														post={post}
														currentUserId={user?.userId}
													/>
												))}
											</div>
										</section>
									)}
									<UserDiscoveryClient />
								</div>
							)}

							{isAuthenticated && activeTab === 'friends' && (
								<div className='space-y-8 animate-fadeIn'>
									<section>
										<SurfaceSectionHeader
											className='mb-4'
											eyebrow={t('followBackSuggestions')}
											chipText={`${followers.length}`}
										/>
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

									{suggestedFollows.length > 0 && (
										<section>
											<SurfaceSectionHeader
												className='mb-4'
												eyebrow={t('suggestedForYou')}
												chipText={`${suggestedFollows.length}`}
											/>
											<StaggerContainer staggerDelay={0.05}>
												<AnimatePresence mode='popLayout'>
													<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
														{suggestedFollows.map(profile => (
															<FollowSuggestionCard
																key={profile.userId}
																profile={profile}
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
										<SurfaceSectionHeader
											className='mb-4'
											eyebrow={t('myFriends')}
											chipText={`${friends.length}`}
										/>
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
								</div>
							)}

							{isAuthenticated && activeTab === 'groups' && (
								<div className='animate-fadeIn'>
									<GroupsExploreGrid currentUserId={user?.userId} />
								</div>
							)}

							{activeTab === 'leaderboard' && (
								<div className='animate-fadeIn'>
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
								</div>
							)}
						</div>

						{showContextRail && (
							<CommunityContextRail
								counts={{
									friends: friends.length,
									followers: followers.length,
									suggested: suggestedFollows.length,
									leaderboard: leaderboardEntries.length,
								}}
								showOnlineWidget={isAuthenticated}
							/>
						)}
					</div>

					<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
				</PageContainer>
			</div>
		</PageTransition>
	)
}
