'use client'

import { Profile } from '@/lib/types'
import { getProfileDisplayName } from '@/lib/types/profile'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
	TRANSITION_SPRING,
	CARD_FEED_HOVER,
	staggerItem,
	DURATION_S,
} from '@/lib/motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { memo } from 'react'

interface UserCardProps {
	profile: Profile
}

function formatCompactNumber(value: number) {
	return new Intl.NumberFormat('en', {
		notation: 'compact',
		maximumFractionDigits: value >= 1000 ? 1 : 0,
	}).format(value)
}

const UserCardComponent = ({ profile }: UserCardProps) => {
	const { user } = useAuth()
	const t = useTranslations('discover')
	const displayName = getProfileDisplayName(profile)
	const followerCount = profile.statistics?.followerCount ?? 0
	const currentLevel = profile.statistics?.currentLevel || 1

	return (
		<motion.div
			variants={staggerItem}
			initial='hidden'
			animate='visible'
			exit={{
				opacity: 0,
				scale: 0.95,
				transition: { duration: DURATION_S.normal },
			}}
			layout
		>
			<UserHoverCard userId={profile.userId} currentUserId={user?.userId}>
				<Link href={profile.userId ? `/${profile.userId}` : '/dashboard'}>
					<motion.div
						className='cursor-pointer rounded-2xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/60 p-3 shadow-card transition-all hover:shadow-warm sm:p-4'
						whileHover={CARD_FEED_HOVER}
						transition={TRANSITION_SPRING}
					>
						<div className='flex items-start gap-3'>
							<Avatar size='sm' className='flex-shrink-0 sm:size-avatar-xl'>
								<AvatarImage
									src={profile.avatarUrl || '/placeholder-avatar.svg'}
									alt={`${displayName}'s avatar`}
								/>
								<AvatarFallback>
									{displayName
										?.split(' ')
										.map(n => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2) || 'U'}
								</AvatarFallback>
							</Avatar>
							<div className='min-w-0 flex-1 overflow-hidden'>
								<h3 className='truncate text-lg font-bold leading-tight text-text-primary'>
									{displayName || t('unknownUser')}
								</h3>
								<p className='truncate text-sm leading-normal text-text-secondary'>
									@{profile.username || 'user'}
								</p>
							</div>
						</div>
						<div className='mt-3 grid grid-cols-2 gap-2 border-t border-border-subtle/70 pt-3'>
							<div className='rounded-xl bg-bg-elevated/70 px-3 py-2'>
								<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
									{t('followers')}
								</p>
								<p className='mt-1 text-base font-black tabular-nums text-text-primary'>
									{formatCompactNumber(followerCount)}
								</p>
							</div>
							<div className='rounded-xl bg-bg-elevated/70 px-3 py-2'>
								<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
									{t('level')}
								</p>
								<p className='mt-1 text-base font-black tabular-nums text-text-primary'>
									{currentLevel}
								</p>
							</div>
						</div>
					</motion.div>
				</Link>
			</UserHoverCard>
		</motion.div>
	)
}

export const UserCard = memo(UserCardComponent)
