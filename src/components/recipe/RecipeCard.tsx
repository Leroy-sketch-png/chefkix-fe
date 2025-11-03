'use client'

import { Recipe } from '@/lib/types/recipe'
import { Button } from '@/components/ui/button'
import { Heart, Clock, Bookmark } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toggleLikeRecipe, toggleSaveRecipe } from '@/services/recipe'
import { toast } from 'sonner'

interface RecipeCardProps {
	recipe: Recipe
	onUpdate?: (recipe: Recipe) => void
}

export const RecipeCard = ({ recipe, onUpdate }: RecipeCardProps) => {
	const [isLiked, setIsLiked] = useState(recipe.isLiked ?? false)
	const [isSaved, setIsSaved] = useState(recipe.isSaved ?? false)
	const [likeCount, setLikeCount] = useState(recipe.likeCount)
	const [saveCount, setSaveCount] = useState(recipe.saveCount)
	const [isLikeLoading, setIsLikeLoading] = useState(false)
	const [isSaveLoading, setIsSaveLoading] = useState(false)

	const totalTime = recipe.prepTime + recipe.cookTime

	const handleLikeClick = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (isLikeLoading) return

		// Optimistic update
		const previousLiked = isLiked
		const previousCount = likeCount
		setIsLiked(!isLiked)
		setLikeCount(prev => (isLiked ? prev - 1 : prev + 1))
		setIsLikeLoading(true)

		try {
			const response = await toggleLikeRecipe(recipe.id)
			if (response.success && response.data) {
				setIsLiked(response.data.isLiked)
				setLikeCount(response.data.likeCount)
				if (onUpdate) {
					onUpdate({
						...recipe,
						isLiked: response.data.isLiked,
						likeCount: response.data.likeCount,
					})
				}
			}
		} catch (error) {
			// Revert on error
			setIsLiked(previousLiked)
			setLikeCount(previousCount)
			toast.error('Failed to like recipe')
		} finally {
			setIsLikeLoading(false)
		}
	}

	const handleSaveClick = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (isSaveLoading) return

		// Optimistic update
		const previousSaved = isSaved
		const previousCount = saveCount
		setIsSaved(!isSaved)
		setSaveCount(prev => (isSaved ? prev - 1 : prev + 1))
		setIsSaveLoading(true)

		try {
			const response = await toggleSaveRecipe(recipe.id)
			if (response.success && response.data) {
				setIsSaved(response.data.isSaved)
				setSaveCount(response.data.saveCount)
				toast.success(
					response.data.isSaved ? 'Recipe saved!' : 'Recipe unsaved',
				)
				if (onUpdate) {
					onUpdate({
						...recipe,
						isSaved: response.data.isSaved,
						saveCount: response.data.saveCount,
					})
				}
			}
		} catch (error) {
			// Revert on error
			setIsSaved(previousSaved)
			setSaveCount(previousCount)
			toast.error('Failed to save recipe')
		} finally {
			setIsSaveLoading(false)
		}
	}

	return (
		<Link
			href={`/recipes/${recipe.id}`}
			className='group block overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md'
		>
			<div className='relative h-48 w-full overflow-hidden'>
				<Image
					src={recipe.imageUrl}
					alt={recipe.title}
					fill
					className='object-cover transition-transform group-hover:scale-105'
				/>
				{/* Difficulty badge */}
				<div className='absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm'>
					{recipe.difficulty}
				</div>
				{/* Save button */}
				<button
					onClick={handleSaveClick}
					disabled={isSaveLoading}
					className='absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-50'
					aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'}
				>
					<Bookmark
						className={`h-4 w-4 transition-colors ${
							isSaved ? 'fill-white text-white' : 'text-white'
						}`}
					/>
				</button>
			</div>
			<div className='p-4'>
				<h3 className='mb-2 line-clamp-2 text-lg font-semibold'>
					{recipe.title}
				</h3>
				<p className='mb-4 line-clamp-2 text-sm text-muted-foreground'>
					{recipe.description}
				</p>
				<div className='mb-4 flex items-center gap-4 text-sm text-muted-foreground'>
					<span className='flex items-center gap-1'>
						<Clock className='h-4 w-4' /> {totalTime} min
					</span>
					<button
						onClick={handleLikeClick}
						disabled={isLikeLoading}
						className='flex items-center gap-1 transition-colors hover:text-red-500 disabled:opacity-50'
						aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
					>
						<Heart
							className={`h-4 w-4 ${
								isLiked ? 'fill-red-500 text-red-500' : ''
							}`}
						/>
						{likeCount}
					</button>
				</div>
				<Button className='w-full'>Cook Now</Button>
			</div>
		</Link>
	)
}
