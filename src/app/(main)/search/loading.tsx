import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header skeleton */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<div className='size-10 animate-pulse rounded-xl bg-muted/20' />
					<div className='size-12 animate-pulse rounded-2xl bg-muted/20' />
					<div className='h-9 w-64 animate-pulse rounded-lg bg-muted/20' />
				</div>
				<div className='h-6 w-32 animate-pulse rounded-lg bg-muted/20' />
			</div>

			{/* Tabs skeleton */}
			<div className='mb-8 flex gap-4 border-b-2 border-border'>
				<div className='h-12 w-24 animate-pulse rounded-t-lg bg-muted/20' />
				<div className='h-12 w-24 animate-pulse rounded-t-lg bg-muted/20' />
				<div className='h-12 w-24 animate-pulse rounded-t-lg bg-muted/20' />
			</div>

			{/* Results grid skeleton */}
			<div className='grid gap-4 sm:grid-cols-2'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card'
					>
						<Skeleton className='h-40 w-full' />
						<div className='space-y-2 p-4'>
							<Skeleton className='h-5 w-3/4' />
							<Skeleton className='h-4 w-1/2' />
							<div className='flex gap-2 pt-2'>
								<Skeleton className='h-6 w-16 rounded-full' />
								<Skeleton className='h-6 w-20 rounded-full' />
							</div>
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
