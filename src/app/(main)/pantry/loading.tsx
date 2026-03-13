import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Header */}
			<div className='mb-6 space-y-2'>
				<Skeleton className='h-9 w-36 rounded-lg' />
				<Skeleton className='h-5 w-64 rounded' />
			</div>

			{/* Search bar */}
			<Skeleton className='mb-6 h-14 w-full rounded-xl' />

			{/* Category filter pills */}
			<div className='mb-6 flex gap-2'>
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className='h-8 w-20 rounded-full' />
				))}
			</div>

			{/* Pantry item rows */}
			<div className='space-y-3'>
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className='h-16 w-full rounded-xl' />
				))}
			</div>
		</PageContainer>
	)
}
