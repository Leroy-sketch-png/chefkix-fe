import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-6 space-y-3'>
				<Skeleton className='h-10 w-72' />
				<Skeleton className='h-6 w-96' />
			</div>
			<div className='space-y-6'>
				<Skeleton className='h-64 w-full rounded-lg' />
				<Skeleton className='h-64 w-full rounded-lg' />
				<Skeleton className='h-64 w-full rounded-lg' />
			</div>
		</PageContainer>
	)
}
