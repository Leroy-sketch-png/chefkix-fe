'use client'

import { useEffect, useState } from 'react'
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
import { AnimatePresence } from 'framer-motion'
import { getAllProfiles } from '@/services/profile'
import { getFriends, getFollowers } from '@/services/social'
import {
	getLeaderboard,
	type LeaderboardEntry as LeaderboardServiceEntry,
} from '@/services/leaderboard'
import { Profile } from '@/lib/types'
import { Users, UserPlus, Trophy, Search } from 'lucide-react'
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

export default function CommunityPage() {
	const { user } = useAuth()
	const router = useRouter()
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
				<div className='mb-6 space-y-2'>
					<h1 className='bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent'>
						Community Hub
					</h1>
					<p className='text-muted-foreground'>
						Connect with fellow chefs, manage friendships, and discover new
						culinary talent.
					</p>
				</div>

				<Tabs defaultValue='discover' className='w-full'>
					<TabsList className='mb-6 grid w-full grid-cols-3 lg:w-auto'>
						<TabsTrigger value='discover' className='gap-2'>
							<Search className='h-4 w-4' />
							<span className='hidden sm:inline'>Discover</span>
						</TabsTrigger>
						<TabsTrigger value='friends' className='gap-2'>
							<Users className='h-4 w-4' />
							<span className='hidden sm:inline'>Friends</span>
							{friends.length > 0 && (
								<span className='ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary'>
									{friends.length}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value='leaderboard' className='gap-2'>
							<Trophy className='h-4 w-4' />
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
						{followers.length > 0 && (
							<section>
								<div className='mb-4 flex items-center gap-2'>
									<UserPlus className='h-5 w-5 text-primary' />
									<h2 className='text-xl font-semibold'>
										Follow Back Suggestions ({followers.length})
									</h2>
								</div>
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
							</section>
						)}

						<section>
							<div className='mb-4 flex items-center gap-2'>
								<Users className='h-5 w-5 text-primary' />
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
										{ label: 'Browse Discover', href: '#', emoji: '🔍' },
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
							onInviteFriends={() => {
								// Switch to discover tab
								const discoverTab = document.querySelector(
									'[data-state="inactive"][value="discover"]',
								) as HTMLButtonElement
								discoverTab?.click()
							}}
							onCookToDefend={() => router.push('/explore')}
						/>
					</TabsContent>
				</Tabs>
			</PageContainer>
		</PageTransition>
	)
}
