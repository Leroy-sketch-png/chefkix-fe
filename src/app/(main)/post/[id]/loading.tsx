import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='md' className='py-6'>
			{/* Back button */}
			<div className='mb-4 flex items-center gap-2'>
				<Skeleton className='size-8 rounded-full' />
				<Skeleton className='h-5 w-16 rounded' />
			</div>

			{/* Post card */}
			<PostCardSkeleton />

			{/* Comment section */}
			<div className='mt-6 space-y-4'>
				<Skeleton className='h-6 w-28 rounded' />
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className='flex items-start gap-3'>
						<Skeleton className='size-8 rounded-full' />
						<div className='flex-1 space-y-1'>
							<Skeleton className='h-4 w-24 rounded' />
							<Skeleton className='h-3 w-full rounded' />
							<Skeleton className='h-3 w-3/4 rounded' />
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
