import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header skeleton */}
			<div className='mb-8 flex items-center gap-3'>
				<Skeleton className='size-12 rounded-2xl' />
				<Skeleton className='h-7 w-28 rounded-xl' />
			</div>

			{/* Tab bar skeleton */}
			<div className='mb-6 flex gap-2'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className='h-10 w-24 rounded-xl' />
				))}
			</div>

			{/* Settings cards skeleton */}
			<div className='space-y-6'>
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className='rounded-2xl border border-border-subtle bg-bg-card p-6'
					>
						<Skeleton className='mb-4 h-5 w-1/4 rounded' />
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<Skeleton className='h-4 w-1/3' />
								<Skeleton className='h-6 w-11 rounded-full' />
							</div>
							<div className='flex items-center justify-between'>
								<Skeleton className='h-4 w-2/5' />
								<Skeleton className='h-6 w-11 rounded-full' />
							</div>
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
