import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			{/* Room header: code + recipe title */}
			<div className='mb-6 space-y-3'>
				<Skeleton className='h-9 w-56 rounded-lg' />
				<Skeleton className='h-5 w-40 rounded' />
			</div>

			{/* Participant avatars row */}
			<div className='mb-6 flex gap-3'>
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className='flex flex-col items-center gap-1'>
						<Skeleton className='size-12 rounded-full' />
						<Skeleton className='h-3 w-14 rounded' />
					</div>
				))}
			</div>

			{/* Step progress */}
			<div className='mb-6 space-y-2'>
				<Skeleton className='h-5 w-32 rounded' />
				<Skeleton className='h-3 w-full rounded-full' />
			</div>

			{/* Activity feed */}
			<div className='space-y-3'>
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className='flex items-start gap-3 rounded-lg p-3'>
						<Skeleton className='size-8 rounded-full' />
						<div className='flex-1 space-y-1'>
							<Skeleton className='h-4 w-48 rounded' />
							<Skeleton className='h-3 w-32 rounded' />
						</div>
					</div>
				))}
			</div>
		</PageContainer>
	)
}
