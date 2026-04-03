'use client'

import { Profile, getProfileDisplayName } from '@/lib/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserPlus, X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toggleFollow } from '@/services/social'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { staggerItemVariants } from '@/components/ui/stagger-animation'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'
import { triggerLikeConfetti } from '@/lib/confetti'
import { useAuthGate } from '@/hooks/useAuthGate'
import Link from 'next/link'

interface FollowSuggestionCardProps {
	/** The profile of the user who follows you (but you don't follow back yet) */
	profile: Profile
	/** Called when user clicks "Follow Back" - receives userId */
	onFollowBack?: (userId: string) => void
	/** Called when user dismisses the suggestion - receives userId */
	onDismiss?: (userId: string) => void
	/** Variant: 'follow-back' shows "Follows you" tag, 'suggested' shows preference overlap info */
	variant?: 'follow-back' | 'suggested'
}

/**
 * Card for "Follow Back Suggestions" in the Instagram-style social model.
 *
 * Displays users who follow you but you haven't followed back yet.
 * Following them back creates a mutual follow (= friends).
 */
export const FollowSuggestionCard = ({
	profile,
	onFollowBack,
	onDismiss,
	variant = 'follow-back',
}: FollowSuggestionCardProps) => {
	const [isFollowing, setIsFollowing] = useState(false)
	const [isDismissing, setIsDismissing] = useState(false)
	const displayName = getProfileDisplayName(profile)
	const requireAuth = useAuthGate()

	const handleFollowBack = async () => {
		if (!requireAuth('follow this chef')) return
		setIsFollowing(true)

		try {
			const response = await toggleFollow(profile.userId)

			if (response.success) {
				toast.success(`You are now following ${displayName}!`)
				triggerLikeConfetti() // Celebrate new mutual connection!
				onFollowBack?.(profile.userId)
			} else {
				toast.error(response.message || 'Failed to follow user')
			}
		} catch {
			toast.error('Network error. Please check your connection and try again.')
		} finally {
			setIsFollowing(false)
		}
	}

	const handleDismiss = () => {
		setIsDismissing(true)
		// Just remove from suggestions UI - no API call needed
		// User can still follow them from their profile page later
		onDismiss?.(profile.userId)
		setIsDismissing(false)
	}

	return (
		<motion.div
			variants={staggerItemVariants}
			exit={{ opacity: 0, x: -100, scale: 0.9 }}
			transition={TRANSITION_SPRING}
			layout
		>
			<motion.div
				whileHover={CARD_HOVER}
				transition={TRANSITION_SPRING}
				className='group flex items-center justify-between rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card transition-all duration-300 hover:shadow-warm md:p-6'
			>
				<Link
					href={`/${profile.userId}`}
					className='flex flex-1 items-center gap-md'
				>
					<Avatar
						size='lg'
						className='shadow-card transition-transform group-hover:scale-105'
					>
						<AvatarImage
							src={profile.avatarUrl || '/placeholder-avatar.svg'}
							alt={displayName}
						/>
						<AvatarFallback>
							{displayName
								.split(' ')
								.map(n => n[0])
								.join('')
								.toUpperCase()
								.slice(0, 2)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h3 className='font-semibold text-text-primary transition-colors group-hover:text-primary'>
							{displayName}
						</h3>
						<p className='text-sm text-text-secondary'>@{profile.username}</p>
						<p className='text-xs text-text-tertiary'>
							{variant === 'follow-back' ? 'Follows you' : 'Suggested for you'}
						</p>
					</div>
				</Link>

				<div className='flex gap-sm'>
					<Button
						variant='default'
						size='sm'
						onClick={handleFollowBack}
						disabled={isFollowing || isDismissing}
					>
						{isFollowing ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<>
								<UserPlus className='mr-1 size-4' />
								{variant === 'follow-back' ? 'Follow Back' : 'Follow'}
							</>
						)}
					</Button>
					<Button
						variant='ghost'
						size='sm'
						onClick={handleDismiss}
						disabled={isFollowing || isDismissing}
						aria-label='Dismiss suggestion'
					>
						{isDismissing ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<X className='size-4' />
						)}
					</Button>
				</div>
			</motion.div>
		</motion.div>
	)
}
