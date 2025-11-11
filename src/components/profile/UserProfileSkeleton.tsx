import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface UserProfileSkeletonProps {
	className?: string
}

/**
 * UserProfileSkeleton - Matches exact dimensions of UserProfile
 *
 * Structure:
 * - Cover image area
 * - Profile section:
 *   - Avatar (large circle)
 *   - Name and username
 *   - Bio text (2-3 lines)
 *   - Stats row (recipes, followers, following)
 *   - Action buttons (follow/message or edit profile)
 * - Tabs navigation
 * - Content grid placeholder
 *
 * Dimensions match UserProfile for smooth perceived performance
 */
export const UserProfileSkeleton = ({
	className,
}: UserProfileSkeletonProps) => {
	return (
		<div className={cn('space-y-6', className)}>
			{/* Cover Image */}
			<div className='relative'>
				<Skeleton className='h-48 w-full md:h-64 lg:h-80' />
			</div>

			{/* Profile Section */}
			<div className='relative -mt-20 px-4 md:px-6'>
				<div className='rounded-radius bg-bg-card p-6 shadow-md md:p-8'>
					{/* Avatar and Name Row */}
					<div className='mb-6 flex flex-col items-center gap-6 md:flex-row md:items-end'>
						{/* Large Avatar */}
						<Skeleton className='h-32 w-32 shrink-0 rounded-full border-4 border-bg-card shadow-lg md:h-40 md:w-40' />

						{/* Name and Bio Section */}
						<div className='flex-1 space-y-4 text-center md:text-left'>
							{/* Display Name */}
							<Skeleton className='mx-auto h-8 w-48 md:mx-0 md:w-64' />

							{/* Username */}
							<Skeleton className='mx-auto h-5 w-32 md:mx-0 md:w-40' />

							{/* Bio - 2 lines */}
							<div className='space-y-2'>
								<Skeleton className='mx-auto h-4 w-full max-w-xl md:mx-0' />
								<Skeleton className='mx-auto h-4 w-4/5 max-w-lg md:mx-0' />
							</div>
						</div>

						{/* Action Buttons (desktop) */}
						<div className='hidden items-center gap-3 md:flex'>
							<Skeleton className='h-11 w-28 rounded-sm' />
							<Skeleton className='h-11 w-28 rounded-sm' />
						</div>
					</div>

					{/* Stats Row */}
					<div className='mb-6 flex items-center justify-center gap-8 border-y border-border-subtle py-4 md:justify-start'>
						{/* Recipes stat */}
						<div className='space-y-1 text-center'>
							<Skeleton className='mx-auto h-6 w-12' />
							<Skeleton className='h-4 w-16' />
						</div>

						{/* Followers stat */}
						<div className='space-y-1 text-center'>
							<Skeleton className='mx-auto h-6 w-12' />
							<Skeleton className='h-4 w-20' />
						</div>

						{/* Following stat */}
						<div className='space-y-1 text-center'>
							<Skeleton className='mx-auto h-6 w-12' />
							<Skeleton className='h-4 w-20' />
						</div>
					</div>

					{/* Action Buttons (mobile) */}
					<div className='flex gap-3 md:hidden'>
						<Skeleton className='h-11 flex-1 rounded-sm' />
						<Skeleton className='h-11 flex-1 rounded-sm' />
					</div>

					{/* Badges Row */}
					<div className='mt-6 flex flex-wrap gap-3'>
						<Skeleton className='h-16 w-16 rounded-sm' />
						<Skeleton className='h-16 w-16 rounded-sm' />
						<Skeleton className='h-16 w-16 rounded-sm' />
						<Skeleton className='h-16 w-16 rounded-sm' />
					</div>
				</div>
			</div>

			{/* Tabs Navigation */}
			<div className='border-b border-border-subtle px-4 md:px-6'>
				<div className='flex gap-8'>
					<Skeleton className='h-12 w-20' />
					<Skeleton className='h-12 w-24' />
					<Skeleton className='h-12 w-20' />
					<Skeleton className='h-12 w-28' />
				</div>
			</div>

			{/* Content Grid Placeholder */}
			<div className='grid grid-cols-1 gap-6 px-4 md:grid-cols-2 md:px-6 lg:grid-cols-3'>
				<Skeleton className='aspect-square w-full rounded-radius' />
				<Skeleton className='aspect-square w-full rounded-radius' />
				<Skeleton className='aspect-square w-full rounded-radius' />
				<Skeleton className='aspect-square w-full rounded-radius' />
				<Skeleton className='aspect-square w-full rounded-radius' />
				<Skeleton className='aspect-square w-full rounded-radius' />
			</div>
		</div>
	)
}
