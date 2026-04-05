import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header skeleton */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<Skeleton className='size-10 rounded-xl' />
					<Skeleton className='size-12 rounded-2xl' />
					<Skeleton className='h-9 w-40 rounded-lg' />
				</div>
				<Skeleton className='h-6 w-64 rounded-lg' />
			</div>

			{/* Filter tabs skeleton */}
			<div className='mb-6 flex gap-2'>
				<Skeleton className='h-10 w-16 rounded-full' />
				<Skeleton className='h-10 w-24 rounded-full' />
				<Skeleton className='h-10 w-20 rounded-full' />
				<Skeleton className='h-10 w-20 rounded-full' />
			</div>

			{/* Notification items skeleton */}
			<div className='space-y-3'>
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className='flex items-start gap-4 rounded-xl border border-border-subtle bg-bg-card p-4'
					>
						<Skeleton className='size-12 rounded-full' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-5 w-3/4' />
							<Skeleton className='h-4 w-1/2' />
						</div>
						<Skeleton className='size-8 rounded-lg' />
					</div>
				))}
			</div>
		</PageContainer>
	)
}
