import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='xl'>
			{/* Header skeleton */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<Skeleton className='size-10 rounded-xl' />
					<Skeleton className='h-8 w-40 rounded-lg' />
				</div>
				<Skeleton className='h-5 w-64 rounded' />
			</div>

			{/* Search bar */}
			<Skeleton className='mb-6 h-10 w-full rounded-xl' />

			{/* Friend cards skeleton */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card'
					>
						<div className='flex items-center gap-3'>
							<Skeleton className='size-12 rounded-full' />
							<div className='flex-1'>
								<Skeleton className='mb-1 h-5 w-28 rounded' />
								<Skeleton className='h-4 w-20 rounded' />
							</div>
							<Skeleton className='h-8 w-20 rounded-full' />
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
