import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-6 space-y-2'>
				<div className='h-9 w-64 animate-pulse rounded-lg bg-muted/20' />
				<div className='h-6 w-96 animate-pulse rounded-lg bg-muted/20' />
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
