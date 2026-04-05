import { Skeleton } from '@/components/ui/skeleton'

export default function DevLoading() {
	return (
		<div className='mx-auto max-w-container-xl space-y-lg p-6'>
			{/* Header */}
			<Skeleton className='h-8 w-64' />
			<Skeleton className='h-4 w-96' />

			{/* Service status grid */}
			<div className='grid grid-cols-2 gap-md md:grid-cols-4'>
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						className='space-y-2 rounded-radius border border-border-subtle bg-bg-card p-4'
					>
						<Skeleton className='h-4 w-32' />
						<Skeleton className='h-6 w-16' />
					</div>
				))}
			</div>

			{/* API test results */}
			<Skeleton className='h-6 w-40' />
			<div className='space-y-2'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className='h-12 w-full rounded-radius' />
				))}
			</div>
		</div>
	)
}
