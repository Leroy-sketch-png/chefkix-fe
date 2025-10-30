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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	toggleFollow,
	toggleFriendRequest,
	unfriendUser,
} from '@/services/social'

type UserProfileProps = {
	profile: Profile
	currentUserId?: string // Make currentUserId optional
}

export const UserProfile = ({
	profile: initialProfile,
	currentUserId,
}: UserProfileProps) => {
	const [profile, setProfile] = useState<Profile>(initialProfile)
	const isOwnProfile = profile.userId === currentUserId

	const handleFollow = async () => {
		const response = await toggleFollow(profile.userId)
		if (response.success && response.data) {
			setProfile(response.data)
		}
		// TODO: Add error handling toast
	}

	const handleFriendRequest = async () => {
		const response = await toggleFriendRequest(profile.userId)
		if (response.success && response.data) {
			setProfile(response.data)
		}
		// TODO: Add error handling toast
	}

	const handleUnfriend = async () => {
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
		}
		// TODO: Add error handling toast
	}

	const renderFollowButton = () => {
		if (isOwnProfile) return null

		if (profile.isFollowing) {
			return (
				<Button onClick={handleFollow} variant='secondary'>
					<UserCheck className='mr-2 h-4 w-4' />
					Following
				</Button>
			)
		}
		return (
			<Button onClick={handleFollow}>
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
					<Button onClick={handleUnfriend} variant='destructive'>
						<UserX className='mr-2 h-4 w-4' />
						Unfriend
					</Button>
				)
			case 'PENDING_SENT':
				return (
					<Button onClick={handleFriendRequest} variant='secondary'>
						<Clock className='mr-2 h-4 w-4' />
						Pending
					</Button>
				)
			case 'PENDING_RECEIVED':
				return (
					<Button>Accept Request</Button> // TODO: Implement accept/decline
				)
			default:
				return (
					<Button onClick={handleFriendRequest} variant='secondary'>
						<UserPlus className='mr-2 h-4 w-4' />
						Add Friend
					</Button>
				)
		}
	}

	return (
		<div className='mx-auto my-8 max-w-4xl rounded-lg bg-white p-8 shadow-md'>
			{/* Profile Header */}
			<header className='flex items-center gap-6 border-b border-gray-200 pb-6'>
				<div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-primary'>
					<Image
						src={profile.avatarUrl || 'https://i.pravatar.cc/150'}
						alt={`${profile.displayName}'s avatar`}
						fill
						className='object-cover'
					/>
				</div>
				<div className='flex-grow'>
					<h1 className='text-3xl font-bold text-gray-900'>
						{profile.displayName}
					</h1>
					<span className='font-semibold text-primary'>
						@{profile.username}
					</span>
					{isOwnProfile && (
						<span className='mt-1 block text-sm text-gray-500'>
							{profile.email}
						</span>
					)}
					<p className='mt-3 max-w-lg text-sm text-gray-600'>{profile.bio}</p>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='flex w-full min-w-[100px] flex-col items-center gap-1 rounded-lg bg-yellow-100 p-4 text-yellow-700'>
						<Award className='h-8 w-8' />
						<span className='text-lg font-bold'>
							Level {profile.statistics.currentLevel}
						</span>
						{profile.statistics.title && (
							<small className='font-medium'>{profile.statistics.title}</small>
						)}
					</div>
					{isOwnProfile && (
						<Button variant='outline'>
							<Settings className='mr-2 h-4 w-4' />
							Edit Profile
						</Button>
					)}
				</div>
			</header>

			{/* Profile Stats */}
			<div className='flex justify-center gap-8 border-b border-gray-200 py-6'>
				<div className='text-center'>
					<span className='block text-2xl font-bold text-gray-900'>
						{profile.statistics.followerCount.toLocaleString()}
					</span>
					<span className='text-sm text-gray-500'>Followers</span>
				</div>
				<div className='text-center'>
					<span className='block text-2xl font-bold text-gray-900'>
						{profile.statistics.followingCount.toLocaleString()}
					</span>
					<span className='text-sm text-gray-500'>Following</span>
				</div>
				<div className='text-center'>
					<span className='block text-2xl font-bold text-gray-900'>
						{profile.statistics.friendCount.toLocaleString()}
					</span>
					<span className='text-sm text-gray-500'>Friends</span>
				</div>
			</div>

			{/* Profile Actions */}
			<div className='flex justify-center gap-4 py-6'>
				{isOwnProfile && profile.statistics.friendRequestCount > 0 && (
					<Button variant='ghost'>
						Friend Requests
						<Badge className='ml-2'>
							{profile.statistics.friendRequestCount}
						</Badge>
					</Button>
				)}
				{renderFollowButton()}
				{renderFriendButton()}
				<Button variant='secondary'>
					<MessageCircle className='mr-2 h-4 w-4' />
					Message
				</Button>
			</div>
		</div>
	)
}
