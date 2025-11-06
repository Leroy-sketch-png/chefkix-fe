'use client'

import { useEffect, useState } from 'react'
import { Recipe } from '@/lib/types/recipe'
import { getAllRecipes, getTrendingRecipes } from '@/services/recipe'
import { PageContainer } from '@/components/layout/PageContainer'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { StaggerContainer } from '@/components/ui/stagger-animation'

export default function ExplorePage() {
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'all' | 'trending'>('all')

	useEffect(() => {
		const fetchRecipes = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response =
					viewMode === 'trending'
						? await getTrendingRecipes({ limit: 20 })
						: await getAllRecipes({ limit: 20, search: searchQuery })

				if (response.success && response.data) {
					setRecipes(response.data)
				}
			} catch (err) {
				setError('Failed to load recipes')
			} finally {
				setIsLoading(false)
			}
		}

		const debounce = setTimeout(() => {
			fetchRecipes()
		}, 300)

		return () => clearTimeout(debounce)
	}, [searchQuery, viewMode])

	const handleRecipeUpdate = (updatedRecipe: Recipe) => {
		setRecipes(prev =>
			prev.map(r => (r.id === updatedRecipe.id ? updatedRecipe : r)),
		)
	}

	return (
		<PageContainer maxWidth='lg'>
			<div className='mb-6'>
				<h1 className='mb-2 text-3xl font-bold'>Explore Recipes</h1>
				<p className='text-muted-foreground'>
					Discover new dishes and flavors from around the world.
				</p>
			</div>

			{/* Search & Filter Bar */}
			<div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
					<Input
						placeholder='Search recipes...'
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className='pl-10'
					/>
				</div>
				<div className='flex gap-2'>
					<button
						onClick={() => setViewMode('all')}
						className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
							viewMode === 'all'
								? 'bg-primary text-primary-foreground'
								: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
						}`}
					>
						All Recipes
					</button>
					<button
						onClick={() => setViewMode('trending')}
						className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
							viewMode === 'trending'
								? 'bg-primary text-primary-foreground'
								: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
						}`}
					>
						<TrendingUp className='h-4 w-4' />
						Trending
					</button>
				</div>
			</div>

			{/* Content */}
			{isLoading && (
				<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
					{[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
						<RecipeCardSkeleton key={i} />
					))}
				</div>
			)}

			{error && (
				<ErrorState
					title='Failed to load recipes'
					message={error}
					onRetry={() => window.location.reload()}
				/>
			)}

			{!isLoading && !error && recipes.length === 0 && (
				<EmptyState
					title='No recipes found'
					description={
						searchQuery
							? `No recipes match "${searchQuery}". Try a different search.`
							: 'Be the first to share a recipe!'
					}
					icon={Search}
				/>
			)}

			{!isLoading && !error && recipes.length > 0 && (
				<StaggerContainer className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
					{recipes.map(recipe => (
						<RecipeCard
							key={recipe.id}
							recipe={recipe}
							onUpdate={handleRecipeUpdate}
						/>
					))}
				</StaggerContainer>
			)}
		</PageContainer>
	)
}

function RecipeCardSkeleton() {
	return (
		<div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
			<Skeleton className='h-48 w-full' />
			<div className='p-4'>
				<Skeleton className='mb-2 h-6 w-3/4' />
				<Skeleton className='mb-4 h-4 w-full' />
				<Skeleton className='mb-4 h-4 w-1/2' />
				<Skeleton className='h-10 w-full' />
			</div>
		</div>
	)
}
