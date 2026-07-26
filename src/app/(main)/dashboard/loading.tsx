import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			<div className='space-y-5 pb-[calc(var(--h-mobile-nav)+var(--space-24))] md:space-y-6 md:pb-8'>
				<div className='grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]'>
					<div className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card p-5'>
						<Skeleton className='mb-3 h-4 w-24 rounded' />
						<Skeleton className='mb-4 aspect-video w-full rounded-xl' />
						<Skeleton className='mb-2 h-6 w-3/4 rounded-xl' />
						<Skeleton className='mb-1 h-4 w-full rounded' />
						<Skeleton className='mb-4 h-4 w-2/3 rounded' />
						<div className='flex gap-2'>
							<Skeleton className='h-6 w-16 rounded-full' />
							<Skeleton className='h-6 w-20 rounded-full' />
							<Skeleton className='h-6 w-14 rounded-full' />
						</div>
					</div>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Skeleton className='h-5 w-40 rounded-xl' />
							<Skeleton className='h-4 w-56 rounded' />
						</div>
						<div className='grid gap-3'>
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={index}
									className='flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3'
								>
									<Skeleton className='size-14 rounded-lg' />
									<div className='flex-1 space-y-2'>
										<Skeleton className='h-4 w-2/3 rounded' />
										<Skeleton className='h-3 w-1/3 rounded' />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</PageContainer>
	)
}
