import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='xl'>
			{/* Header skeleton - matches page header pattern */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<Skeleton className='size-12 rounded-2xl' />
					<Skeleton className='h-9 w-48 rounded-lg' />
				</div>
				<div className='flex items-center gap-2'>
					<Skeleton className='size-4 rounded' />
					<Skeleton className='h-5 w-64 rounded' />
				</div>
			</div>

			{/* Tabs skeleton */}
			<div className='mb-6 flex gap-2'>
				<Skeleton className='h-10 w-24 rounded-full' />
				<Skeleton className='h-10 w-24 rounded-full' />
				<Skeleton className='h-10 w-32 rounded-full' />
			</div>

			{/* Search bar skeleton */}
			<div className='mb-6 max-w-md'>
				<Skeleton className='h-10 w-full rounded-radius' />
			</div>

			{/* User grid skeleton */}
			<div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
				{Array.from({ length: 8 }).map((_, i) => (
					<UserCardSkeleton key={i} />
				))}
			</div>
		</PageContainer>
	)
}

function UserCardSkeleton() {
	return (
		<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card md:p-6'>
			<div className='flex items-center gap-4'>
				<Skeleton className='size-16 flex-shrink-0 rounded-full' />
				<div className='flex-1 space-y-2'>
					<Skeleton className='h-5 w-3/4' />
					<Skeleton className='h-4 w-1/2' />
				</div>
			</div>
			<div className='mt-4 flex justify-around'>
				<div className='space-y-1 text-center'>
					<Skeleton className='mx-auto h-5 w-8' />
					<Skeleton className='mx-auto h-3 w-16' />
				</div>
				<div className='space-y-1 text-center'>
					<Skeleton className='mx-auto h-5 w-6' />
					<Skeleton className='mx-auto h-3 w-12' />
				</div>
			</div>
		</div>
	)
}
