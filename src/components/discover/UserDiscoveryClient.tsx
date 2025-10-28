'use client'

import { useMemo, useState } from 'react'
import { Profile } from '@/lib/types'
import { UserCard } from './UserCard'
import { Input } from '@/components/ui/input'

type Props = {
	profiles: Profile[]
}

export const UserDiscoveryClient = ({ profiles }: Props) => {
	const [searchTerm, setSearchTerm] = useState('')

	const filteredProfiles = useMemo(() => {
		if (!searchTerm) return profiles

		return profiles.filter(
			profile =>
				profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				profile.username.toLowerCase().includes(searchTerm.toLowerCase()),
		)
	}, [profiles, searchTerm])

	return (
		<div className='container mx-auto p-4'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold'>Discover Users</h1>
				<div className='mt-4 max-w-md'>
					<Input
						placeholder='Search by name or username...'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
				{filteredProfiles.map(profile => (
					<UserCard key={profile.userId} profile={profile} />
				))}
			</div>
		</div>
	)
}
