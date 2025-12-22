'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Profile } from '@/lib/types'
import { UserCard } from './UserCard'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { EmptyStateGamified } from '@/components/shared'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'

type Props = {
	profiles: Profile[]
}

export const UserDiscoveryClient = ({ profiles }: Props) => {
	const [searchTerm, setSearchTerm] = useState('')
	// Track if this is initial mount to avoid re-animation on search clear
	const hasAnimated = useRef(false)

	const filteredProfiles = useMemo(() => {
		if (!searchTerm.trim()) return profiles

		const term = searchTerm.toLowerCase().trim()
		return profiles.filter(
			profile =>
				profile.displayName.toLowerCase().includes(term) ||
				profile.username.toLowerCase().includes(term),
		)
	}, [profiles, searchTerm])

	// Mark as animated after first render
	useEffect(() => {
		hasAnimated.current = true
	}, [])

	const handleClearSearch = () => {
		setSearchTerm('')
	}

	return (
		<div className='space-y-6'>
			{/* Search Bar */}
			<div className='max-w-md'>
				<InputGroup>
					<InputGroupAddon align='inline-start'>
						<Search className='size-4 text-text-muted' />
					</InputGroupAddon>
					<InputGroupInput
						placeholder='Search by name or username...'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<InputGroupAddon align='inline-end'>
							<button
								type='button'
								onClick={handleClearSearch}
								className='rounded-full p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
								aria-label='Clear search'
							>
								<X className='size-4' />
							</button>
						</InputGroupAddon>
					)}
				</InputGroup>
			</div>

			{/* Results */}
			{filteredProfiles.length === 0 ? (
				searchTerm ? (
					<EmptyStateGamified
						variant='search'
						title='No users found'
						description={`No results for "${searchTerm}". Try a different search term.`}
						primaryAction={{
							label: 'Clear Search',
							onClick: handleClearSearch,
						}}
					/>
				) : (
					<EmptyStateGamified
						variant='feed'
						title='No users yet'
						description='Be the first to join the community!'
					/>
				)
			) : (
				<motion.div
					className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
					// Only animate on initial mount, not on every search change
					initial={hasAnimated.current ? false : 'hidden'}
					animate='visible'
					variants={staggerContainer}
				>
					<AnimatePresence mode='popLayout'>
						{filteredProfiles.map(profile => (
							<UserCard key={profile.userId} profile={profile} />
						))}
					</AnimatePresence>
				</motion.div>
			)}
		</div>
	)
}
