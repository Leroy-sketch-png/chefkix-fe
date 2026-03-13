import { Skeleton } from '@/components/ui/skeleton'

export default function BansLoading() {
	return (
		<div className='space-y-6'>
			{/* Search bar skeleton */}
			<div className='flex gap-2'>
				<Skeleton className='h-10 flex-1 rounded-xl' />
				<Skeleton className='h-10 w-24 rounded-md' />
			</div>

			{/* Ban card skeletons */}
			{Array.from({ length: 3 }).map((_, i) => (
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
									<Skeleton className='h-5 w-14 rounded-full' />
									<Skeleton className='h-5 w-12 rounded-full' />
								</div>
								<Skeleton className='h-3 w-52' />
							</div>
						</div>
						<Skeleton className='h-9 w-20 rounded-md' />
					</div>
					<Skeleton className='mt-2 h-3 w-64' />
				</div>
			))}
		</div>
	)
}
