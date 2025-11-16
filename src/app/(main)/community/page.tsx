'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/ui/empty-state'
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
import lottieNotFound from '@/../public/lottie/lottie-not-found.json'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export default function CommunityPage() {
	const [allProfiles, setAllProfiles] = useState<Profile[]>([])
	const [friends, setFriends] = useState<Profile[]>([])
	const [friendRequests, setFriendRequests] = useState<Profile[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')

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
							<EmptyState
								lottieAnimation={lottieNotFound}
								lottieSize={() => 200}
								title='No users found'
								description='Start by inviting friends to join ChefKix!'
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
								<EmptyState
									lottieAnimation={lottieNotFound}
									lottieSize={() => 200}
									title='No friends yet'
									description='Start connecting by sending friend requests in the Discover tab!'
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
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Trophy className='h-5 w-5 text-primary' />
									Community Leaderboard
								</CardTitle>
								<CardDescription>
									Top chefs ranked by XP, level, and community engagement
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='mb-6'>
									<InputGroup>
										<InputGroupAddon align='inline-start'>
											<Search className='h-4 w-4 text-muted-foreground' />
										</InputGroupAddon>
										<InputGroupInput
											placeholder='Search leaderboard...'
											value={searchTerm}
											onChange={e => setSearchTerm(e.target.value)}
										/>
									</InputGroup>
								</div>
								<EmptyState
									lottieAnimation={lottieNotFound}
									lottieSize={() => 200}
									title='Leaderboard Coming Soon'
									description='Real-time rankings and community stats will appear here once the backend integration is complete.'
								/>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</PageContainer>
		</PageTransition>
	)
}
