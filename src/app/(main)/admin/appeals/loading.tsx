import { Skeleton } from '@/components/ui/skeleton'

export default function AppealsLoading() {
	return (
		<div className='space-y-3'>
			{/* Header */}
			<div className='mb-4 flex items-center justify-between'>
				<Skeleton className='h-4 w-28' />
				<Skeleton className='h-9 w-20 rounded-md' />
			</div>

			{/* Appeal card skeletons */}
			{Array.from({ length: 4 }).map((_, i) => (
				<div
					key={i}
					className='rounded-xl border border-border-subtle bg-bg-card p-4'
				>
					<div className='flex items-center justify-between gap-3'>
						<div className='flex items-center gap-3'>
							<Skeleton className='size-10 rounded-lg' />
							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-5 w-16 rounded-full' />
								</div>
								<Skeleton className='h-3 w-40' />
							</div>
						</div>
						<Skeleton className='size-4 rounded' />
					</div>
				</div>
			))}
		</div>
	)
}
