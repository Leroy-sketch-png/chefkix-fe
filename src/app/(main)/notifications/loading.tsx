import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start xl:gap-6'>
				<div className='space-y-3 sm:space-y-4'>
					{/* Command deck skeleton */}
					<div className='rounded-radius border border-border-subtle bg-bg-card p-4'>
						<Skeleton className='mb-3 h-5 w-48 rounded' />
						<div className='flex gap-2'>
							<Skeleton className='h-10 w-20 rounded-full' />
							<Skeleton className='h-10 w-24 rounded-full' />
							<Skeleton className='h-10 w-20 rounded-full' />
							<Skeleton className='h-10 w-24 rounded-full' />
						</div>
					</div>

					{/* Notification items skeleton */}
					<div className='space-y-3'>
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className='flex items-start gap-3 rounded-radius border border-border-subtle bg-bg-card p-4'
							>
								<Skeleton className='size-10 shrink-0 rounded-full' />
								<div className='flex-1 space-y-2'>
									<Skeleton className='h-4 w-3/4' />
									<Skeleton className='h-3 w-1/2' />
								</div>
								<Skeleton className='h-3 w-12' />
							</div>
						))}
					</div>
				</div>

				{/* Context rail skeleton */}
				<div className='hidden xl:flex xl:w-72 xl:flex-col xl:gap-4'>
					<Skeleton className='h-48 w-full rounded-xl' />
					<Skeleton className='h-36 w-full rounded-xl' />
				</div>
			</div>
		</PageContainer>
	)
}
