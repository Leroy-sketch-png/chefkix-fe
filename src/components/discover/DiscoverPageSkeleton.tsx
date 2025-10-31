'use client'

import { UserCardSkeleton } from './UserCardSkeleton'

export const DiscoverPageSkeleton = () => {
	return (
		<div className='container mx-auto max-w-3xl p-4'>
			<div className='mb-6 space-y-2'>
				<div className='h-8 w-48 animate-pulse rounded bg-muted' />
				<div className='h-4 w-64 animate-pulse rounded bg-muted' />
			</div>

			<div className='space-y-4'>
				{[1, 2, 3, 4].map(i => (
					<UserCardSkeleton key={i} />
				))}
			</div>
		</div>
	)
}
