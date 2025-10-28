'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Profile, RelationshipStatus } from '@/lib/types'
import { Award, UserPlus, UserCheck, MessageCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleFollow, toggleFriendRequest } from '@/services/social'

type UserProfileProps = {
	profile: Profile
}

export const UserProfile = ({ profile: initialProfile }: UserProfileProps) => {
	const [profile, setProfile] = useState<Profile>(initialProfile)

	const handleFollow = async () => {
		const response = await toggleFollow(profile.userId)
		if (response.success && response.data) {
			setProfile(prev => ({
				...prev,
				isFollowing: response.data?.isFollowing,
				statistics: {
					...prev.statistics,
					followerCount: response.data.statistics.followerCount,
				},
			}))
		}
		// TODO: Add error handling toast
	}

	const handleFriendRequest = async () => {
		const response = await toggleFriendRequest(profile.userId)
		if (response.success && response.data) {
			setProfile(prev => ({
				...prev,
				relationshipStatus: response.data?.relationshipStatus,
			}))
		}
		// TODO: Add error handling toast
	}

	const renderFollowButton = () => {
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
		switch (profile.relationshipStatus) {
			case 'FRIENDS':
				return (
					<Button variant='secondary' disabled>
						<UserCheck className='mr-2 h-4 w-4' />
						Friends
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
					<p className='mt-3 max-w-lg text-sm text-gray-600'>{profile.bio}</p>
				</div>
				<div className='flex min-w-[100px] flex-col items-center gap-1 rounded-lg bg-yellow-100 p-4 text-yellow-700'>
					<Award className='h-8 w-8' />
					<span className='text-lg font-bold'>
						Level {profile.statistics.currentLevel}
					</span>
					{profile.statistics.title && (
						<small className='font-medium'>{profile.statistics.title}</small>
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
