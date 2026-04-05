import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-6 space-y-2'>
				<Skeleton className='h-9 w-64 rounded-lg' />
				<Skeleton className='h-6 w-96 rounded-lg' />
			</div>
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
				<RecipeCardSkeleton />
				<RecipeCardSkeleton />
				<RecipeCardSkeleton />
				<RecipeCardSkeleton />
				<RecipeCardSkeleton />
				<RecipeCardSkeleton />
			</div>
		</PageContainer>
	)
}
