import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]'>
				<div>
					{/* Search bar skeleton */}
					<div className='mb-2'>
						<Skeleton className='h-12 w-full rounded-xl' />
					</div>

					{/* Trending searches skeleton */}
					<div className='mb-6 flex items-center gap-2 px-1'>
						<Skeleton className='h-4 w-16 rounded' />
						<Skeleton className='h-4 w-20 rounded' />
						<Skeleton className='h-4 w-24 rounded' />
						<Skeleton className='h-4 w-16 rounded' />
					</div>

					{/* Hero/Featured Recipe skeleton */}
					<div className='mb-6 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card'>
						<div className='grid gap-4 p-4 sm:gap-6 sm:p-6 md:grid-cols-2'>
							<Skeleton className='aspect-[16/9] w-full rounded-xl sm:aspect-[4/3] md:min-h-[300px]' />
							<div className='space-y-3'>
								<div className='flex gap-2'>
									<Skeleton className='h-6 w-16 rounded-full' />
									<Skeleton className='h-6 w-14 rounded-full' />
									<Skeleton className='h-6 w-20 rounded-full' />
								</div>
								<Skeleton className='h-8 w-3/4 rounded-xl' />
								<Skeleton className='h-4 w-full rounded' />
								<Skeleton className='h-4 w-5/6 rounded' />
								<div className='flex gap-3 pt-2'>
									<Skeleton className='h-11 w-28 rounded-xl' />
									<Skeleton className='h-11 w-24 rounded-xl' />
								</div>
							</div>
						</div>
					</div>

					{/* Recipe grid */}
					<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
						<RecipeCardSkeleton />
						<RecipeCardSkeleton />
						<RecipeCardSkeleton />
						<RecipeCardSkeleton />
						<RecipeCardSkeleton />
						<RecipeCardSkeleton />
					</div>
				</div>

				{/* Context rail skeleton */}
				<div className='hidden space-y-6 2xl:block'>
					<Skeleton className='h-80 w-full rounded-2xl' />
					<Skeleton className='h-48 w-full rounded-2xl' />
				</div>
			</div>

			<div className='pb-[calc(var(--h-mobile-nav)+var(--space-16))] md:pb-8' />
		</PageContainer>
	)
}
