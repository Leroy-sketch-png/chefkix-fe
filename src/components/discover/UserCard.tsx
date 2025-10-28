'use client'

import { Profile } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'

interface UserCardProps {
	profile: Profile
}

export const UserCard = ({ profile }: UserCardProps) => {
	return (
		<Link href={`/${profile.username}`}>
			<div className='cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md'>
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
						<h3 className='truncate text-lg font-bold text-gray-900'>
							{profile.displayName}
						</h3>
						<p className='truncate text-sm text-gray-500'>
							@{profile.username}
						</p>
					</div>
				</div>
				<div className='mt-4 flex justify-around text-center text-sm'>
					<div>
						<span className='font-bold'>
							{profile.statistics.followerCount}
						</span>
						<span className='ml-1 text-gray-500'>Followers</span>
					</div>
					<div>
						<span className='font-bold'>{profile.statistics.currentLevel}</span>
						<span className='ml-1 text-gray-500'>Level</span>
					</div>
				</div>
			</div>
		</Link>
	)
}
