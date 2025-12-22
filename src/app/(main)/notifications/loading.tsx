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
					<div className='h-9 w-40 animate-pulse rounded-lg bg-muted/20' />
				</div>
				<div className='h-6 w-64 animate-pulse rounded-lg bg-muted/20' />
			</div>

			{/* Filter tabs skeleton */}
			<div className='mb-6 flex gap-2'>
				<div className='h-10 w-16 animate-pulse rounded-full bg-muted/20' />
				<div className='h-10 w-24 animate-pulse rounded-full bg-muted/20' />
				<div className='h-10 w-20 animate-pulse rounded-full bg-muted/20' />
				<div className='h-10 w-20 animate-pulse rounded-full bg-muted/20' />
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
