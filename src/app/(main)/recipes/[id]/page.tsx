'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Recipe } from '@/lib/types/recipe'
import {
	getRecipeById,
	toggleLikeRecipe,
	toggleSaveRecipe,
} from '@/services/recipe'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import {
	Heart,
	Bookmark,
	Clock,
	Users,
	ChefHat,
	Play,
	Share2,
	Eye,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useUiStore } from '@/store/uiStore'

export default function RecipeDetailPage() {
	const params = useParams()
	const router = useRouter()
	const recipeId = params?.id as string
	const { toggleCookingPlayer } = useUiStore()

	const [recipe, setRecipe] = useState<Recipe | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isLiked, setIsLiked] = useState(false)
	const [isSaved, setIsSaved] = useState(false)
	const [likeCount, setLikeCount] = useState(0)
	const [saveCount, setSaveCount] = useState(0)
	const [isLikeLoading, setIsLikeLoading] = useState(false)
	const [isSaveLoading, setIsSaveLoading] = useState(false)

	useEffect(() => {
		const fetchRecipe = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await getRecipeById(recipeId)
				if (response.success && response.data) {
					setRecipe(response.data)
					setIsLiked(response.data.isLiked ?? false)
					setIsSaved(response.data.isSaved ?? false)
					setLikeCount(response.data.likeCount)
					setSaveCount(response.data.saveCount)
				} else {
					setError('Recipe not found')
				}
			} catch (err) {
				setError('Failed to load recipe')
			} finally {
				setIsLoading(false)
			}
		}

		if (recipeId) {
			fetchRecipe()
		}
	}, [recipeId])

	const handleLike = async () => {
		if (isLikeLoading) return

		const previousLiked = isLiked
		const previousCount = likeCount
		setIsLiked(!isLiked)
		setLikeCount(prev => (isLiked ? prev - 1 : prev + 1))
		setIsLikeLoading(true)

		try {
			const response = await toggleLikeRecipe(recipeId)
			if (response.success && response.data) {
				setIsLiked(response.data.isLiked)
				setLikeCount(response.data.likeCount)
			}
		} catch (error) {
			setIsLiked(previousLiked)
			setLikeCount(previousCount)
			toast.error('Failed to like recipe')
		} finally {
			setIsLikeLoading(false)
		}
	}

	const handleSave = async () => {
		if (isSaveLoading) return

		const previousSaved = isSaved
		const previousCount = saveCount
		setIsSaved(!isSaved)
		setSaveCount(prev => (isSaved ? prev - 1 : prev + 1))
		setIsSaveLoading(true)

		try {
			const response = await toggleSaveRecipe(recipeId)
			if (response.success && response.data) {
				setIsSaved(response.data.isSaved)
				setSaveCount(response.data.saveCount)
				toast.success(
					response.data.isSaved ? 'Recipe saved!' : 'Recipe unsaved',
				)
			}
		} catch (error) {
			setIsSaved(previousSaved)
			setSaveCount(previousCount)
			toast.error('Failed to save recipe')
		} finally {
			setIsSaveLoading(false)
		}
	}

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: recipe?.title,
					text: recipe?.description,
					url: window.location.href,
				})
			} catch (err) {
				// User cancelled or share failed
			}
		} else {
			// Fallback: copy to clipboard
			await navigator.clipboard.writeText(window.location.href)
			toast.success('Link copied to clipboard!')
		}
	}

	if (isLoading) {
		return <RecipeDetailSkeleton />
	}

	if (error || !recipe) {
		return (
			<PageContainer maxWidth='2xl'>
				<ErrorState
					title='Recipe not found'
					message={error || 'The recipe you are looking for does not exist.'}
					onRetry={() => router.push('/explore')}
					showHomeButton
				/>
			</PageContainer>
		)
	}

	const totalTime = recipe.prepTime + recipe.cookTime

	return (
		<PageContainer maxWidth='2xl'>
			{/* Hero Section */}
			<div className='mb-8 overflow-hidden rounded-2xl border bg-card shadow-lg'>
				<div className='relative h-[400px] w-full'>
					<Image
						src={recipe.imageUrl}
						alt={recipe.title}
						fill
						className='object-cover'
						priority
					/>
					{recipe.videoUrl && (
						<button
							onClick={toggleCookingPlayer}
							className='absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all hover:bg-black/40'
						>
							<div className='grid h-20 w-20 place-items-center rounded-full bg-white/90 shadow-xl transition-transform hover:scale-110'>
								<Play className='ml-1 h-8 w-8 fill-primary text-primary' />
							</div>
						</button>
					)}
					{/* Difficulty badge */}
					<div className='absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm'>
						{recipe.difficulty}
					</div>
				</div>

				<div className='p-6 md:p-8'>
					{/* Title & Author */}
					<div className='mb-6'>
						<h1 className='mb-3 text-3xl font-bold md:text-4xl'>
							{recipe.title}
						</h1>
						<p className='mb-4 text-muted-foreground'>{recipe.description}</p>
						{recipe.author && (
							<Link
								href={`/${recipe.author.username}`}
								className='flex items-center gap-3 hover:underline'
							>
								<div className='relative h-10 w-10 overflow-hidden rounded-full'>
									<Image
										src={recipe.author.avatarUrl}
										alt={recipe.author.username}
										fill
										className='object-cover'
									/>
								</div>
								<div>
									<p className='font-semibold'>{recipe.author.displayName}</p>
									<p className='text-sm text-muted-foreground'>
										@{recipe.author.username}
									</p>
								</div>
							</Link>
						)}
					</div>

					{/* Stats */}
					<div className='mb-6 flex flex-wrap items-center gap-6 border-y py-4 text-muted-foreground'>
						<span className='flex items-center gap-2'>
							<Clock className='h-5 w-5' />
							<span className='font-semibold'>{totalTime} min</span>
						</span>
						<span className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							<span className='font-semibold'>{recipe.servings} servings</span>
						</span>
						<span className='flex items-center gap-2'>
							<ChefHat className='h-5 w-5' />
							<span className='font-semibold'>{recipe.difficulty}</span>
						</span>
						<span className='flex items-center gap-2'>
							<Eye className='h-5 w-5' />
							<span className='font-semibold'>{recipe.viewCount} views</span>
						</span>
					</div>

					{/* Action Buttons */}
					<div className='flex flex-wrap gap-3'>
						<Button size='lg' className='flex-1' onClick={toggleCookingPlayer}>
							<Play className='mr-2 h-5 w-5' />
							Start Cooking
						</Button>
						<Button
							size='lg'
							variant={isLiked ? 'default' : 'outline'}
							onClick={handleLike}
							disabled={isLikeLoading}
						>
							<Heart
								className={`mr-2 h-5 w-5 ${isLiked ? 'fill-current' : ''}`}
							/>
							{likeCount}
						</Button>
						<Button
							size='lg'
							variant={isSaved ? 'default' : 'outline'}
							onClick={handleSave}
							disabled={isSaveLoading}
						>
							<Bookmark
								className={`mr-2 h-5 w-5 ${isSaved ? 'fill-current' : ''}`}
							/>
							{isSaved ? 'Saved' : 'Save'}
						</Button>
						<Button size='lg' variant='outline' onClick={handleShare}>
							<Share2 className='h-5 w-5' />
						</Button>
					</div>

					{/* Tags */}
					{(recipe.cuisine || recipe.dietaryTags.length > 0) && (
						<div className='mt-6 flex flex-wrap gap-2'>
							{recipe.cuisine && (
								<span className='rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'>
									{recipe.cuisine}
								</span>
							)}
							{recipe.dietaryTags.map(tag => (
								<span
									key={tag}
									className='rounded-full bg-secondary px-3 py-1 text-sm font-medium'
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Ingredients & Steps */}
			<div className='grid gap-8 lg:grid-cols-3'>
				{/* Ingredients */}
				<div className='lg:col-span-1'>
					<div className='sticky top-4 rounded-xl border bg-card p-6 shadow-sm'>
						<h2 className='mb-4 text-2xl font-bold'>Ingredients</h2>
						<p className='mb-4 text-sm text-muted-foreground'>
							For {recipe.servings} servings
						</p>
						<ul className='space-y-3'>
							{recipe.ingredients
								.sort((a, b) => a.order - b.order)
								.map(ingredient => (
									<li
										key={ingredient.id}
										className='flex items-start gap-3 rounded-lg p-2 hover:bg-muted'
									>
										<div className='mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary' />
										<span className='flex-1'>
											<span className='font-semibold'>
												{ingredient.quantity} {ingredient.unit}
											</span>{' '}
											{ingredient.name}
										</span>
									</li>
								))}
						</ul>
					</div>
				</div>

				{/* Steps */}
				<div className='lg:col-span-2'>
					<h2 className='mb-6 text-2xl font-bold'>Instructions</h2>
					<div className='space-y-6'>
						{recipe.steps
							.sort((a, b) => a.order - b.order)
							.map((step, index) => (
								<div
									key={step.id}
									className='rounded-xl border bg-card p-6 shadow-sm'
								>
									<div className='mb-3 flex items-center gap-3'>
										<div className='grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground'>
											{index + 1}
										</div>
										<div className='flex-1'>
											<h3 className='text-lg font-semibold'>{step.title}</h3>
											{step.duration && (
												<p className='text-sm text-muted-foreground'>
													<Clock className='mr-1 inline h-3 w-3' />
													{step.duration} min
												</p>
											)}
										</div>
									</div>
									{step.imageUrl && (
										<div className='relative mb-4 h-48 overflow-hidden rounded-lg'>
											<Image
												src={step.imageUrl}
												alt={step.title}
												fill
												className='object-cover'
											/>
										</div>
									)}
									<p className='leading-relaxed text-muted-foreground'>
										{step.instruction}
									</p>
								</div>
							))}
					</div>
				</div>
			</div>
		</PageContainer>
	)
}

// Loading skeleton component
function RecipeDetailSkeleton() {
	return (
		<PageContainer maxWidth='2xl'>
			<div className='mb-8 overflow-hidden rounded-2xl border bg-card shadow-lg'>
				<Skeleton className='h-[400px] w-full' />
				<div className='p-6 md:p-8'>
					<Skeleton className='mb-3 h-10 w-3/4' />
					<Skeleton className='mb-4 h-6 w-full' />
					<div className='mb-6 flex items-center gap-3'>
						<Skeleton className='h-10 w-10 rounded-full' />
						<div>
							<Skeleton className='mb-1 h-5 w-32' />
							<Skeleton className='h-4 w-24' />
						</div>
					</div>
					<div className='mb-6 flex gap-6 border-y py-4'>
						{[1, 2, 3, 4].map(i => (
							<Skeleton key={i} className='h-6 w-24' />
						))}
					</div>
					<div className='flex gap-3'>
						<Skeleton className='h-12 flex-1' />
						<Skeleton className='h-12 w-24' />
						<Skeleton className='h-12 w-24' />
						<Skeleton className='h-12 w-12' />
					</div>
				</div>
			</div>
			<div className='grid gap-8 lg:grid-cols-3'>
				<div className='lg:col-span-1'>
					<Skeleton className='h-96 w-full rounded-xl' />
				</div>
				<div className='lg:col-span-2'>
					<Skeleton className='mb-6 h-8 w-48' />
					{[1, 2, 3].map(i => (
						<Skeleton key={i} className='mb-6 h-48 w-full rounded-xl' />
					))}
				</div>
			</div>
		</PageContainer>
	)
}
