import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg'>
			<div className='mb-4 space-y-2 md:mb-6'>
				<div className='h-9 w-48 animate-pulse rounded-lg bg-muted/20' />
				<div className='h-6 w-96 animate-pulse rounded-lg bg-muted/20' />
			</div>
			<PostCardSkeleton />
			<PostCardSkeleton />
			<PostCardSkeleton />
		</PageContainer>
	)
}
