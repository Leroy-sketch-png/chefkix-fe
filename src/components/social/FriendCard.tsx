'use client'

import { Profile, getProfileDisplayName } from '@/lib/types'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserMinus, MessageCircle, Loader2, Trophy, Book } from 'lucide-react'
import { useState } from 'react'
import { toggleFollow } from '@/services/social'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerItemVariants } from '@/components/ui/stagger-animation'
import {
	TRANSITION_SPRING,
	CARD_HOVER,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
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
	const t = useTranslations('social')
	const [isUnfollowing, setIsUnfollowing] = useState(false)
	const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false)
	const displayName = getProfileDisplayName(profile)

	const handleUnfollow = async () => {
		setShowUnfollowConfirm(true)
	}

	const handleConfirmUnfollow = async () => {
		setIsUnfollowing(true)

		try {
			// In Instagram model, "unfriend" = unfollow (toggleFollow when already following)
			const response = await toggleFollow(profile.userId)

			if (response.success) {
				toast.success(t('unfollowSuccess', { name: displayName }))
				onUnfollow?.(profile.userId)
			} else {
				toast.error(t('failedUnfollow'))
			}
		} catch {
			toast.error(t('networkErrorConnection'))
		} finally {
			setIsUnfollowing(false)
		}
	}

	return (
		<>
			{/* Unfollow confirmation dialog */}
			<ConfirmDialog
				open={showUnfollowConfirm}
				onOpenChange={setShowUnfollowConfirm}
				title={t('unfollowTitle', { name: displayName })}
				description={t('unfollowDescription')}
				confirmLabel={t('unfollow')}
				cancelLabel={t('commentDeleteCancel')}
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
					className='group relative flex items-center justify-between rounded-2xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 p-4 shadow-card transition-all duration-300 hover:shadow-warm md:p-6'
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
						<div className='flex-1'>
							<h3 className='font-semibold text-text-primary transition-colors group-hover:text-brand'>
								{displayName}
							</h3>
							<p className='text-sm text-text-secondary'>@{profile.username}</p>
							{profile.statistics && (
								<div className='mt-1 flex gap-md text-xs text-text-secondary'>
									<span className='flex items-center gap-xs'>
										<Book className='size-3' />
										{t('recipesCount', {
											count: profile.statistics.recipeCount,
										})}
									</span>
									{profile.statistics.currentXP !== undefined && (
										<span className='flex items-center gap-xs'>
											<Trophy className='size-3' />
											{t('xpCount', { count: profile.statistics.currentXP })}
										</span>
									)}
								</div>
							)}
						</div>
					</Link>

					<div className='flex items-center gap-2'>
						<motion.div
							whileHover={ICON_BUTTON_HOVER}
							whileTap={ICON_BUTTON_TAP}
						>
							<Link
								href={`/messages?userId=${profile.userId}`}
								className='flex size-9 items-center justify-center rounded-xl border border-border-subtle text-text-muted transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand'
								aria-label={t('sendMessage')}
							>
								<MessageCircle className='size-4' />
							</Link>
						</motion.div>
						<motion.button
							type='button'
							whileHover={ICON_BUTTON_HOVER}
							whileTap={ICON_BUTTON_TAP}
							onClick={handleUnfollow}
							disabled={isUnfollowing}
							aria-label={t('unfollowUser')}
							className='flex size-9 items-center justify-center rounded-xl border border-border-subtle text-text-muted transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50'
						>
							{isUnfollowing ? (
								<Loader2 className='size-4 animate-spin' />
							) : (
								<UserMinus className='size-4' />
							)}
						</motion.button>
					</div>
				</motion.div>
			</motion.div>
		</>
	)
}
