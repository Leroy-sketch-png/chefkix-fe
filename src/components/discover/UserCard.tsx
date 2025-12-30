'use client'

import { Profile } from '@/lib/types'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TRANSITION_SPRING, CARD_FEED_HOVER, staggerItem } from '@/lib/motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import { useAuth } from '@/hooks/useAuth'
import { memo } from 'react'

interface UserCardProps {
	profile: Profile
}

const UserCardComponent = ({ profile }: UserCardProps) => {
	const { user } = useAuth()

	return (
		<motion.div
			variants={staggerItem}
			initial='hidden'
			animate='visible'
			exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
			layout
		>
			<UserHoverCard userId={profile.userId} currentUserId={user?.userId}>
				<Link href={profile.userId ? `/${profile.userId}` : '/dashboard'}>
					<motion.div
						className='cursor-pointer rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card transition-all hover:shadow-warm md:p-6'
						whileHover={CARD_FEED_HOVER}
						transition={TRANSITION_SPRING}
					>
						<div className='flex items-center gap-4'>
							<Avatar size='xl' className='flex-shrink-0'>
								<AvatarImage
									src={profile.avatarUrl || '/placeholder-avatar.png'}
									alt={`${profile.displayName || 'User'}'s avatar`}
								/>
								<AvatarFallback>
									{profile.displayName
										?.split(' ')
										.map(n => n[0])
										.join('')
										.toUpperCase()
										.slice(0, 2) || 'U'}
								</AvatarFallback>
							</Avatar>
							<div className='overflow-hidden'>
								<h3 className='truncate text-lg font-bold leading-tight text-text'>
									{profile.displayName || 'Unknown User'}
								</h3>
								<p className='truncate text-sm leading-normal text-text-secondary'>
									@{profile.username || 'user'}
								</p>
							</div>
						</div>
						<div className='mt-4 flex justify-around text-center text-sm'>
							<div>
								<span className='font-bold text-text'>
									{profile.statistics?.followerCount ?? 0}
								</span>
								<span className='ml-1 text-text-secondary'>Followers</span>
							</div>
							<div>
								<span className='font-bold text-text'>
									{profile.statistics?.currentLevel || 1}
								</span>
								<span className='ml-1 text-text-secondary'>Level</span>
							</div>
						</div>
					</motion.div>
				</Link>
			</UserHoverCard>
		</motion.div>
	)
}

export const UserCard = memo(UserCardComponent)
