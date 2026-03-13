import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
	return (
		<div className='space-y-4'>
			{/* Tab bar skeleton */}
			<div className='flex items-center justify-between'>
				<div className='flex gap-2'>
					<Skeleton className='h-10 w-24 rounded-md' />
					<Skeleton className='h-10 w-28 rounded-md' />
				</div>
				<Skeleton className='h-9 w-20 rounded-md' />
			</div>

			{/* Report card skeletons */}
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					key={i}
					className='rounded-xl border border-border-subtle bg-bg-card p-4'
				>
					<div className='flex items-center justify-between gap-3'>
						<div className='flex items-center gap-3'>
							<Skeleton className='size-10 rounded-lg' />
							<div className='space-y-2'>
								<div className='flex items-center gap-2'>
									<Skeleton className='h-4 w-28' />
									<Skeleton className='h-5 w-16 rounded-full' />
								</div>
								<Skeleton className='h-3 w-44' />
							</div>
						</div>
						<Skeleton className='h-3 w-24' />
					</div>
				</div>
			))}
		</div>
	)
}
