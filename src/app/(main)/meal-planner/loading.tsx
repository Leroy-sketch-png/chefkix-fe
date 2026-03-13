import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='xl'>
			{/* Header */}
			<div className='mb-6 space-y-2'>
				<Skeleton className='h-9 w-44 rounded-lg' />
				<Skeleton className='h-5 w-72 rounded' />
			</div>

			{/* Action buttons */}
			<div className='mb-6 flex gap-3'>
				<Skeleton className='h-10 w-36 rounded-full' />
				<Skeleton className='h-10 w-36 rounded-full' />
			</div>

			{/* 7-column calendar grid */}
			<div className='grid grid-cols-7 gap-3'>
				{Array.from({ length: 21 }).map((_, i) => (
					<Skeleton key={i} className='h-24 rounded-xl' />
				))}
			</div>
		</PageContainer>
	)
}
