import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			{/* Hero image skeleton */}
			<Skeleton className='mb-6 h-64 w-full rounded-2xl md:h-80' />

			{/* Title + badges row */}
			<div className='mb-4 flex items-start justify-between'>
				<div className='space-y-2'>
					<Skeleton className='h-8 w-72 rounded-lg' />
					<div className='flex items-center gap-2'>
						<Skeleton className='h-6 w-20 rounded-full' />
						<Skeleton className='h-6 w-16 rounded-full' />
					</div>
				</div>
				<div className='flex gap-2'>
					<Skeleton className='size-10 rounded-full' />
					<Skeleton className='size-10 rounded-full' />
					<Skeleton className='size-10 rounded-full' />
				</div>
			</div>

			{/* Stats row (prep time, cook time, servings) */}
			<div className='mb-6 flex gap-4'>
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className='flex items-center gap-2'>
						<Skeleton className='size-5 rounded' />
						<Skeleton className='h-4 w-16' />
					</div>
				))}
			</div>

			{/* Description */}
			<div className='mb-6 space-y-2'>
				<Skeleton className='h-4 w-full' />
				<Skeleton className='h-4 w-5/6' />
				<Skeleton className='h-4 w-4/6' />
			</div>

			{/* Ingredients section */}
			<div className='mb-6'>
				<Skeleton className='mb-3 h-6 w-32' />
				<div className='space-y-2'>
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className='flex items-center gap-3'>
							<Skeleton className='size-4 rounded' />
							<Skeleton className='h-4 w-48' />
						</div>
					))}
				</div>
			</div>

			{/* Steps section */}
			<div>
				<Skeleton className='mb-3 h-6 w-24' />
				<div className='space-y-4'>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className='rounded-radius border border-border-subtle bg-bg-card p-4'
						>
							<div className='mb-2 flex items-center gap-3'>
								<Skeleton className='flex size-8 shrink-0 rounded-full' />
								<Skeleton className='h-5 w-40' />
							</div>
							<Skeleton className='h-4 w-full' />
							<Skeleton className='mt-1 h-4 w-3/4' />
						</div>
					))}
				</div>
			</div>
		</PageContainer>
	)
}
