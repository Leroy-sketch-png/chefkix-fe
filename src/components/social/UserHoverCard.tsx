'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/lib/types'
import { getProfileByUserId } from '@/services/profile'
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserPlus, MessageCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface UserHoverCardProps {
	userId: string
	children: React.ReactNode
	currentUserId?: string
}

/**
 * UserHoverCard - Twitter/X style hover card for user previews
 *
 * Wraps any trigger element (username, avatar) and shows a profile preview on hover.
 * Fetches profile data lazily when user hovers over the trigger.
 *
 * @example
 * <UserHoverCard userId="user123" currentUserId="me">
 *   <span className="font-bold cursor-pointer hover:underline">@username</span>
 * </UserHoverCard>
 */
export const UserHoverCard = ({
	userId,
	children,
	currentUserId,
}: UserHoverCardProps) => {
	const [profile, setProfile] = useState<Profile | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [hasError, setHasError] = useState(false)

	// Fetch profile data when hovering
	const handleOpenChange = async (open: boolean) => {
		if (open && !profile && !isLoading && !hasError) {
			setIsLoading(true)
			const response = await getProfileByUserId(userId)

			if (response.success && response.data) {
				setProfile(response.data)
			} else {
				setHasError(true)
			}
			setIsLoading(false)
		}
	}

	const isOwnProfile = userId === currentUserId

	return (
		<Popover onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className='w-80 p-0' align='start'>
				{isLoading ? (
					<div className='flex items-center justify-center p-8'>
						<Loader2 className='h-6 w-6 animate-spin text-primary' />
					</div>
				) : hasError ? (
					<div className='p-6 text-center text-sm text-text-secondary'>
						Failed to load profile
					</div>
				) : profile ? (
					<div className='p-6 space-y-4'>
						{/* Header with Avatar */}
						<div className='flex items-start justify-between'>
							<Link href={`/${profile.userId}`} className='flex-shrink-0'>
								<Avatar
									size='xl'
									className='shadow-md hover:shadow-lg transition-shadow'
								>
									<AvatarImage
										src={profile.avatarUrl || 'https://i.pravatar.cc/96'}
										alt={profile.displayName || 'User'}
									/>
									<AvatarFallback className='text-lg'>
										{profile.displayName
											?.split(' ')
											.map(n => n[0])
											.join('')
											.toUpperCase()
											.slice(0, 2) || 'U'}
									</AvatarFallback>
								</Avatar>
							</Link>

							{!isOwnProfile && (
								<div className='flex gap-2'>
									<Button size='sm' variant='outline' className='h-8 w-8 p-0'>
										<MessageCircle className='h-4 w-4' />
									</Button>
									<Button size='sm' className='h-8 px-3'>
										<UserPlus className='h-4 w-4 mr-1' />
										{profile.isFollowing ? 'Following' : 'Follow'}
									</Button>
								</div>
							)}
						</div>

						{/* User Info */}
						<div>
							<Link
								href={`/${profile.userId}`}
								className='block font-bold text-text-primary hover:underline'
							>
								{profile.displayName || 'Unknown User'}
							</Link>
							<div className='text-sm text-text-secondary'>
								@{profile.username}
							</div>
						</div>

						{/* Bio */}
						{profile.bio && (
							<p className='text-sm leading-relaxed text-text-primary line-clamp-3'>
								{profile.bio}
							</p>
						)}

						{/* Stats */}
						<div className='flex items-center gap-4 text-sm'>
							<div>
								<span className='font-semibold text-text-primary'>
									{profile.statistics.followerCount}
								</span>
								<span className='ml-1 text-text-secondary'>Followers</span>
							</div>
							<div>
								<span className='font-semibold text-text-primary'>
									{profile.statistics.followingCount}
								</span>
								<span className='ml-1 text-text-secondary'>Following</span>
							</div>
							<div>
								<span className='font-semibold text-text-primary'>
									{profile.statistics.recipeCount}
								</span>
								<span className='ml-1 text-text-secondary'>Recipes</span>
							</div>
						</div>
					</div>
				) : null}
			</PopoverContent>
		</Popover>
	)
}
