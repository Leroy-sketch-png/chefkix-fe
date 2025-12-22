import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='xl'>
			{/* Header skeleton */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<div className='size-10 animate-pulse rounded-xl bg-muted/20' />
					<div className='size-12 animate-pulse rounded-2xl bg-muted/20' />
					<div className='h-9 w-40 animate-pulse rounded-lg bg-muted/20' />
				</div>
				<div className='h-6 w-48 animate-pulse rounded-lg bg-muted/20' />
			</div>

			{/* Tabs skeleton */}
			<div className='mb-6 flex gap-2'>
				<div className='h-10 w-24 animate-pulse rounded-full bg-muted/20' />
				<div className='h-10 w-24 animate-pulse rounded-full bg-muted/20' />
				<div className='h-10 w-24 animate-pulse rounded-full bg-muted/20' />
			</div>

			{/* Top 3 podium skeleton */}
			<div className='mb-8 flex items-end justify-center gap-4'>
				<div className='flex flex-col items-center gap-2'>
					<Skeleton className='size-16 rounded-full' />
					<Skeleton className='h-4 w-20' />
					<Skeleton className='h-20 w-24 rounded-t-lg' />
				</div>
				<div className='flex flex-col items-center gap-2'>
					<Skeleton className='size-20 rounded-full' />
					<Skeleton className='h-4 w-24' />
					<Skeleton className='h-28 w-28 rounded-t-lg' />
				</div>
				<div className='flex flex-col items-center gap-2'>
					<Skeleton className='size-16 rounded-full' />
					<Skeleton className='h-4 w-20' />
					<Skeleton className='h-16 w-24 rounded-t-lg' />
				</div>
			</div>

			{/* List skeleton */}
			<div className='space-y-2'>
				{Array.from({ length: 7 }).map((_, i) => (
					<div
						key={i}
						className='flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-card p-4'
					>
						<Skeleton className='size-8 rounded-full' />
						<Skeleton className='size-12 rounded-full' />
						<div className='flex-1 space-y-1'>
							<Skeleton className='h-5 w-32' />
							<Skeleton className='h-4 w-24' />
						</div>
						<Skeleton className='h-8 w-20 rounded-full' />
					</div>
				))}
			</div>
		</PageContainer>
	)
}
