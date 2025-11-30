'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { UserDiscoveryClient } from '@/components/discover/UserDiscoveryClient'
import { FriendRequestCard } from '@/components/social/FriendRequestCard'
import { FriendCard } from '@/components/social/FriendCard'
import { CommunitySkeleton } from '@/components/social/CommunitySkeleton'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { AnimatePresence } from 'framer-motion'
import { getAllProfiles } from '@/services/profile'
import { getFriends, getFriendRequests } from '@/services/social'
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
	const [friendRequests, setFriendRequests] = useState<Profile[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [profilesRes, friendsRes, requestsRes] = await Promise.all([
					getAllProfiles(),
					getFriends(),
					getFriendRequests(),
				])

				if (profilesRes.success && profilesRes.data) {
					setAllProfiles(profilesRes.data)
				}

				if (friendsRes.success && friendsRes.data) {
					setFriends(friendsRes.data)
				}

				if (requestsRes.success && requestsRes.data) {
					setFriendRequests(requestsRes.data)
				}

				if (
					!profilesRes.success &&
					!friendsRes.success &&
					!requestsRes.success
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
	}, [])

	const handleRequestAccepted = (userId: string) => {
		setFriendRequests(prev => prev.filter(req => req.userId !== userId))
	}

	const handleRequestDeclined = (userId: string) => {
		setFriendRequests(prev => prev.filter(req => req.userId !== userId))
	}

	const handleUnfriend = (userId: string) => {
		setFriends(prev => prev.filter(friend => friend.userId !== userId))
	}

	// Transform friends to leaderboard entries (mock XP data for now)
	const leaderboardEntries: LeaderboardEntry[] = friends
		.map((friend, index) => ({
			userId: friend.userId ?? `friend-${index}`,
			username: friend.username || 'chef',
			displayName: friend.displayName || friend.username || 'Chef',
			avatarUrl: friend.avatarUrl || '/images/default-avatar.png',
			rank: index + 2, // Current user is rank 1
			level: Math.floor(Math.random() * 10) + 1,
			xpThisWeek: Math.floor(Math.random() * 500) + 100,
			recipesCooked: Math.floor(Math.random() * 10) + 1,
			streak: Math.floor(Math.random() * 7),
			isCurrentUser: false,
		}))
		.concat(
			user
				? [
						{
							userId: user.userId ?? 'me',
							username: user.username || 'me',
							displayName: user.displayName || user.username || 'You',
							avatarUrl: user.avatarUrl || '/images/default-avatar.png',
							rank: 1,
							level: user.statistics?.currentLevel ?? 1,
							xpThisWeek: user.statistics?.currentXP ?? 500,
							recipesCooked: 5,
							streak: user.statistics?.streakCount ?? 3,
							isCurrentUser: true,
						},
					]
				: [],
		)
		.sort((a, b) => b.xpThisWeek - a.xpThisWeek)
		.map((entry, index) => ({ ...entry, rank: index + 1 }))

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
						{friendRequests.length > 0 && (
							<section>
								<div className='mb-4 flex items-center gap-2'>
									<UserPlus className='h-5 w-5 text-primary' />
									<h2 className='text-xl font-semibold'>
										Friend Requests ({friendRequests.length})
									</h2>
								</div>
								<StaggerContainer staggerDelay={0.05}>
									<AnimatePresence mode='popLayout'>
										<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
											{friendRequests.map(request => (
												<FriendRequestCard
													key={request.userId}
													profile={request}
													onAccept={handleRequestAccepted}
													onDecline={handleRequestDeclined}
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
									description='Start connecting by sending friend requests in the Discover tab!'
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
												onUnfriend={handleUnfriend}
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
