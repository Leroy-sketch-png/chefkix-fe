'use client'

import { Recipe, getRecipeImage, getTotalTime } from '@/lib/types/recipe'
import { Bookmark, ChefHat, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { toggleLikeRecipe, toggleSaveRecipe } from '@/services/recipe'
import { toast } from 'sonner'
import { triggerSaveConfetti } from '@/lib/confetti'
import { TRANSITION_SPRING, EXIT_VARIANTS } from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'
import { useAuthGate } from '@/hooks/useAuthGate'
import { useTranslations } from 'next-intl'
import { QualityBadge } from './QualityBadge'
import { TiltCard } from '@/components/ui/tilt-card'
import { ShinyButton } from '@/components/ui/shiny-button'

interface RecipeCardProps {
	recipe: Recipe
	onUpdate?: (recipe: Recipe) => void
}

const RecipeCardComponent = ({ recipe, onUpdate }: RecipeCardProps) => {
	const router = useRouter()
	const { requireAuth } = useAuthGate()
	const [isLiked, setIsLiked] = useState(recipe.isLiked ?? false)
	const [isSaved, setIsSaved] = useState(recipe.isSaved ?? false)
	const [likeCount, setLikeCount] = useState(recipe.likeCount)
	const [saveCount, setSaveCount] = useState(recipe.saveCount)
	const [isLikeLoading, setIsLikeLoading] = useState(false)
	const [isSaveLoading, setIsSaveLoading] = useState(false)
	const saveButtonRef = useRef<HTMLButtonElement>(null)
	const t = useTranslations('recipe')

	const totalTime = getTotalTime(recipe)

	const handleLikeClick = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!requireAuth(t('authActionLike'), 'like')) return
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
			toast.error(t('toastFailedLike'))
			logDevError('RecipeCard like toggle failed:', error)
		} finally {
			setIsLikeLoading(false)
		}
	}

	const handleSaveClick = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!requireAuth(t('authActionSave'), 'save')) return
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
					response.data.isSaved ? t('recipeSaved') : t('recipeUnsaved'),
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
			toast.error(t('toastFailedSave'))
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
			<TiltCard maxTilt={5} scale={1.02} glare glareOpacity={0.08}>
				<Link
					href={`/recipes/${recipe.id}`}
					className='group relative block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-all duration-300 hover:border-brand/40 hover:bg-bg-elevated hover:shadow-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
				>
					{/* Gradient overlay on hover */}
					<div className='pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-brand/10 to-accent-purple/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

					<div className='relative aspect-[4/3] w-full overflow-hidden'>
						<Image
							src={getRecipeImage(recipe)}
							alt={recipe.title}
							fill
							sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
							className='object-cover brightness-95 transition-all duration-500 group-hover:scale-105 group-hover:brightness-105 group-hover:saturate-110'
							onError={e => {
								;(e.target as HTMLImageElement).style.display = 'none'
							}}
						/>
						{/* Difficulty badge */}
						<div
							className={`absolute left-2 top-2 rounded-xl px-2.5 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur-sm ${
								recipe.difficulty === 'Beginner'
									? 'border border-success/40 bg-success/20 text-success-deep shadow-[0_0_12px_rgba(16,185,129,0.3)]'
									: recipe.difficulty === 'Intermediate'
										? 'border border-accent-purple/40 bg-accent-purple/20 text-accent-purple shadow-[0_0_12px_rgba(139,92,246,0.3)]'
										: recipe.difficulty === 'Advanced'
											? 'border border-warning/40 bg-warning/20 text-warning-deep shadow-[0_0_12px_rgba(245,158,11,0.3)]'
											: 'border border-error/40 bg-error/20 text-error shadow-[0_0_12px_rgba(239,68,68,0.3)]'
							}`}
						>
							{recipe.difficulty}
						</div>
						{/* Save button */}
						<button
							type='button'
							ref={saveButtonRef}
							onClick={handleSaveClick}
							disabled={isSaveLoading}
							aria-label={isSaved ? t('unsaveRecipe') : t('saveRecipe')}
							className={`absolute right-2 top-2 z-20 grid size-11 place-items-center rounded-xl border border-white/35 backdrop-blur-sm transition-all duration-300 ${
								isSaved
									? 'bg-gold/15 text-gold shadow-[0_4px_14px_rgba(245,158,11,0.18)]'
									: 'bg-bg-card/92 text-text-secondary shadow-[0_4px_14px_rgba(44,36,32,0.12)] hover:border-brand/35 hover:bg-brand/10 hover:text-brand'
							}`}
						>
							<Bookmark className={`size-5 ${isSaved ? 'fill-gold' : ''}`} />
						</button>
						{/* Quality badge - only show Foolproof tier */}
						{recipe.qualityTier === 'Foolproof' && (
							<div className='absolute bottom-2 right-2'>
								<QualityBadge
									tier='Foolproof'
									size='sm'
									showLabel
									showScore={false}
									animate={false}
								/>
							</div>
						)}
					</div>
					<div className='space-y-3 p-4 md:p-6'>
						<h3
							className='text-lg font-serif font-bold leading-tight text-text-primary line-clamp-2'
							title={recipe.title}
						>
							{recipe.title}
						</h3>
						<p className='text-sm leading-normal text-text-secondary line-clamp-2'>
							{recipe.description}
						</p>
						<div className='flex items-center justify-between text-sm text-text-secondary'>
							<span className='truncate'>
								{t('byAuthor', {
									name: recipe.author?.displayName || 'Unknown',
								})}
							</span>
							<span className='inline-flex items-center gap-1.5 tabular-nums text-text-primary'>
								<Heart className='size-4 text-brand' />
								{t('likesCount', { count: likeCount })}
							</span>
						</div>
						<div className='flex gap-4'>
							<button
								type='button'
								onClick={e => {
									e.preventDefault()
									e.stopPropagation()
									router.push(`/recipes/${recipe.id}?cook=true`)
								}}
								className='relative h-11 flex-1 overflow-hidden rounded-xl border-none bg-brand font-bold text-white shadow-[0_2px_8px_rgba(255,90,54,0.35)] transition-all duration-300 hover:bg-brand/90 hover:shadow-[0_4px_16px_rgba(255,90,54,0.4)] before:absolute before:left-[-100%] before:top-0 before:h-full before:w-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-[100%]'
							>
								{t('cookRecipe')}
							</button>
						</div>
					</div>
				</Link>
			</TiltCard>
		</motion.div>
	)
}

export const RecipeCard = memo(RecipeCardComponent)
