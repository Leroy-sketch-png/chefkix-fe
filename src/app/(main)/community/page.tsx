'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { getFriends, getFollowers, getSuggestedFollows } from '@/services/social'
import {
	getLeaderboard,
	type LeaderboardEntry as LeaderboardServiceEntry,
} from '@/services/leaderboard'
import { Profile } from '@/lib/types'
import {
	Users,
	UserPlus,
	Trophy,
	Search,
	Sparkles,
	UsersRound,
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
import { TRANSITION_SPRING } from '@/lib/motion'
import { toast } from 'sonner'

export default function CommunityPage() {
	const { user } = useAuth()
	const router = useRouter()
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
				// Note: getAllProfiles removed - UserDiscoveryClient fetches its own data with pagination
				// Using 'global' leaderboard to show all users, not just friends
				const [friendsRes, followersRes, leaderboardRes, suggestedRes] = await Promise.all([
					getFriends(),
					getFollowers(),
					getLeaderboard({ type: 'global', timeframe: 'weekly' }),
					getSuggestedFollows(12),
				])

				if (cancelled) return

				if (friendsRes.success && friendsRes.data) {
					setFriends(friendsRes.data)
				}

				if (followersRes.success && followersRes.data) {
					// Filter to show only followers who we don't follow back (not yet mutual)
					// In Instagram model: followers who aren't in friends list = follow back suggestions
					const friendIds = new Set((friendsRes.data || []).map(f => f.userId))
					const followBackSuggestions = followersRes.data.filter(
						f => !friendIds.has(f.userId),
					)
					setFollowers(followBackSuggestions)
				}

				// Use real leaderboard data
				if (leaderboardRes.success && leaderboardRes.data?.entries) {
					const entries: LeaderboardEntry[] = leaderboardRes.data.entries.map(
						entry => ({
							...entry,
							isCurrentUser: entry.userId === user?.userId,
						}),
					)
					setLeaderboardEntries(entries)
				}

				if (suggestedRes.success && suggestedRes.data) {
					setSuggestedFollows(suggestedRes.data)
				}

				if (!friendsRes.success && !followersRes.success) {
					setError(true)
				}
			} catch {
				if (!cancelled) {
					setError(true)
					toast.error('Failed to load community data')
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		fetchData()
		return () => {
			cancelled = true
		}
	}, [user?.userId, retryKey])

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
			router.push(`/${entry.userId}`)
		}
	}

	if (error) {
		return (
			<PageContainer maxWidth='xl'>
				<ErrorState
					title='Failed to load community'
					message='We could not load community data. Please try again.'
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
			<PageContainer maxWidth='xl'>
				{/* Header */}
				<PageHeader
					icon={Users}
					title="Community Hub"
					subtitle="Connect with fellow chefs, discover talent, and climb the ranks."
					gradient="pink"
					marginBottom="md"
				/>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className='mb-6 grid w-full grid-cols-4 lg:w-auto'>
						<TabsTrigger value='discover' className='gap-2'>
							<Search className='size-4' />
							<span className='hidden sm:inline'>Discover</span>
						</TabsTrigger>
						<TabsTrigger value='friends' className='gap-2'>
							<Users className='size-4' />
							<span className='hidden sm:inline'>Friends</span>
							{friends.length > 0 && (
								<span className='ml-1 rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand'>
									{friends.length}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value='groups' className='gap-2'>
							<UsersRound className='size-4' />
							<span className='hidden sm:inline'>Groups</span>
						</TabsTrigger>
						<TabsTrigger value='leaderboard' className='gap-2'>
							<Trophy className='size-4' />
							<span className='hidden sm:inline'>Leaderboard</span>
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
									Follow Back Suggestions{' '}
									{followers.length > 0 && `(${followers.length})`}
								</h2>
							</div>
							{followers.length === 0 ? (
								<EmptyStateGamified
									variant='feed'
									title='No follow requests'
									description='Keep cooking and sharing — chefs will discover you!'
									quickActions={[
										{
											label: 'Browse Discover',
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

						{/* Suggested For You — AI-powered user discovery */}
						{suggestedFollows.length > 0 && (
							<section>
								<div className='mb-4 flex items-center gap-2'>
									<Sparkles className='size-5 text-brand' />
									<h2 className='text-xl font-semibold'>
										Suggested For You
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
									My Friends {friends.length > 0 && `(${friends.length})`}
								</h2>
							</div>
							{friends.length === 0 ? (
								<EmptyStateGamified
									variant='feed'
									title='No friends yet'
									description='Start connecting by following people in the Discover tab!'
									quickActions={[
										{
											label: 'Browse Discover',
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
							onCookToDefend={() => router.push('/explore')}
						/>
					</TabsContent>
				</Tabs>
			</PageContainer>
		</PageTransition>
	)
}
