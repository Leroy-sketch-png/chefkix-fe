'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Profile, getProfileDisplayName } from '@/lib/types'
import { getProfileByUserId } from '@/services/profile'
import { toggleFollow } from '@/services/social'
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserPlus, UserCheck, MessageCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthGate } from '@/hooks/useAuthGate'

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
	const router = useRouter()
	const requireAuth = useAuthGate()
	const t = useTranslations('social')
	const [profile, setProfile] = useState<Profile | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [hasError, setHasError] = useState(false)
	const [isFollowLoading, setIsFollowLoading] = useState(false)
	const followLockRef = useRef(false)

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

	const handleFollowToggle = useCallback(async () => {
		if (!requireAuth(t('hoverCardFollowGate'))) return
		if (followLockRef.current || !profile) return
		followLockRef.current = true
		setIsFollowLoading(true)
		try {
			const response = await toggleFollow(userId)
			if (response.success && response.data) {
				setProfile(prev =>
					prev ? { ...prev, isFollowing: response.data.isFollowing } : prev,
				)
			}
		} finally {
			followLockRef.current = false
			setIsFollowLoading(false)
		}
	}, [userId, profile, requireAuth, t])

	const handleSendMessage = useCallback(() => {
		if (!requireAuth(t('hoverCardMessageGate'))) return
		router.push(`/messages?userId=${userId}`)
	}, [router, userId, requireAuth, t])

	const isOwnProfile = userId === currentUserId
	const displayName = getProfileDisplayName(profile)

	return (
		<Popover onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className='w-80 p-0' align='start'>
				{isLoading ? (
					<div className='flex items-center justify-center p-8'>
						<Loader2 className='size-6 animate-spin text-brand' />
					</div>
				) : hasError ? (
					<div className='p-6 text-center text-sm text-text-secondary'>
						{t('hoverCardLoadError')}
					</div>
				) : profile ? (
					<div className='p-6 space-y-4'>
						{/* Header with Avatar */}
						<div className='flex items-start justify-between'>
							<Link href={`/${profile.userId}`} className='flex-shrink-0'>
								<Avatar
									size='xl'
									className='shadow-card hover:shadow-warm transition-shadow'
								>
									<AvatarImage
										src={profile.avatarUrl || '/placeholder-avatar.svg'}
										alt={displayName}
									/>
									<AvatarFallback className='text-lg'>
										{displayName
											.split(' ')
											.map(n => n[0])
											.join('')
											.toUpperCase()
											.slice(0, 2)}
									</AvatarFallback>
								</Avatar>
							</Link>

							{!isOwnProfile && (
								<div className='flex gap-2'>
									<Button
										size='sm'
										variant='outline'
										className='size-8 p-0'
										aria-label={t('hoverCardSendMessage')}
										onClick={handleSendMessage}
									>
										<MessageCircle className='size-4' />
									</Button>
									<Button
										size='sm'
										className='h-8 px-3'
										variant={profile.isFollowing ? 'outline' : 'default'}
										onClick={handleFollowToggle}
										disabled={isFollowLoading}
									>
										{isFollowLoading ? (
											<Loader2 className='size-4 animate-spin' />
										) : profile.isFollowing ? (
											<>
												<UserCheck className='size-4 mr-1' />
												{t('hoverCardFollowing')}
											</>
										) : (
											<>
												<UserPlus className='size-4 mr-1' />
												{t('hoverCardFollow')}
											</>
										)}
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
								{displayName}
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
									{profile.statistics?.followerCount ?? 0}
								</span>
								<span className='ml-1 text-text-secondary'>
									{t('hoverCardFollowers')}
								</span>
							</div>
							<div>
								<span className='font-semibold text-text-primary'>
									{profile.statistics?.followingCount ?? 0}
								</span>
								<span className='ml-1 text-text-secondary'>
									{t('hoverCardFollowingLabel')}
								</span>
							</div>
							<div>
								<span className='font-semibold text-text-primary'>
									{profile.statistics?.recipeCount ?? 0}
								</span>
								<span className='ml-1 text-text-secondary'>
									{t('hoverCardRecipes')}
								</span>
							</div>
						</div>
					</div>
				) : null}
			</PopoverContent>
		</Popover>
	)
}
