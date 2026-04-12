import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			<div className='space-y-6 py-6'>
				{/* Header */}
				<div className='space-y-2'>
					<Skeleton className='h-9 w-44 rounded-lg' />
					<Skeleton className='h-5 w-72 rounded' />
				</div>

				{/* Collections Grid */}
				<div className='grid gap-4 sm:grid-cols-2'>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-card'
						>
							{/* Cover image skeleton */}
							<div className='h-32 animate-pulse bg-bg-elevated' />
							{/* Content skeleton */}
							<div className='space-y-2 p-4'>
								<Skeleton className='h-5 w-32' />
								<Skeleton className='h-4 w-20' />
							</div>
						</div>
					))}
				</div>
			</div>
		</PageContainer>
	)
}
