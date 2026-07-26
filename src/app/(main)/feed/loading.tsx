import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]'>
				<div>
					{/* Story feed skeleton */}
					<div className='mb-4 flex gap-2 sm:mb-6'>
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className='flex flex-col items-center gap-1.5'>
								<Skeleton className='size-16 rounded-full' />
								<Skeleton className='h-3 w-12 rounded' />
							</div>
						))}
					</div>

					{/* FeedCommandDeck skeleton */}
					<div className='mb-4 sm:mb-6'>
						<Skeleton className='mb-3 h-5 w-48 rounded' />
						<div className='flex gap-2'>
							<Skeleton className='h-10 w-28 rounded-full' />
							<Skeleton className='h-10 w-28 rounded-full' />
							<Skeleton className='h-10 w-28 rounded-full' />
						</div>
					</div>

					{/* Post cards */}
					<div className='space-y-4'>
						<PostCardSkeleton />
						<PostCardSkeleton />
						<PostCardSkeleton />
					</div>

					<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
				</div>

				{/* Context rail skeleton */}
				<div className='hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24'>
					<Skeleton className='h-40 w-full rounded-xl' />
					<Skeleton className='h-52 w-full rounded-xl' />
					<Skeleton className='h-64 w-full rounded-xl' />
				</div>
			</div>
		</PageContainer>
	)
}
