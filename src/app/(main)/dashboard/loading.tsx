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

			{/* Tonight's Pick hero card */}
			<div className='mb-6 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card'>
				<div className='grid gap-4 p-4 sm:gap-6 sm:p-6 md:grid-cols-2'>
					<Skeleton className='aspect-[16/9] w-full rounded-xl sm:aspect-[4/3]' />
					<div className='space-y-3'>
						<Skeleton className='h-4 w-24 rounded' />
						<Skeleton className='h-7 w-3/4 rounded-lg' />
						<Skeleton className='h-4 w-full rounded' />
						<Skeleton className='h-4 w-2/3 rounded' />
						<div className='flex gap-3 pt-2'>
							<Skeleton className='h-5 w-16 rounded-full' />
							<Skeleton className='h-5 w-16 rounded-full' />
							<Skeleton className='h-5 w-16 rounded-full' />
						</div>
					</div>
				</div>
			</div>

			{/* Seasonal Banner placeholder */}
			<Skeleton className='mb-6 h-20 w-full rounded-2xl' />

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
