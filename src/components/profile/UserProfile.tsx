'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Profile, RelationshipStatus } from '@/lib/types'
import {
	Award,
	UserPlus,
	UserCheck,
	MessageCircle,
	Clock,
	UserX,
	Settings,
	Share2,
	Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	toggleFollow,
	toggleFriendRequest,
	unfriendUser,
	acceptFriendRequest,
	declineFriendRequest,
} from '@/services/social'
import Link from 'next/link'
import { toast } from 'sonner'
import { triggerFriendConfetti } from '@/lib/confetti'
import { motion } from 'framer-motion'
import { SOCIAL_MESSAGES } from '@/constants/messages'

type UserProfileProps = {
	profile: Profile
	currentUserId?: string // Make currentUserId optional
}

export const UserProfile = ({
	profile: initialProfile,
	currentUserId,
}: UserProfileProps) => {
	const [profile, setProfile] = useState<Profile>(initialProfile)
	const [isLoading, setIsLoading] = useState(false)
	const isOwnProfile = profile.userId === currentUserId

	const handleFollow = async () => {
		setIsLoading(true)
		const wasFollowing = profile.isFollowing

		// Optimistic UI update
		setProfile(prev => ({
			...prev,
			isFollowing: !prev.isFollowing,
			statistics: {
				...prev.statistics,
				followerCount: prev.isFollowing
					? prev.statistics.followerCount - 1
					: prev.statistics.followerCount + 1,
			},
		}))

		const response = await toggleFollow(profile.userId)

		if (response.success && response.data) {
			setProfile(response.data)
			toast.success(
				wasFollowing
					? `Unfollowed ${profile.displayName}`
					: `Now following ${profile.displayName}`,
			)
		} else {
			// Revert optimistic update on error
			setProfile(prev => ({
				...prev,
				isFollowing: wasFollowing,
				statistics: {
					...prev.statistics,
					followerCount: wasFollowing
						? prev.statistics.followerCount + 1
						: prev.statistics.followerCount - 1,
				},
			}))
			toast.error(response.message || 'Failed to update follow status')
		}

		setIsLoading(false)
	}

	const handleFriendRequest = async () => {
		setIsLoading(true)
		const previousStatus = profile.relationshipStatus
		const previousRequestCount = profile.statistics.friendRequestCount

		// Optimistic UI update
		const newStatus: RelationshipStatus =
			previousStatus === 'PENDING_SENT' ? 'NOT_FRIENDS' : 'PENDING_SENT'

		// Update relationshipStatus AND friendRequestCount according to API spec
		setProfile(prev => ({
			...prev,
			relationshipStatus: newStatus,
			statistics: {
				...prev.statistics,
				// Increment if sending request, decrement if cancelling
				friendRequestCount:
					newStatus === 'PENDING_SENT'
						? prev.statistics.friendRequestCount + 1
						: prev.statistics.friendRequestCount - 1,
			},
		}))

		const response = await toggleFriendRequest(profile.userId)

		if (response.success && response.data) {
			// Server returns the full profile with updated statistics
			setProfile(response.data)
			toast.success(
				previousStatus === 'PENDING_SENT'
					? 'Friend request cancelled'
					: 'Friend request sent!',
			)
		} else {
			// Revert on error
			setProfile(prev => ({
				...prev,
				relationshipStatus: previousStatus,
				statistics: {
					...prev.statistics,
					friendRequestCount: previousRequestCount,
				},
			}))
			toast.error(response.message || 'Failed to send friend request')
		}

		setIsLoading(false)
	}

	const handleUnfriend = async () => {
		setIsLoading(true)
		const previousFriendCount = profile.statistics.friendCount

		// Optimistic UI update
		setProfile(prev => ({
			...prev,
			relationshipStatus: 'NOT_FRIENDS' as RelationshipStatus,
			statistics: {
				...prev.statistics,
				friendCount: prev.statistics.friendCount - 1,
			},
		}))

		const response = await unfriendUser(profile.userId)

		if (response.success && response.data) {
			// The unfriend response is smaller, so we merge it manually
			setProfile(prev => ({
				...prev,
				relationshipStatus: response.data.relationshipStatus,
				statistics: {
					...prev.statistics,
					friendCount: response.data.statistics.friendCount,
				},
			}))
			toast.success(`Removed ${profile.displayName} from friends`)
		} else {
			// Revert on error
			setProfile(prev => ({
				...prev,
				relationshipStatus: 'FRIENDS' as RelationshipStatus,
				statistics: {
					...prev.statistics,
					friendCount: previousFriendCount,
				},
			}))
			toast.error(response.message || 'Failed to unfriend user')
		}

		setIsLoading(false)
	}

	const handleAcceptFriend = async () => {
		setIsLoading(true)
		const previousStatus = profile.relationshipStatus
		const previousFriendCount = profile.statistics.friendCount
		const previousRequestCount = profile.statistics.friendRequestCount

		// Optimistic UI update
		// According to API spec: accepting increments friendCount for both users
		setProfile(prev => ({
			...prev,
			relationshipStatus: 'FRIENDS' as RelationshipStatus,
			statistics: {
				...prev.statistics,
				friendCount: prev.statistics.friendCount + 1,
				// The request is consumed, so decrement friendRequestCount
				friendRequestCount: Math.max(0, prev.statistics.friendRequestCount - 1),
			},
		}))

		const response = await acceptFriendRequest(profile.userId)

		if (response.success && response.data) {
			// Server returns full profile with updated statistics
			setProfile(response.data)
			toast.success(`You and ${profile.displayName} are now friends!`)
			// Celebrate with confetti! 🎉
			triggerFriendConfetti()
		} else {
			// Revert on error
			setProfile(prev => ({
				...prev,
				relationshipStatus: previousStatus,
				statistics: {
					...prev.statistics,
					friendCount: previousFriendCount,
					friendRequestCount: previousRequestCount,
				},
			}))
			toast.error(response.message || 'Failed to accept friend request')
		}

		setIsLoading(false)
	}

	const handleDeclineFriend = async () => {
		setIsLoading(true)
		const previousStatus = profile.relationshipStatus
		const previousRequestCount = profile.statistics.friendRequestCount

		// Optimistic UI update
		// According to API spec: declining decrements friendRequestCount
		setProfile(prev => ({
			...prev,
			relationshipStatus: 'NOT_FRIENDS' as RelationshipStatus,
			statistics: {
				...prev.statistics,
				// The request is consumed, so decrement friendRequestCount
				friendRequestCount: Math.max(0, prev.statistics.friendRequestCount - 1),
			},
		}))

		const response = await declineFriendRequest(profile.userId)

		if (response.success && response.data) {
			// Decline response is smaller, merge manually
			setProfile(prev => ({
				...prev,
				relationshipStatus: response.data.relationshipStatus,
				isFollowing: response.data.isFollowing,
				statistics: {
					...prev.statistics,
					...response.data.statistics,
				},
			}))
			toast.success(SOCIAL_MESSAGES.FRIEND_REQUEST_DECLINED)
		} else {
			// Revert on error
			setProfile(prev => ({
				...prev,
				relationshipStatus: previousStatus,
				statistics: {
					...prev.statistics,
					friendRequestCount: previousRequestCount,
				},
			}))
			toast.error(response.message || 'Failed to decline friend request')
		}

		setIsLoading(false)
	}

	const renderFollowButton = () => {
		if (isOwnProfile) return null

		if (profile.isFollowing) {
			return (
				<Button onClick={handleFollow} variant='secondary' disabled={isLoading}>
					<UserCheck className='mr-2 h-4 w-4' />
					Following
				</Button>
			)
		}
		return (
			<Button onClick={handleFollow} disabled={isLoading}>
				<UserPlus className='mr-2 h-4 w-4' />
				Follow
			</Button>
		)
	}

	const renderFriendButton = () => {
		if (isOwnProfile) return null

		switch (profile.relationshipStatus) {
			case 'FRIENDS':
				return (
					<Button
						onClick={handleUnfriend}
						variant='destructive'
						disabled={isLoading}
					>
						<UserX className='mr-2 h-4 w-4' />
						Unfriend
					</Button>
				)
			case 'PENDING_SENT':
				return (
					<Button
						onClick={handleFriendRequest}
						variant='secondary'
						disabled={isLoading}
					>
						<Clock className='mr-2 h-4 w-4' />
						Pending
					</Button>
				)
			case 'PENDING_RECEIVED':
				return (
					<div className='flex gap-2'>
						<Button
							onClick={handleAcceptFriend}
							variant='default'
							disabled={isLoading}
						>
							<UserCheck className='mr-2 h-4 w-4' />
							Accept
						</Button>
						<Button
							onClick={handleDeclineFriend}
							variant='outline'
							disabled={isLoading}
						>
							Decline
						</Button>
					</div>
				)
			default:
				return (
					<Button
						onClick={handleFriendRequest}
						variant='secondary'
						disabled={isLoading}
					>
						<UserPlus className='mr-2 h-4 w-4' />
						Add Friend
					</Button>
				)
		}
	}

	return (
		<div className='mx-auto my-8 max-w-4xl'>
			<div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
				{/* Profile Header Card */}
				<div className='relative h-40 w-full bg-gradient-to-r from-purple-500 to-indigo-500'>
					{/* Cover Photo Placeholder */}
				</div>
				<div className='p-6'>
					<div className='relative -mt-20 flex items-end justify-between'>
						<div className='relative h-32 w-32 overflow-hidden rounded-full border-4 border-card bg-muted shadow-sm'>
							<Image
								src={profile.avatarUrl || 'https://i.pravatar.cc/150'}
								alt={`${profile.displayName}'s avatar`}
								fill
								className='object-cover'
							/>
						</div>
						<div className='flex gap-2'>
							{isOwnProfile && (
								<Button variant='outline' size='icon'>
									<Share2 className='h-4 w-4' />
								</Button>
							)}
							{isOwnProfile ? (
								<Button>
									<Settings className='mr-2 h-4 w-4' /> Edit Profile
								</Button>
							) : (
								<div className='flex gap-2'>
									{renderFollowButton()}
									{renderFriendButton()}
									<Button variant='secondary'>
										<MessageCircle className='mr-2 h-4 w-4' /> Message
									</Button>
								</div>
							)}
						</div>
					</div>

					<div className='mt-4'>
						<h1 className='text-2xl font-bold leading-tight text-text-primary'>
							{profile.displayName || 'Unknown User'}
						</h1>
						<p className='leading-normal text-text-secondary'>
							@{profile.username || 'user'}
						</p>
						<p className='mt-2 text-sm leading-normal text-text-secondary'>
							{profile.bio || 'No bio available'}
						</p>
					</div>

					<div className='mt-6 flex justify-around border-t border-b border-border-subtle py-4'>
						<div className='text-center'>
							<span className='block text-xl font-bold leading-tight text-text-primary'>
								{(profile.statistics?.followerCount ?? 0).toLocaleString()}
							</span>
							<span className='text-sm leading-normal text-text-secondary'>
								Followers
							</span>
						</div>
						<div className='text-center'>
							<span className='block text-xl font-bold leading-tight text-text-primary'>
								{(profile.statistics?.followingCount ?? 0).toLocaleString()}
							</span>
							<span className='text-sm leading-normal text-text-secondary'>
								Following
							</span>
						</div>
						<div className='text-center'>
							<span className='block text-xl font-bold leading-tight text-text-primary'>
								{(profile.statistics?.friendCount ?? 0).toLocaleString()}
							</span>
							<span className='text-sm leading-normal text-text-secondary'>
								Friends
							</span>
						</div>
					</div>

					<div className='mt-6 flex justify-around'>
						<div className='cursor-pointer border-b-2 border-primary pb-2 font-semibold leading-tight text-primary'>
							My Recipes
						</div>
						<div className='cursor-pointer pb-2 font-semibold leading-tight text-text-secondary hover:text-primary'>
							Saved
						</div>
						<div className='cursor-pointer pb-2 font-semibold leading-tight text-text-secondary hover:text-primary'>
							Badges
						</div>
					</div>
				</div>
			</div>

			{/* Profile Content Grid */}
			<div className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{/* Template: Recipe Card */}
				<div className='overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-sm'>
					<div className='relative h-48 w-full'>
						<Image
							src='https://i.imgur.com/v8SjYfT.jpeg'
							alt='Spicy Ramen'
							fill
							className='object-cover'
						/>
					</div>
					<div className='p-4'>
						<h3 className='mb-2 text-lg font-semibold leading-tight text-text-primary'>
							Spicy Tomato Ramen
						</h3>
						<div className='mb-4 flex items-center gap-4 text-sm leading-normal text-text-secondary'>
							<span className='flex items-center gap-1'>
								<Clock className='h-4 w-4' /> 25 min
							</span>
							<span className='flex items-center gap-1'>
								<Heart className='h-4 w-4' /> 1.2k
							</span>
						</div>
						<Button className='h-11 w-full'>Cook Now</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
