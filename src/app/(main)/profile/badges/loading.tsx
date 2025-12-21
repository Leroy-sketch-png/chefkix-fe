import { Skeleton } from '@/components/ui/skeleton'

export default function BadgesLoading() {
	return (
		<div className='min-h-screen bg-bg pb-20'>
			{/* Header Skeleton */}
			<div className='border-b border-border-subtle bg-bg-card/95'>
				<div className='mx-auto max-w-6xl px-4 py-4'>
					<div className='flex items-center gap-3'>
						<Skeleton className='size-10 rounded-full' />
						<div className='flex-1'>
							<Skeleton className='h-6 w-40' />
							<Skeleton className='mt-1 h-4 w-32' />
						</div>
						<Skeleton className='size-12 rounded-xl' />
					</div>
					<Skeleton className='mt-4 h-2 w-full rounded-full' />
					<div className='mt-4 flex flex-wrap gap-2'>
						<Skeleton className='h-10 flex-1 min-w-search rounded-lg' />
						<Skeleton className='h-10 w-36 rounded-lg' />
						<Skeleton className='h-10 w-32 rounded-lg' />
						<Skeleton className='h-10 w-28 rounded-lg' />
					</div>
				</div>
			</div>

			{/* Badge Grid Skeleton */}
			<div className='mx-auto max-w-6xl px-4 py-6'>
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
					{Array.from({ length: 20 }).map((_, i) => (
						<div
							key={i}
							className='flex flex-col items-center gap-3 rounded-2xl border-2 border-border-subtle bg-bg-elevated/50 p-4'
						>
							<Skeleton className='size-14 rounded-xl' />
							<Skeleton className='h-4 w-20' />
							<Skeleton className='h-3 w-24' />
							<Skeleton className='h-5 w-16 rounded-full' />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
