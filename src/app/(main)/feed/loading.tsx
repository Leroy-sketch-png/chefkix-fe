import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header */}
			<div className='mb-4 space-y-2 md:mb-6'>
				<Skeleton className='h-9 w-36 rounded-lg' />
				<Skeleton className='h-5 w-64 rounded' />
			</div>

			{/* Tab buttons */}
			<div className='mb-6 flex gap-2'>
				<Skeleton className='h-10 w-28 rounded-full' />
				<Skeleton className='h-10 w-28 rounded-full' />
			</div>

			{/* Post cards */}
			<div className='space-y-4'>
				<PostCardSkeleton />
				<PostCardSkeleton />
				<PostCardSkeleton />
			</div>
		</PageContainer>
	)
}
