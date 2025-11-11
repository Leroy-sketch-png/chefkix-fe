import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CommentSkeletonProps {
	className?: string
	count?: number
	isReply?: boolean
}

/**
 * CommentSkeleton - Matches exact dimensions of Comment component
 *
 * Structure:
 * - Avatar (small circle)
 * - Name and timestamp
 * - Comment text (1-2 lines)
 * - Action buttons (like, reply)
 *
 * Optional `isReply` prop adds left margin for nested comments
 */
export const CommentSkeleton = ({
	className,
	count = 1,
	isReply = false,
}: CommentSkeletonProps) => {
	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className={cn('flex gap-3 py-3', isReply && 'ml-12', className)}
				>
					{/* Avatar */}
					<Skeleton className='h-9 w-9 shrink-0 rounded-full' />

					{/* Comment Content */}
					<div className='min-w-0 flex-1 space-y-2'>
						{/* Name and timestamp row */}
						<div className='flex items-center gap-2'>
							<Skeleton className='h-4 w-24' />
							<Skeleton className='h-3 w-16' />
						</div>

						{/* Comment text - 1-2 lines */}
						<div className='space-y-1'>
							<Skeleton className='h-4 w-full' />
							{/* Randomly show second line for variety (50% chance) */}
							{index % 2 === 0 && <Skeleton className='h-4 w-2/3' />}
						</div>

						{/* Action buttons row */}
						<div className='flex items-center gap-4'>
							<Skeleton className='h-8 w-12' />
							<Skeleton className='h-8 w-12' />
						</div>
					</div>
				</div>
			))}
		</>
	)
}
