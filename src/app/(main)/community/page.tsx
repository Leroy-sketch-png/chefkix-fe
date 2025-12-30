'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { UserDiscoveryClient } from '@/components/discover/UserDiscoveryClient'
import { FollowSuggestionCard } from '@/components/social/FollowSuggestionCard'
import { FriendCard } from '@/components/social/FriendCard'
import { CommunitySkeleton } from '@/components/social/CommunitySkeleton'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { getAllProfiles } from '@/services/profile'
import { getFriends, getFollowers } from '@/services/social'
import {
	getLeaderboard,
	type LeaderboardEntry as LeaderboardServiceEntry,
} from '@/services/leaderboard'
import { Profile } from '@/lib/types'
import { Users, UserPlus, Trophy, Search, Sparkles } from 'lucide-react'
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
import { TRANSITION_SPRING } from '@/lib/motion'

export default function CommunityPage() {
	const { user } = useAuth()
	const router = useRouter()
	const [activeTab, setActiveTab] = useState('discover')
	const [allProfiles, setAllProfiles] = useState<Profile[]>([])
	const [friends, setFriends] = useState<Profile[]>([])
	const [followers, setFollowers] = useState<Profile[]>([])
	const [leaderboardEntries, setLeaderboardEntries] = useState<
		LeaderboardEntry[]
	>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [profilesRes, friendsRes, followersRes, leaderboardRes] =
					await Promise.all([
						getAllProfiles(),
						getFriends(),
						getFollowers(),
						getLeaderboard({ type: 'friends', timeframe: 'weekly' }),
					])

				if (profilesRes.success && profilesRes.data) {
					setAllProfiles(profilesRes.data)
				}

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

				if (
					!profilesRes.success &&
					!friendsRes.success &&
					!followersRes.success
				) {
					setError(true)
				}
			} catch {
				setError(true)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [user?.userId])

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
				{/* Header - Unified with Dashboard/Explore/Challenges pattern */}
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
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-social shadow-md shadow-xp/25'
						>
							<Users className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>Community Hub</h1>
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						Connect with fellow chefs, discover talent, and climb the ranks.
					</p>
				</motion.div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className='mb-6 grid w-full grid-cols-3 lg:w-auto'>
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
						<TabsTrigger value='leaderboard' className='gap-2'>
							<Trophy className='size-4' />
							<span className='hidden sm:inline'>Leaderboard</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value='discover' className='mt-0 animate-fadeIn'>
						{allProfiles.length === 0 ? (
							<EmptyStateGamified
								variant='feed'
								title='No users found'
								description='Start by inviting friends to join ChefKix!'
								primaryAction={{
									label: 'Invite Friends',
									href: '/invite',
								}}
							/>
						) : (
							<UserDiscoveryClient profiles={allProfiles} />
						)}
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

					<TabsContent value='leaderboard' className='mt-0 animate-fadeIn'>
						<FriendsLeaderboard
							entries={leaderboardEntries}
							totalFriends={friends.length}
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
