'use client'

import { Profile } from '@/lib/types'
import { UserCard } from './UserCard'

type Props = {
	profiles: Profile[]
}

export const UserDiscoveryClient = ({ profiles }: Props) => {
	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-3xl font-bold'>Discover Users</h1>
			<div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
				{profiles.map(profile => (
					<UserCard key={profile.userId} profile={profile} />
				))}
			</div>
		</div>
	)
}
