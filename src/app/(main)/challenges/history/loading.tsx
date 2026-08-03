import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Back button + title */}
			<div className='mb-6 flex items-center gap-3'>
				<Skeleton className='size-10 rounded-full' />
				<Skeleton className='h-8 w-48 rounded-xl' />
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

			<Skeleton className='h-72 w-full rounded-xl' />
		</PageContainer>
	)
}
