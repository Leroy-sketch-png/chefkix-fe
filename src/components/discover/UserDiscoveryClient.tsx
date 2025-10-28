'use client'

import { Profile } from '@/lib/types'
import Link from 'next/link'

type Props = {
	profiles: Profile[]
}

export const UserDiscoveryClient = ({ profiles }: Props) => {
	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-3xl font-bold'>Discover Users</h1>
			<div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
				{profiles.map(profile => (
					<Link key={profile.userId} href={`/${profile.username}`}>
						<div className='cursor-pointer rounded-lg border p-4 shadow-sm hover:shadow-md'>
							{/* Basic User Card */}
							<h2 className='text-xl font-semibold'>{profile.displayName}</h2>
							<p className='text-sm text-gray-500'>@{profile.username}</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}
