import { Skeleton } from '@/components/ui/skeleton'

export function PostDetailSkeleton() {
	return (
		<div className='space-y-4'>
			<Skeleton className='h-11 w-24 rounded-lg' />

			<div className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card md:p-6'>
				<div className='mb-4 flex items-center gap-3'>
					<Skeleton className='size-10 rounded-full' />
					<div className='flex-1'>
						<Skeleton className='mb-1 h-4 w-32' />
						<Skeleton className='h-3 w-24' />
					</div>
				</div>

				<div className='mb-4 space-y-2'>
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-3/4' />
					<Skeleton className='h-4 w-1/2' />
				</div>

				<Skeleton className='mb-4 aspect-video w-full rounded-lg' />

				<div className='flex gap-4'>
					<Skeleton className='h-8 w-16' />
					<Skeleton className='h-8 w-16' />
					<Skeleton className='h-8 w-16' />
				</div>
			</div>
		</div>
	)
}
