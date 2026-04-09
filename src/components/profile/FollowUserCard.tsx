'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Profile, getProfileDisplayName } from '@/lib/types/profile'
import { toggleFollow } from '@/services/social'
import { useAuth } from '@/hooks/useAuth'
import { useAuthGate } from '@/hooks/useAuthGate'
import {
	CARD_HOVER,
	BUTTON_HOVER,
	BUTTON_TAP,
	TRANSITION_SPRING,
	FOLLOW_PULSE,
} from '@/lib/motion'
import { UserCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface FollowUserCardProps {
	profile: Profile
	/** Whether this user follows the current user back */
	isMutual?: boolean
	onFollowChange?: (userId: string, isFollowing: boolean) => void
}

export function FollowUserCard({
	profile,
	isMutual,
	onFollowChange,
}: FollowUserCardProps) {
	const router = useRouter()
	const { user } = useAuth()
	const requireAuth = useAuthGate()
	const t = useTranslations('profile')
	const [isFollowing, setIsFollowing] = useState(profile.isFollowing ?? false)
	const [isLoading, setIsLoading] = useState(false)
	const followLockRef = useRef(false)

	const displayName = getProfileDisplayName(profile)
	const isOwnProfile = user?.userId === profile.userId

	const handleToggleFollow = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!requireAuth(t('authActionFollow'))) return
		if (followLockRef.current || isOwnProfile) return
		followLockRef.current = true

		setIsLoading(true)
		const previousState = isFollowing
		setIsFollowing(!previousState) // Optimistic

		try {
			const response = await toggleFollow(profile.userId)
			if (!response.success) {
				setIsFollowing(previousState) // Revert
				toast.error(t('failedFollowUpdate'))
			} else {
				onFollowChange?.(profile.userId, !previousState)
			}
		} catch {
			setIsFollowing(previousState)
			toast.error(t('failedFollowUpdate'))
		} finally {
			followLockRef.current = false
			setIsLoading(false)
		}
	}

	return (
		<motion.div
			whileHover={CARD_HOVER}
			transition={TRANSITION_SPRING}
			onClick={() => router.push(`/${profile.userId}`)}
			className='flex cursor-pointer items-center gap-3 rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card transition-all hover:shadow-warm'
		>
			<Avatar size='md'>
				{profile.avatarUrl && (
					<AvatarImage src={profile.avatarUrl} alt={displayName} />
				)}
				<AvatarFallback className='text-sm font-semibold'>
					{displayName.slice(0, 2).toUpperCase()}
				</AvatarFallback>
			</Avatar>

			<div className='min-w-0 flex-1'>
				<div className='flex items-center gap-2'>
					<p className='truncate text-sm font-semibold text-text'>
						{displayName}
					</p>
					{isMutual && (
						<span className='shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-2xs font-bold text-brand'>
							{t('mutual')}
						</span>
					)}
				</div>
				<p className='truncate text-xs text-text-muted'>@{profile.username}</p>
				{profile.bio && (
					<p className='mt-0.5 line-clamp-1 text-xs text-text-secondary'>
						{profile.bio}
					</p>
				)}
			</div>

			{!isOwnProfile && (
				<motion.div
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					animate={isFollowing ? FOLLOW_PULSE.followed : undefined}
					initial={false}
				>
					<Button
						size='sm'
						variant={isFollowing ? 'outline' : 'default'}
						onClick={handleToggleFollow}
						disabled={isLoading}
						className={cn(
							'shrink-0 gap-1.5 text-xs',
							isFollowing &&
								'border-border-subtle text-text-secondary hover:border-destructive hover:text-destructive',
						)}
					>
						{isFollowing ? (
							<>
								<UserCheck className='size-3.5' />
								{t('following')}
							</>
						) : (
							<>
								<UserPlus className='size-3.5' />
								{t('follow')}
							</>
						)}
					</Button>
				</motion.div>
			)}
		</motion.div>
	)
}
