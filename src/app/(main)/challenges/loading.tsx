import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header skeleton */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<div className='size-12 animate-pulse rounded-2xl bg-muted/20' />
					<div className='h-9 w-40 animate-pulse rounded-lg bg-muted/20' />
				</div>
				<div className='h-6 w-56 animate-pulse rounded-lg bg-muted/20' />
			</div>

			{/* Daily Challenge Banner skeleton */}
			<div className='mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-r from-streak/10 to-streak-urgent/10 p-6'>
				<div className='flex items-center gap-4'>
					<Skeleton className='size-16 rounded-2xl' />
					<div className='flex-1 space-y-2'>
						<Skeleton className='h-6 w-48' />
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-3/4' />
					</div>
					<Skeleton className='h-10 w-28 rounded-full' />
				</div>
			</div>

			{/* Challenge Grid skeleton */}
			<div className='grid gap-4 md:grid-cols-2'>
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card p-4'
					>
						<div className='flex items-start gap-4'>
							<Skeleton className='size-12 rounded-xl' />
							<div className='flex-1 space-y-2'>
								<Skeleton className='h-5 w-3/4' />
								<Skeleton className='h-4 w-full' />
								<div className='flex gap-2 pt-2'>
									<Skeleton className='h-6 w-20 rounded-full' />
									<Skeleton className='h-6 w-16 rounded-full' />
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
