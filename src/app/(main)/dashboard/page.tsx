'use client'

import { useEffect, useState } from 'react'
import { Recipe } from '@/lib/types/recipe'
import { getFeedRecipes } from '@/services/recipe'
import { PageContainer } from '@/components/layout/PageContainer'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Stories } from '@/components/social/Stories'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { ChefHat, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchFeed = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await getFeedRecipes({ limit: 20 })
				if (response.success && response.data) {
					setRecipes(response.data)
				}
			} catch (err) {
				setError('Failed to load feed')
			} finally {
				setIsLoading(false)
			}
		}

		fetchFeed()
	}, [])

	const handleRecipeUpdate = (updatedRecipe: Recipe) => {
		setRecipes(prev =>
			prev.map(r => (r.id === updatedRecipe.id ? updatedRecipe : r)),
		)
	}

	return (
		<PageContainer maxWidth='xl'>
			{/* Stories Bar - Only show on mobile/tablet, hidden on desktop where RightSidebar shows it */}
			<div className='mb-6 lg:hidden'>
				<Stories variant='horizontal' />
			</div>

			<div className='mb-6'>
				<h1 className='mb-2 text-3xl font-bold'>Your Feed</h1>
				<p className='text-muted-foreground'>
					Latest recipes from your friends and favorite chefs
				</p>
			</div>

			{/* Content */}
			{isLoading && (
				<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
					{[1, 2, 3, 4, 5, 6].map(i => (
						<RecipeCardSkeleton key={i} />
					))}
				</div>
			)}

			{error && (
				<ErrorState
					title='Failed to load feed'
					description={error}
					action={{
						label: 'Try Again',
						onClick: () => window.location.reload(),
					}}
				/>
			)}

			{!isLoading && !error && recipes.length === 0 && (
				<EmptyState
					title='Your feed is empty'
					description='Follow chefs and add friends to see their latest recipes here!'
					icon={Users}
					action={
						<div className='flex gap-3'>
							<Link href='/discover'>
								<Button>
									<Users className='mr-2 h-4 w-4' />
									Discover People
								</Button>
							</Link>
							<Link href='/explore'>
								<Button variant='outline'>
									<ChefHat className='mr-2 h-4 w-4' />
									Browse Recipes
								</Button>
							</Link>
						</div>
					}
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
