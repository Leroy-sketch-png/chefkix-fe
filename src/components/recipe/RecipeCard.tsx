'use client'

import { Recipe, getRecipeImage, getTotalTime } from '@/lib/types/recipe'
import { Button } from '@/components/ui/button'
import { Heart, Clock, Bookmark } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { toggleLikeRecipe, toggleSaveRecipe } from '@/services/recipe'
import { toast } from 'sonner'
import { RECIPE_MESSAGES } from '@/constants/messages'
import { triggerSaveConfetti } from '@/lib/confetti'
import { TRANSITION_SPRING, EXIT_VARIANTS, CARD_GRID_HOVER } from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'
import { useAuthGate } from '@/hooks/useAuthGate'

interface RecipeCardProps {
	recipe: Recipe
	onUpdate?: (recipe: Recipe) => void
}

const RecipeCardComponent = ({ recipe, onUpdate }: RecipeCardProps) => {
	const router = useRouter()
	const requireAuth = useAuthGate()
	const [isLiked, setIsLiked] = useState(recipe.isLiked ?? false)
	const [isSaved, setIsSaved] = useState(recipe.isSaved ?? false)
	const [likeCount, setLikeCount] = useState(recipe.likeCount)
	const [saveCount, setSaveCount] = useState(recipe.saveCount)
	const [isLikeLoading, setIsLikeLoading] = useState(false)
	const [isSaveLoading, setIsSaveLoading] = useState(false)
	const saveButtonRef = useRef<HTMLButtonElement>(null)

	const totalTime = getTotalTime(recipe)

	const handleLikeClick = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!requireAuth('like this recipe')) return
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
			toast.error(RECIPE_MESSAGES.LIKE_FAILED)
			logDevError('RecipeCard like toggle failed:', error)
		} finally {
			setIsLikeLoading(false)
		}
	}

	const handleSaveClick = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!requireAuth('save this recipe')) return
		if (isSaveLoading) return

		// Optimistic update
		const previousSaved = isSaved
		const previousCount = saveCount
		const willBeSaved = !isSaved
		setIsSaved(willBeSaved)
		setSaveCount(prev => (isSaved ? prev - 1 : prev + 1))
		setIsSaveLoading(true)

		// Trigger confetti optimistically on save (not unsave)
		if (willBeSaved) {
			triggerSaveConfetti(saveButtonRef.current || undefined)
		}

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
			toast.error(RECIPE_MESSAGES.SAVE_FAILED)
			logDevError('RecipeCard save toggle failed:', error)
		} finally {
			setIsSaveLoading(false)
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={EXIT_VARIANTS.scaleOut}
			transition={TRANSITION_SPRING}
			layout
		>
			<motion.div
				whileHover={{ ...CARD_GRID_HOVER, scale: 1.02 }}
				transition={TRANSITION_SPRING}
			>
				<Link
					href={`/recipes/${recipe.id}`}
					className='group block overflow-hidden rounded-radius border border-border-subtle bg-bg-card transition-all duration-300 hover:border-brand/50 hover:bg-bg-elevated'
				>
					{/* Gradient overlay on hover */}
					<div className='pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

					<div className='relative aspect-[4/3] w-full overflow-hidden'>
						<Image
							src={getRecipeImage(recipe)}
							alt={recipe.title}
							fill
							className='object-cover brightness-95 transition-all duration-500 group-hover:scale-105 group-hover:brightness-105 group-hover:saturate-110'
						/>
						{/* Difficulty badge */}
						<div
							className={`absolute left-2 top-2 rounded-xl px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white ${
								recipe.difficulty === 'Beginner'
									? 'bg-gradient-to-br from-success to-success/80'
									: recipe.difficulty === 'Intermediate'
										? 'bg-gradient-to-br from-accent to-accent-variant'
										: recipe.difficulty === 'Advanced'
											? 'bg-gradient-to-br from-warning to-gold'
											: 'bg-gradient-to-br from-destructive to-gold'
							}`}
						>
							{recipe.difficulty}
						</div>
						{/* Save button */}
						<button
							ref={saveButtonRef}
							onClick={handleSaveClick}
							disabled={isSaveLoading}
							aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'}
							className={`absolute right-2 top-2 grid size-11 place-items-center rounded-sm border-none transition-all duration-300 ${
								isSaved
									? 'bg-gold/10 text-gold'
									: 'bg-bg-card text-text-secondary hover:bg-primary/10 hover:text-primary'
							}`}
						>
							<Bookmark className={`size-5 ${isSaved ? 'fill-gold' : ''}`} />
						</button>
					</div>
					<div className='space-y-3 p-4 md:p-6'>
						<h3 className='text-lg font-bold leading-tight text-text-primary line-clamp-2'>
							{recipe.title}
						</h3>
						<p className='text-sm leading-normal text-text-secondary line-clamp-2'>
							{recipe.description}
						</p>
						<div className='flex items-center justify-between text-sm text-text-secondary'>
							<span>By {recipe.author?.displayName || 'Unknown'}</span>
							<span>⭐ {likeCount} likes</span>
						</div>
						<div className='flex gap-4'>
							<button
								onClick={e => {
									e.preventDefault()
									e.stopPropagation()
									router.push(`/recipes/${recipe.id}?cook=true`)
								}}
								className='relative h-11 flex-1 overflow-hidden rounded-radius border-none bg-gradient-to-br from-accent to-accent-variant font-bold text-white transition-all duration-300 hover:opacity-90 before:absolute before:left-[-100%] before:top-0 before:h-full before:w-full before:bg-gradient-to-r before:from-transparent before:via-card/30 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]'
							>
								Cook Recipe
							</button>
						</div>
					</div>
				</Link>
			</motion.div>
		</motion.div>
	)
}

export const RecipeCard = memo(RecipeCardComponent)
