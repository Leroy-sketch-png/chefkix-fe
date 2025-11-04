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
			className='group block overflow-hidden rounded-radius bg-panel-bg shadow-md transition-all duration-300 hover:-translate-y-2 hover:rotate-x-[2deg] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15),0_0_0_1px_rgba(102,126,234,0.1)] [transform-style:preserve-3d]'
		>
			{/* Gradient overlay on hover */}
			<div className='pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

			<div className='relative h-[150px] w-full overflow-hidden'>
				<Image
					src={recipe.imageUrl}
					alt={recipe.title}
					fill
					className='object-cover brightness-95 transition-all duration-500 group-hover:scale-105 group-hover:brightness-105 group-hover:saturate-110'
				/>
				{/* Difficulty badge */}
				<div
					className={`absolute left-2 top-2 rounded-xl px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.3px] text-primary-foreground ${
						recipe.difficulty === 'EASY'
							? 'bg-gradient-to-br from-[#a8e063] to-[#56ab2f]'
							: recipe.difficulty === 'MEDIUM'
								? 'bg-gradient-to-br from-[#f093fb] to-[#f5576c]'
								: 'bg-gradient-to-br from-[#fa709a] to-[#fee140]'
					}`}
				>
					{recipe.difficulty}
				</div>
				{/* Save button */}
				<button
					onClick={handleSaveClick}
					disabled={isSaveLoading}
					className={`absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-[10px] border-none transition-all duration-300 ${
						isSaved
							? 'bg-[#f39c12]/10 text-[#f39c12]'
							: 'bg-bg text-muted hover:-translate-y-0.5 hover:bg-primary/10 hover:text-primary'
					}`}
				>
					<Bookmark className={`h-5 w-5 ${isSaved ? 'fill-[#f39c12]' : ''}`} />
				</button>
			</div>
			<div className='p-4'>
				<h3 className='mb-2 text-[18px] font-bold'>{recipe.title}</h3>
				<p className='mb-3 line-clamp-2 text-sm text-muted'>
					{recipe.description}
				</p>
				<div className='mb-4 flex items-center justify-between text-[13px] text-muted'>
					<span>By {recipe.author?.displayName || 'Unknown'}</span>
					<span>⭐ {likeCount} likes</span>
				</div>
				<div className='flex gap-2'>
					<button className='relative flex-1 overflow-hidden rounded-[10px] border-none bg-gradient-to-br from-[#f093fb] to-[#f5576c] py-3 font-bold text-primary-foreground shadow-[0_4px_15px_0_rgba(245,87,108,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(245,87,108,0.6)] before:absolute before:left-[-100%] before:top-0 before:h-full before:w-full before:bg-gradient-to-r before:from-transparent before:via-card/30 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]'>
						Cook Recipe
					</button>
				</div>
			</div>
		</Link>
	)
}
