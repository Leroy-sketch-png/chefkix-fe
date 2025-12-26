'use client'

import { Profile, getProfileDisplayName } from '@/lib/types'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserMinus, MessageCircle, Loader2, Trophy, Book } from 'lucide-react'
import { useState } from 'react'
import { toggleFollow } from '@/services/social'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerItemVariants } from '@/components/ui/stagger-animation'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface FriendCardProps {
	/** Profile of the mutual follow (friend) */
	profile: Profile
	/** Called when user unfollows - receives userId */
	onUnfollow?: (userId: string) => void
}

/**
 * Card for displaying a friend (mutual follow) in the Instagram-style social model.
 *
 * Friends = users where both parties follow each other (mutual follows).
 * "Unfriend" = unfollow them (breaks the mutual connection).
 */
export const FriendCard = ({ profile, onUnfollow }: FriendCardProps) => {
	const [isUnfollowing, setIsUnfollowing] = useState(false)
	const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false)
	const displayName = getProfileDisplayName(profile)

	const handleUnfollow = async () => {
		setShowUnfollowConfirm(true)
	}

	const handleConfirmUnfollow = async () => {
		setIsUnfollowing(true)

		// In Instagram model, "unfriend" = unfollow (toggleFollow when already following)
		const response = await toggleFollow(profile.userId)

		if (response.success) {
			toast.success(`You unfollowed ${displayName}`)
			onUnfollow?.(profile.userId)
		} else {
			toast.error(response.message || 'Failed to unfollow user')
		}

		setIsUnfollowing(false)
	}

	return (
		<>
			{/* Unfollow confirmation dialog */}
			<ConfirmDialog
				open={showUnfollowConfirm}
				onOpenChange={setShowUnfollowConfirm}
				title={`Unfollow ${displayName}?`}
				description='This will remove them from your friends list.'
				confirmLabel='Unfollow'
				cancelLabel='Cancel'
				variant='destructive'
				onConfirm={handleConfirmUnfollow}
			/>

			<motion.div
				variants={staggerItemVariants}
				exit={{ opacity: 0, x: -100, scale: 0.9 }}
				transition={TRANSITION_SPRING}
				layout
			>
				<motion.div
					whileHover={CARD_HOVER}
					transition={TRANSITION_SPRING}
					className='group relative flex items-center justify-between rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card transition-all duration-300 hover:shadow-warm md:p-6'
				>
					<Link
						href={`/${profile.userId}`}
						className='flex flex-1 items-center gap-md'
					>
						<Avatar
							size='lg'
							className='shadow-sm transition-transform group-hover:scale-105'
						>
							<AvatarImage
								src={profile.avatarUrl || 'https://i.pravatar.cc/96'}
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
						<div className='flex-1'>
							<h3 className='font-semibold text-text-primary transition-colors group-hover:text-primary'>
								{displayName}
							</h3>
							<p className='text-sm text-text-secondary'>@{profile.username}</p>
							{profile.statistics && (
								<div className='mt-1 flex gap-md text-xs text-text-secondary'>
									<span className='flex items-center gap-xs'>
										<Book className='size-3' />
										{profile.statistics.recipeCount} recipes
									</span>
									{profile.statistics.currentXP !== undefined && (
										<span className='flex items-center gap-xs'>
											<Trophy className='size-3' />
											{profile.statistics.currentXP} XP
										</span>
									)}
								</div>
							)}
						</div>
					</Link>

					<div className='flex gap-sm'>
						<Button
							variant='ghost'
							size='sm'
							asChild
							className='hover:bg-primary/10 hover:text-primary'
						>
							<Link href={`/messages?userId=${profile.userId}`}>
								<MessageCircle className='size-4' />
							</Link>
						</Button>
						<Button
							variant='ghost'
							size='sm'
							onClick={handleUnfollow}
							disabled={isUnfollowing}
							className='hover:bg-destructive/10 hover:text-destructive'
							aria-label='Unfollow user'
						>
							{isUnfollowing ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								<UserMinus className='size-4' />
							)}
						</Button>
					</div>
				</motion.div>
			</motion.div>
		</>
	)
}
