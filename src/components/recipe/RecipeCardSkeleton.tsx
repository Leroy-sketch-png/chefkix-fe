import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface RecipeCardSkeletonProps {
	className?: string
	count?: number
}

/**
 * RecipeCardSkeleton - Matches exact dimensions of RecipeCard
 *
 * Structure:
 * - Aspect ratio [4/3] image placeholder
 * - Difficulty badge (top-left)
 * - Save button (top-right)
 * - Title (2 lines)
 * - Description (2 lines)
 * - Author info row
 * - Action button
 *
 * Dimensions match RecipeCard for smooth perceived performance
 */
export const RecipeCardSkeleton = ({
	className,
	count = 1,
}: RecipeCardSkeletonProps) => {
	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className={cn(
						'block overflow-hidden rounded-radius bg-bg-card shadow-md',
						className,
					)}
				>
					{/* Image skeleton with overlay elements */}
					<div className='relative aspect-[4/3] w-full overflow-hidden'>
						<Skeleton className='h-full w-full' />

						{/* Difficulty badge skeleton */}
						<Skeleton className='absolute left-2 top-2 h-6 w-16 rounded-xl' />

						{/* Save button skeleton */}
						<Skeleton className='absolute right-2 top-2 h-11 w-11 rounded-sm' />
					</div>

					{/* Content area */}
					<div className='space-y-3 p-4 md:p-6'>
						{/* Title skeleton - 2 lines */}
						<div className='space-y-2'>
							<Skeleton className='h-5 w-full' />
							<Skeleton className='h-5 w-3/4' />
						</div>

						{/* Description skeleton - 2 lines */}
						<div className='space-y-2'>
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-5/6' />
						</div>

						{/* Author and likes row */}
						<div className='flex items-center justify-between'>
							<Skeleton className='h-4 w-24' />
							<Skeleton className='h-4 w-16' />
						</div>

						{/* Action button */}
						<Skeleton className='h-11 w-full rounded-sm' />
					</div>
				</div>
			))}
		</>
	)
}
