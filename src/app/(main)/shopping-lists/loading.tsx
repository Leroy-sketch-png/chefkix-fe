import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header */}
			<div className='mb-6 space-y-2'>
				<Skeleton className='h-9 w-48 rounded-lg' />
				<Skeleton className='h-5 w-72 rounded' />
			</div>

			{/* Action button */}
			<div className='mb-6'>
				<Skeleton className='h-10 w-40 rounded-full' />
			</div>

			{/* Shopping list cards grid */}
			<div className='grid gap-4 sm:grid-cols-2'>
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className='h-28 animate-pulse rounded-xl bg-muted/20' />
				))}
			</div>
		</PageContainer>
	)
}
