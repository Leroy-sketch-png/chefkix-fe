import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function YearInCookingLoading() {
	return (
		<PageContainer maxWidth='sm'>
			{/* Header */}
			<div className='mb-6 flex items-center gap-3'>
				<Skeleton className='size-10 rounded-xl' />
				<div className='flex-1'>
					<Skeleton className='h-6 w-44' />
					<Skeleton className='mt-1 h-4 w-16' />
				</div>
			</div>

			{/* Card carousel area */}
			<div className='mb-6 rounded-2xl'>
				{/* Progress dots */}
				<div className='mb-4 flex justify-center gap-1.5'>
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton
							key={i}
							className={`h-1.5 rounded-full ${i === 0 ? 'w-6' : 'w-1.5'}`}
						/>
					))}
				</div>

				{/* Card placeholder */}
				<Skeleton className='min-h-[380px] rounded-2xl' />
			</div>

			{/* Action buttons */}
			<div className='flex justify-center gap-3'>
				<Skeleton className='h-10 w-32 rounded-xl' />
				<Skeleton className='h-10 w-28 rounded-xl' />
			</div>

			{/* Hint text */}
			<Skeleton className='mx-auto mt-4 h-4 w-52' />
		</PageContainer>
	)
}
