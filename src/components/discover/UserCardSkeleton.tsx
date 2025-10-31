'use client'

import { Skeleton } from '@/components/ui/skeleton'

export const UserCardSkeleton = () => {
	return (
		<div className='overflow-hidden rounded-lg border bg-card p-6 shadow-sm'>
			<div className='flex items-start gap-4'>
				{/* Avatar Skeleton */}
				<Skeleton className='h-16 w-16 flex-shrink-0 rounded-full' />

				<div className='flex-1 space-y-3'>
					{/* Name & Username */}
					<div className='space-y-2'>
						<Skeleton className='h-5 w-32' />
						<Skeleton className='h-4 w-24' />
					</div>

					{/* Bio */}
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-3/4' />

					{/* Stats */}
					<div className='flex gap-4 pt-2'>
						<Skeleton className='h-4 w-20' />
						<Skeleton className='h-4 w-20' />
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className='mt-4 flex gap-2'>
				<Skeleton className='h-9 flex-1' />
				<Skeleton className='h-9 flex-1' />
			</div>
		</div>
	)
}
