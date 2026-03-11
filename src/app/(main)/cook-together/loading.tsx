import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<Skeleton className='size-10 rounded-xl' />
					<Skeleton className='h-8 w-48 rounded-lg' />
				</div>
				<Skeleton className='h-5 w-72 rounded' />
			</div>

			{/* Active room banner skeleton */}
			<Skeleton className='mb-6 h-20 w-full rounded-radius' />

			{/* Join room section */}
			<div className='mb-6 rounded-radius border border-border-subtle bg-bg-card p-4 md:p-6'>
				<Skeleton className='mb-3 h-6 w-32' />
				<div className='flex gap-3'>
					<Skeleton className='h-11 flex-1 rounded-radius' />
					<Skeleton className='h-11 w-24 rounded-radius' />
				</div>
			</div>

			{/* Create room card skeleton */}
			<div className='rounded-radius border border-border-subtle bg-bg-card p-4 md:p-6'>
				<Skeleton className='mb-3 h-6 w-40' />
				<Skeleton className='mb-4 h-4 w-64' />
				<Skeleton className='h-11 w-36 rounded-radius' />
			</div>
		</PageContainer>
	)
}
