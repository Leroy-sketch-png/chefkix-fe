'use client'

import { useMemo, useState } from 'react'
import { Profile } from '@/lib/types'
import { UserCard } from './UserCard'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { EmptyState } from '@/components/ui/empty-state'
import { Users, Search } from 'lucide-react'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import lottieNotFound from '@/../public/lottie/lottie-not-found.json'

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
				<h1 className='text-3xl font-bold text-text-primary'>Discover Users</h1>
				<div className='mt-4 max-w-md'>
					<InputGroup>
						<InputGroupAddon align='inline-start'>
							<Search className='h-4 w-4 text-text-muted' />
						</InputGroupAddon>
						<InputGroupInput
							placeholder='Search by name or username...'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
						/>
					</InputGroup>
				</div>
			</div>

			{filteredProfiles.length === 0 ? (
				searchTerm ? (
					<EmptyState
						icon={Search}
						title='No users found'
						description={`No results for "${searchTerm}". Try a different search term.`}
						actionLabel='Clear Search'
						onAction={() => setSearchTerm('')}
					/>
				) : (
					<EmptyState
						lottieAnimation={lottieNotFound}
						lottieSize={(w, h) => Math.min(w * 0.4, h * 0.5, 300)}
						title='No users yet'
						description='Be the first to join the community!'
					/>
				)
			) : (
				<StaggerContainer className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
					{filteredProfiles.map(profile => (
						<UserCard key={profile.userId} profile={profile} />
					))}
				</StaggerContainer>
			)}
		</div>
	)
}
