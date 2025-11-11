import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-6 space-y-2'>
				<Skeleton className='h-9 w-48' />
				<Skeleton className='h-6 w-96' />
			</div>
			<div className='grid gap-6 md:grid-cols-2'>
				<Skeleton className='h-[500px] w-full rounded-lg' />
				<div className='space-y-4'>
					<Skeleton className='h-32 w-full rounded-lg' />
					<Skeleton className='h-32 w-full rounded-lg' />
					<Skeleton className='h-32 w-full rounded-lg' />
				</div>
			</div>
		</PageContainer>
	)
}
