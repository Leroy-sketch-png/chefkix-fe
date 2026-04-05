import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Page Header */}
			<div className='mb-4 space-y-2 md:mb-6'>
				<Skeleton className='h-9 w-40 rounded-lg' />
				<Skeleton className='h-5 w-56 rounded' />
			</div>

			{/* Feed Mode Tabs */}
			<div className='mb-6 flex gap-2'>
				<Skeleton className='h-10 w-24 rounded-full' />
				<Skeleton className='h-10 w-28 rounded-full' />
				<Skeleton className='h-10 w-20 rounded-full' />
			</div>

			{/* Create Post Form skeleton */}
			<div className='mb-4 rounded-xl border border-border-subtle bg-bg-card p-4 md:mb-6'>
				<div className='flex items-center gap-3'>
					<Skeleton className='size-10 rounded-full' />
					<Skeleton className='h-10 flex-1 rounded-lg' />
				</div>
			</div>

			{/* Post cards */}
			<div className='space-y-4 md:space-y-6'>
				<PostCardSkeleton count={3} showImages={false} />
			</div>
		</PageContainer>
	)
}
