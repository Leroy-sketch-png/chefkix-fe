import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Back button + Header */}
			<div className='mb-8 flex items-center gap-3'>
				<Skeleton className='size-10 rounded-xl' />
				<div className='flex-1 space-y-2'>
					<Skeleton className='h-7 w-40' />
					<Skeleton className='h-4 w-72' />
				</div>
			</div>

			{/* Radar chart skeleton */}
			<div className='mx-auto mb-8 max-w-sm rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
				<Skeleton className='mx-auto size-72 rounded-full' />
				<Skeleton className='mx-auto mt-4 h-4 w-48' />
			</div>

			{/* Dimension breakdown */}
			<div className='space-y-3'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'
					>
						<Skeleton className='size-10 rounded-xl' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-4 w-28' />
							<Skeleton className='h-2 w-full rounded-full' />
						</div>
						<Skeleton className='h-6 w-12 rounded-lg' />
					</div>
				))}
			</div>
		</PageContainer>
	)
}
