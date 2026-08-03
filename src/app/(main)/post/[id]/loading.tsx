import { PageContainer } from '@/components/layout/PageContainer'
import { PostDetailSkeleton } from './PostDetailSkeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='lg' className='py-6'>
			<PostDetailSkeleton />
		</PageContainer>
	)
}
