import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

function PostDetailSkeleton() {
	return (
		<div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]'>
			<div className='space-y-4'>
				{/* Command deck skeleton */}
				<Skeleton className='h-14 rounded-xl' />

				{/* Post card skeleton */}
				<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card md:p-6'>
					<div className='mb-4 flex items-center gap-3'>
						<Skeleton className='size-10 rounded-full' />
						<div className='flex-1'>
							<Skeleton className='mb-1 h-4 w-32' />
							<Skeleton className='h-3 w-24' />
						</div>
					</div>
					<div className='mb-4 space-y-2'>
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-3/4' />
						<Skeleton className='h-4 w-1/2' />
					</div>
					<Skeleton className='mb-4 aspect-video w-full rounded-lg' />
					<div className='flex gap-4'>
						<Skeleton className='h-8 w-16' />
						<Skeleton className='h-8 w-16' />
						<Skeleton className='h-8 w-16' />
					</div>
				</div>
			</div>

			{/* Rail skeleton */}
			<div className='hidden xl:flex xl:flex-col xl:gap-4'>
				<Skeleton className='h-40 rounded-xl' />
				<Skeleton className='h-60 rounded-xl' />
			</div>
		</div>
	)
}

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl' className='py-6'>
			<PostDetailSkeleton />
		</PageContainer>
	)
}
