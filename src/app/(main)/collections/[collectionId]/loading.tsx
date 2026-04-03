import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			<div className='space-y-6 py-6'>
				{/* Back button + Header */}
				<div className='flex items-center gap-3'>
					<Skeleton className='size-10 rounded-xl' />
					<div className='flex-1 space-y-2'>
						<Skeleton className='h-7 w-48' />
						<Skeleton className='h-4 w-64' />
					</div>
				</div>

				{/* Cover image */}
				<Skeleton className='h-48 w-full rounded-xl' />

				{/* Posts grid */}
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-card'
						>
							<div className='aspect-square animate-pulse bg-bg-elevated' />
							<div className='space-y-2 p-3'>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-3 w-20' />
							</div>
						</div>
					))}
				</div>
			</div>
		</PageContainer>
	)
}
