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
} from '@/services/social'
import Link from 'next/link'

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
		<div className='mx-auto my-8 max-w-4xl'>
			<div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
				{/* Profile Header Card */}
				<div className='relative h-40 w-full bg-gradient-to-r from-purple-500 to-indigo-500'>
					{/* Cover Photo Placeholder */}
				</div>
				<div className='p-6'>
					<div className='relative -mt-20 flex items-end justify-between'>
						<div className='relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-sm'>
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
						<h1 className='text-2xl font-bold'>{profile.displayName}</h1>
						<p className='text-muted-foreground'>@{profile.username}</p>
						<p className='mt-2 text-sm text-gray-600'>{profile.bio}</p>
					</div>

					<div className='mt-6 flex justify-around border-t border-b py-4'>
						<div className='text-center'>
							<span className='block text-xl font-bold'>
								{profile.statistics.followerCount.toLocaleString()}
							</span>
							<span className='text-sm text-muted-foreground'>Followers</span>
						</div>
						<div className='text-center'>
							<span className='block text-xl font-bold'>
								{profile.statistics.followingCount.toLocaleString()}
							</span>
							<span className='text-sm text-muted-foreground'>Following</span>
						</div>
						<div className='text-center'>
							<span className='block text-xl font-bold'>
								{profile.statistics.friendCount.toLocaleString()}
							</span>
							<span className='text-sm text-muted-foreground'>Friends</span>
						</div>
					</div>

					<div className='mt-6 flex justify-around'>
						<div className='cursor-pointer border-b-2 border-primary pb-2 font-semibold text-primary'>
							My Recipes
						</div>
						<div className='cursor-pointer pb-2 font-semibold text-muted-foreground hover:text-primary'>
							Saved
						</div>
						<div className='cursor-pointer pb-2 font-semibold text-muted-foreground hover:text-primary'>
							Badges
						</div>
					</div>
				</div>
			</div>

			{/* Profile Content Grid */}
			<div className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{/* Template: Recipe Card */}
				<div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
					<div className='relative h-48 w-full'>
						<Image
							src='https://i.imgur.com/v8SjYfT.jpeg'
							alt='Spicy Ramen'
							fill
							className='object-cover'
						/>
					</div>
					<div className='p-4'>
						<h3 className='mb-2 text-lg font-semibold'>Spicy Tomato Ramen</h3>
						<div className='mb-4 flex items-center gap-4 text-sm text-muted-foreground'>
							<span className='flex items-center gap-1'>
								<Clock className='h-4 w-4' /> 25 min
							</span>
							<span className='flex items-center gap-1'>
								<Heart className='h-4 w-4' /> 1.2k
							</span>
						</div>
						<Button className='w-full'>Cook Now</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
