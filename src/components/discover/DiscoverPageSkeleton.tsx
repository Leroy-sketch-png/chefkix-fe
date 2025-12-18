'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { UserCardSkeleton } from './UserCardSkeleton'

export const DiscoverPageSkeleton = () => {
	return (
		<div className='container mx-auto max-w-3xl p-4'>
			{/* Page header skeleton */}
			<div className='mb-6 space-y-2'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-4 w-64' />
			</div>

			{/* User cards skeleton */}
			<div className='space-y-4'>
				{[1, 2, 3, 4].map(i => (
					<UserCardSkeleton key={i} />
				))}
			</div>
		</div>
	)
}
