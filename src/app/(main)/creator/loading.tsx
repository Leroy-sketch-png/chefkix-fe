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
					<div className='h-9 w-48 animate-pulse rounded-lg bg-muted/20' />
				</div>
				<div className='h-6 w-72 animate-pulse rounded-lg bg-muted/20' />
			</div>

			{/* Stats cards skeleton */}
			<div className='mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className='rounded-xl border border-border-subtle bg-bg-card p-4'
					>
						<Skeleton className='mb-2 h-4 w-24' />
						<Skeleton className='mb-1 h-8 w-20' />
						<Skeleton className='h-4 w-16' />
					</div>
				))}
			</div>

			{/* Chart skeleton */}
			<div className='mb-8 rounded-xl border border-border-subtle bg-bg-card p-6'>
				<Skeleton className='mb-4 h-6 w-40' />
				<Skeleton className='h-64 w-full' />
			</div>

			{/* Recipe performance skeleton */}
			<div className='rounded-xl border border-border-subtle bg-bg-card p-6'>
				<Skeleton className='mb-4 h-6 w-48' />
				<div className='space-y-3'>
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className='flex items-center gap-4'>
							<Skeleton className='size-16 rounded-lg' />
							<div className='flex-1 space-y-2'>
								<Skeleton className='h-5 w-48' />
								<Skeleton className='h-4 w-32' />
							</div>
							<Skeleton className='h-8 w-24' />
						</div>
					))}
				</div>
			</div>
		</PageContainer>
	)
}
