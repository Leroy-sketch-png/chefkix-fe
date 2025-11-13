'use client'

import { useEffect, useState } from 'react'
import { getFriends, getFriendRequests } from '@/services/social'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/ui/empty-state'
import { PageContainer } from '@/components/layout/PageContainer'
import { Users, UserPlus } from 'lucide-react'
import lottieNotFound from '@/../public/lottie/lottie-not-found.json'
import lottieLoading from '@/../public/lottie/lottie-loading.json'
import { Profile } from '@/lib/types'
import { FriendRequestCard } from '@/components/social/FriendRequestCard'
import { FriendCard } from '@/components/social/FriendCard'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

const FriendsPage = () => {
	const [friends, setFriends] = useState<Profile[]>([])
	const [friendRequests, setFriendRequests] = useState<Profile[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [friendsRes, requestsRes] = await Promise.all([
					getFriends(),
					getFriendRequests(),
				])

				if (friendsRes.success && friendsRes.data) {
					setFriends(friendsRes.data)
				}

				if (requestsRes.success && requestsRes.data) {
					setFriendRequests(requestsRes.data)
				}

				if (!friendsRes.success && !requestsRes.success) {
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
			<ErrorState
				title='Failed to load friends'
				message='We could not load your friends data. Please try again.'
			/>
		)
	}

	if (loading) {
		return (
			<PageContainer maxWidth='2xl'>
				{/* Centered Lottie loading animation */}
				<div className='flex justify-center py-12'>
					<LottieAnimation
						lottie={lottieLoading}
						sizeOfIllustrator={(w, h) => Math.min(w * 0.4, h * 0.5, 200)}
						loop
						autoplay
					/>
				</div>
				<div className='mb-6 space-y-2'>
					<div className='h-9 w-48 animate-pulse rounded-lg bg-bg-card' />
					<div className='h-5 w-64 animate-pulse rounded-lg bg-bg-card' />
				</div>
				<div className='space-y-4'>
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className='h-24 w-full animate-pulse rounded-lg bg-bg-card'
						/>
					))}
				</div>
			</PageContainer>
		)
	}

	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-6 space-y-2'>
				<h1 className='text-3xl font-bold text-text-primary'>Friends</h1>
				<p className='text-text-secondary'>
					Connect with fellow cooking enthusiasts
				</p>
			</div>

			{/* Friend Requests Section */}
			<div className='mb-8'>
				<h2 className='mb-4 text-xl font-semibold text-text-primary'>
					Friend Requests
					{friendRequests.length > 0 && (
						<span className='ml-2 text-sm text-text-secondary'>
							({friendRequests.length})
						</span>
					)}
				</h2>
				{friendRequests.length > 0 ? (
					<StaggerContainer className='space-y-4'>
						<AnimatePresence mode='popLayout'>
							{friendRequests.map(request => (
								<FriendRequestCard
									key={request.userId}
									profile={request}
									onAccept={handleRequestAccepted}
									onDecline={handleRequestDeclined}
								/>
							))}
						</AnimatePresence>
					</StaggerContainer>
				) : (
					<EmptyState
						title='No friend requests'
						description='When someone sends you a friend request, it will appear here.'
						icon={UserPlus}
						lottieAnimation={lottieNotFound}
					/>
				)}
			</div>

			{/* Friends List Section */}
			<div>
				<h2 className='mb-4 text-xl font-semibold text-text-primary'>
					My Friends
					{friends.length > 0 && (
						<span className='ml-2 text-sm text-text-secondary'>
							({friends.length})
						</span>
					)}
				</h2>
				{friends.length > 0 ? (
					<StaggerContainer className='space-y-4'>
						<AnimatePresence mode='popLayout'>
							{friends.map(friend => (
								<FriendCard
									key={friend.userId}
									profile={friend}
									onUnfriend={handleUnfriend}
								/>
							))}
						</AnimatePresence>
					</StaggerContainer>
				) : (
					<EmptyState
						title='No friends yet'
						description='Start connecting with other chefs! Search for users in the discover page and send them friend requests.'
						icon={Users}
						actionLabel='Discover Chefs'
						actionHref='/discover'
						lottieAnimation={lottieNotFound}
					/>
				)}
			</div>
		</PageContainer>
	)
}

export default FriendsPage
