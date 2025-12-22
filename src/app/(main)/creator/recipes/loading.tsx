import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			{/* Header skeleton */}
			<div className='mb-8'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<div className='size-10 animate-pulse rounded-xl bg-muted/20' />
						<div className='size-12 animate-pulse rounded-2xl bg-muted/20' />
						<div className='space-y-1'>
							<div className='h-9 w-36 animate-pulse rounded-lg bg-muted/20' />
							<div className='h-5 w-28 animate-pulse rounded-lg bg-muted/20' />
						</div>
					</div>
					<div className='h-10 w-36 animate-pulse rounded-lg bg-muted/20' />
				</div>
			</div>

			{/* Filters skeleton */}
			<div className='mb-6 flex items-center justify-between'>
				<div className='h-10 w-64 animate-pulse rounded-lg bg-muted/20' />
				<div className='h-10 w-40 animate-pulse rounded-lg bg-muted/20' />
			</div>

			{/* Recipe grid skeleton */}
			<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card'
					>
						<Skeleton className='h-48 w-full' />
						<div className='space-y-3 p-4'>
							<Skeleton className='h-6 w-3/4' />
							<Skeleton className='h-4 w-1/2' />
							<div className='flex gap-2 pt-2'>
								<Skeleton className='h-6 w-16 rounded-full' />
								<Skeleton className='h-6 w-20 rounded-full' />
							</div>
							<div className='flex gap-2 pt-2'>
								<Skeleton className='h-9 flex-1 rounded-lg' />
								<Skeleton className='size-9 rounded-lg' />
								<Skeleton className='size-9 rounded-lg' />
							</div>
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
