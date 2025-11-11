import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface PostCardSkeletonProps {
	className?: string
	count?: number
	showImages?: boolean
}

/**
 * PostCardSkeleton - Matches exact dimensions of PostCard
 *
 * Structure:
 * - Header: Avatar + name + timestamp + menu
 * - Content: Text lines (3-4 lines)
 * - Images: Optional grid (1-4 images)
 * - Tags: Badge skeleton row
 * - Actions: Like, comment, share, save buttons
 * - Stats: Likes and comments count
 *
 * Dimensions match PostCard for smooth perceived performance
 */
export const PostCardSkeleton = ({
	className,
	count = 1,
	showImages = true,
}: PostCardSkeletonProps) => {
	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className={cn(
						'rounded-radius bg-bg-card p-4 shadow-md md:p-6',
						className,
					)}
				>
					{/* Header: Avatar + Name + Time + Menu */}
					<div className='mb-4 flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							{/* Avatar */}
							<Skeleton className='h-11 w-11 rounded-full' />

							{/* Name and timestamp */}
							<div className='space-y-2'>
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-3 w-20' />
							</div>
						</div>

						{/* Menu button */}
						<Skeleton className='h-9 w-9 rounded-sm' />
					</div>

					{/* Content text - 3 lines */}
					<div className='mb-4 space-y-2'>
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-2/3' />
					</div>

					{/* Images grid (optional) */}
					{showImages && (
						<div className='mb-4 grid grid-cols-2 gap-2'>
							<Skeleton className='aspect-square w-full rounded-sm' />
							<Skeleton className='aspect-square w-full rounded-sm' />
						</div>
					)}

					{/* Tags row */}
					<div className='mb-4 flex flex-wrap gap-2'>
						<Skeleton className='h-6 w-16 rounded-full' />
						<Skeleton className='h-6 w-20 rounded-full' />
						<Skeleton className='h-6 w-14 rounded-full' />
					</div>

					{/* Action buttons row */}
					<div className='mb-3 flex items-center gap-6'>
						<Skeleton className='h-9 w-16' />
						<Skeleton className='h-9 w-16' />
						<Skeleton className='h-9 w-16' />
						<Skeleton className='h-9 w-16' />
					</div>

					{/* Stats row */}
					<div className='flex items-center gap-4 border-t border-border-subtle pt-3'>
						<Skeleton className='h-4 w-20' />
						<Skeleton className='h-4 w-24' />
					</div>
				</div>
			))}
		</>
	)
}
