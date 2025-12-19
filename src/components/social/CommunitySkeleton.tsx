'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

/**
 * CommunitySkeleton - Loading state for Community Hub
 *
 * Matches the structure of the Community page with:
 * - Header (title + description)
 * - Tab navigation skeleton
 * - Friend request/friend card skeletons in responsive grid
 */
export const CommunitySkeleton = () => {
	return (
		<div className='space-y-6'>
			{/* Header skeleton */}
			<div className='space-y-2'>
				<Skeleton className='h-9 w-64' /> {/* Title */}
				<Skeleton className='h-4 w-96' /> {/* Description */}
			</div>

			{/* Tabs skeleton */}
			<div className='flex gap-2 border-b border-border-subtle pb-2'>
				<Skeleton className='h-10 w-28 rounded-radius' />
				<Skeleton className='h-10 w-32 rounded-radius' />
				<Skeleton className='h-10 w-24 rounded-radius' />
			</div>

			{/* Content grid skeleton - matches friend request/friend cards */}
			<div className='grid gap-4 sm:grid-cols-2'>
				{[1, 2, 3, 4, 5, 6].map(i => (
					<FriendCardSkeleton key={i} />
				))}
			</div>
		</div>
	)
}

/**
 * FriendCardSkeleton - Matches FollowSuggestionCard/FriendCard dimensions
 *
 * Structure:
 * - Avatar (left)
 * - Name + username (center)
 * - Action buttons (right)
 */
const FriendCardSkeleton = () => {
	return (
		<Card className='p-4'>
			<div className='flex items-center justify-between gap-3'>
				{/* Left: Avatar + Info */}
				<div className='flex items-center gap-3'>
					<Skeleton className='h-12 w-12 flex-shrink-0 rounded-full' />
					<div className='space-y-2'>
						<Skeleton className='h-4 w-32' /> {/* Name */}
						<Skeleton className='h-3 w-24' /> {/* Username */}
					</div>
				</div>

				{/* Right: Action buttons */}
				<div className='flex gap-2'>
					<Skeleton className='h-9 w-20 rounded-radius' />
					<Skeleton className='h-9 w-20 rounded-radius' />
				</div>
			</div>
		</Card>
	)
}
