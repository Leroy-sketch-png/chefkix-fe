import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='md'>
			{/* Back button + header */}
			<div className='mb-6'>
				<Skeleton className='mb-4 h-5 w-20 rounded' />
				<Skeleton className='h-8 w-56 rounded-lg' />
				<Skeleton className='mt-2 h-5 w-72 rounded' />
			</div>

			{/* Session info card skeleton */}
			<div className='mb-6 rounded-radius border border-border-subtle bg-bg-card p-4 md:p-6'>
				<div className='flex items-center gap-3'>
					<Skeleton className='size-12 rounded-xl' />
					<div className='flex-1 space-y-2'>
						<Skeleton className='h-5 w-40' />
						<Skeleton className='h-4 w-24' />
					</div>
					<Skeleton className='h-8 w-20 rounded-full' />
				</div>
			</div>

			{/* Photo upload area skeleton */}
			<div className='mb-6'>
				<Skeleton className='mb-2 h-5 w-24' />
				<div className='grid grid-cols-3 gap-3'>
					<Skeleton className='aspect-square rounded-xl' />
					<Skeleton className='aspect-square rounded-xl opacity-50' />
					<Skeleton className='aspect-square rounded-xl opacity-30' />
				</div>
			</div>

			{/* Text area skeleton */}
			<div className='mb-6'>
				<Skeleton className='mb-2 h-5 w-32' />
				<Skeleton className='h-32 w-full rounded-radius' />
			</div>

			{/* Submit button skeleton */}
			<Skeleton className='h-12 w-full rounded-radius' />
		</PageContainer>
	)
}
