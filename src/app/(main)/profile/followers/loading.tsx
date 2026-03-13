import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='md'>
			{/* Back button + title */}
			<div className='mb-6 flex items-center gap-3'>
				<Skeleton className='size-10 rounded-full' />
				<Skeleton className='h-8 w-48 rounded-lg' />
			</div>

			{/* Tabs */}
			<div className='mb-6 flex gap-2'>
				<Skeleton className='h-10 w-28 rounded-full' />
				<Skeleton className='h-10 w-28 rounded-full' />
				<Skeleton className='h-10 w-28 rounded-full' />
			</div>

			{/* User cards */}
			<div className='space-y-3'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className='flex items-center gap-3 rounded-xl p-3'>
						<Skeleton className='size-10 rounded-full' />
						<div className='flex-1 space-y-1.5'>
							<Skeleton className='h-4 w-32 rounded' />
							<Skeleton className='h-3 w-20 rounded' />
						</div>
						<Skeleton className='h-8 w-24 rounded-full' />
					</div>
				))}
			</div>
		</PageContainer>
	)
}
