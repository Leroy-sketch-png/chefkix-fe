'use client'

import { Profile } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerItemVariants } from '@/components/ui/stagger-animation'

interface UserCardProps {
	profile: Profile
}

export const UserCard = ({ profile }: UserCardProps) => {
	return (
		<motion.div variants={staggerItemVariants}>
			<Link href={profile.userId ? `/${profile.userId}` : '/dashboard'}>
				<motion.div
					className='cursor-pointer rounded-lg border border-border-subtle bg-bg-card p-4 shadow-sm transition-all hover:shadow-md md:p-6'
					whileHover={{ scale: 1.02, y: -4 }}
					transition={{ duration: 0.2 }}
				>
					<div className='flex items-center gap-4'>
						<div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full'>
							<Image
								src={profile.avatarUrl || 'https://i.pravatar.cc/150'}
								alt={`${profile.displayName || 'User'}'s avatar`}
								fill
								className='object-cover'
							/>
						</div>
						<div className='overflow-hidden'>
							<h3 className='truncate text-lg font-bold leading-tight text-text-primary'>
								{profile.displayName || 'Unknown User'}
							</h3>
							<p className='truncate text-sm leading-normal text-text-secondary'>
								@{profile.username || 'user'}
							</p>
						</div>
					</div>
					<div className='mt-4 flex justify-around text-center text-sm'>
						<div>
							<span className='font-bold text-text-primary'>
								{profile.statistics?.followerCount ?? 0}
							</span>
							<span className='ml-1 text-text-secondary'>Followers</span>
						</div>
						<div>
							<span className='font-bold text-text-primary'>
								{profile.statistics?.currentLevel ?? 1}
							</span>
							<span className='ml-1 text-text-secondary'>Level</span>
						</div>
					</div>
				</motion.div>
			</Link>
		</motion.div>
	)
}
