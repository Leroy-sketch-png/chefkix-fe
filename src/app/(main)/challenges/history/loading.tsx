import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Back button + title */}
			<div className='mb-6 flex items-center gap-3'>
				<Skeleton className='size-10 rounded-full' />
				<Skeleton className='h-8 w-48 rounded-lg' />
			</div>

			{/* Stats summary cards */}
			<div className='mb-6 grid grid-cols-3 gap-4'>
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className='h-20 animate-pulse rounded-xl bg-bg-elevated/40'
					/>
				))}
			</div>

			{/* Month navigation */}
			<div className='mb-4 flex items-center justify-between'>
				<Skeleton className='size-8 rounded-full' />
				<Skeleton className='h-6 w-32 rounded' />
				<Skeleton className='size-8 rounded-full' />
			</div>

			{/* Calendar grid (7 cols x 5 rows) */}
			<div className='grid grid-cols-7 gap-2'>
				{Array.from({ length: 35 }).map((_, i) => (
					<Skeleton key={i} className='aspect-square rounded-lg' />
				))}
			</div>
		</PageContainer>
	)
}
