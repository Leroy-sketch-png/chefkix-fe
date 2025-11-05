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
			<Link href={`/${profile.userId}`}>
				<motion.div
					className='cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md'
					whileHover={{ scale: 1.02, y: -4 }}
					transition={{ duration: 0.2 }}
				>
					<div className='flex items-center gap-4'>
						<div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full'>
							<Image
								src={profile.avatarUrl || 'https://i.pravatar.cc/150'}
								alt={`${profile.displayName}'s avatar`}
								fill
								className='object-cover'
							/>
						</div>
						<div className='overflow-hidden'>
							<h3 className='truncate text-lg font-bold text-foreground'>
								{profile.displayName}
							</h3>
							<p className='truncate text-sm text-muted-foreground'>
								@{profile.username}
							</p>
						</div>
					</div>
					<div className='mt-4 flex justify-around text-center text-sm'>
						<div>
							<span className='font-bold'>
								{profile.statistics.followerCount}
							</span>
							<span className='ml-1 text-muted-foreground'>Followers</span>
						</div>
						<div>
							<span className='font-bold'>
								{profile.statistics.currentLevel}
							</span>
							<span className='ml-1 text-muted-foreground'>Level</span>
						</div>
					</div>
				</motion.div>
			</Link>
		</motion.div>
	)
}
