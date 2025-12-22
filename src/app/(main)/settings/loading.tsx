import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header skeleton */}
			<div className='mb-8'>
				<div className='mb-2 flex items-center gap-3'>
					<div className='size-12 animate-pulse rounded-2xl bg-muted/20' />
					<div className='h-9 w-32 animate-pulse rounded-lg bg-muted/20' />
				</div>
				<div className='h-6 w-56 animate-pulse rounded-lg bg-muted/20' />
			</div>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]'>
				{/* Sidebar skeleton */}
				<div className='flex flex-col gap-1 rounded-xl border border-border bg-bg-card p-2'>
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className='flex items-center gap-3 rounded-lg px-4 py-3'
						>
							<Skeleton className='size-5' />
							<Skeleton className='h-5 w-24' />
						</div>
					))}
				</div>

				{/* Content skeleton */}
				<div className='space-y-6'>
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className='rounded-xl border border-border bg-bg-card p-6'
						>
							<Skeleton className='mb-4 h-6 w-40' />
							<div className='space-y-4'>
								<div className='flex items-center justify-between'>
									<Skeleton className='h-5 w-48' />
									<Skeleton className='h-6 w-12 rounded-full' />
								</div>
								<div className='flex items-center justify-between'>
									<Skeleton className='h-5 w-56' />
									<Skeleton className='h-6 w-12 rounded-full' />
								</div>
								<div className='flex items-center justify-between'>
									<Skeleton className='h-5 w-44' />
									<Skeleton className='h-6 w-12 rounded-full' />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</PageContainer>
	)
}
