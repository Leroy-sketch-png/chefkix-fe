import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<PageContainer maxWidth='2xl'>
			{/* Page Header */}
			<div className='mb-4 space-y-2 md:mb-6'>
				<Skeleton className='h-9 w-40 rounded-lg' />
				<Skeleton className='h-5 w-72 rounded' />
			</div>

			{/* Hero/Featured Recipe skeleton */}
			<div className='mb-6 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card'>
				<div className='grid gap-4 p-4 sm:gap-6 sm:p-6 md:grid-cols-2'>
					<Skeleton className='aspect-[16/9] w-full rounded-xl sm:aspect-[4/3]' />
					<div className='space-y-3'>
						<Skeleton className='h-4 w-20 rounded' />
						<Skeleton className='h-7 w-3/4 rounded-lg' />
						<Skeleton className='h-4 w-full rounded' />
						<div className='flex gap-3 pt-2'>
							<Skeleton className='h-10 w-28 rounded-xl' />
							<Skeleton className='h-10 w-24 rounded-xl' />
						</div>
					</div>
				</div>
			</div>

			{/* Tonight's Pick skeleton */}
			<Skeleton className='mb-6 h-24 w-full rounded-2xl' />

			{/* Season's Best collections skeleton */}
			<div className='mb-6'>
				<div className='mb-4 flex items-center justify-between'>
					<Skeleton className='h-7 w-40 rounded-lg' />
					<Skeleton className='h-5 w-16 rounded' />
				</div>
				<div className='flex gap-4 overflow-hidden'>
					<Skeleton className='h-44 w-64 shrink-0 rounded-2xl' />
					<Skeleton className='h-44 w-64 shrink-0 rounded-2xl' />
					<Skeleton className='h-44 w-64 shrink-0 rounded-2xl' />
				</div>
			</div>

			{/* Search + Filter bar skeleton */}
			<div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center'>
				<Skeleton className='h-12 flex-1 rounded-xl' />
				<Skeleton className='h-12 w-28 rounded-xl' />
			</div>

			{/* Filter chips skeleton */}
			<div className='mb-6 flex gap-2'>
				<Skeleton className='h-8 w-20 rounded-full' />
				<Skeleton className='h-8 w-24 rounded-full' />
				<Skeleton className='h-8 w-20 rounded-full' />
				<Skeleton className='h-8 w-16 rounded-full' />
			</div>

			{/* Recipe grid */}
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
