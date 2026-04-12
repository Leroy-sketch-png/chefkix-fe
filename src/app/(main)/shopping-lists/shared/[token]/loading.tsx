import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer>
			<div className='mx-auto max-w-lg'>
				{/* Header skeleton */}
				<div className='mb-6'>
					<Skeleton className='mb-2 h-8 w-48 rounded-radius' />
					<Skeleton className='h-5 w-32 rounded-radius' />
				</div>

				{/* Progress bar skeleton */}
				<div className='mb-8 rounded-radius-lg bg-bg-card p-4 shadow-card'>
					<div className='mb-2 flex justify-between'>
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-4 w-16' />
					</div>
					<Skeleton className='h-2 w-full rounded-full' />
				</div>

				{/* Category group skeletons */}
				{[1, 2, 3].map(g => (
					<div key={g} className='mb-6'>
						<Skeleton className='mb-3 h-5 w-28' />
						<div className='space-y-2'>
							{[1, 2, 3].map(i => (
								<Skeleton key={i} className='h-12 rounded-radius' />
							))}
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
