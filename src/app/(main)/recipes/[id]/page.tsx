'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Recipe, getRecipeImage, getTotalTime } from '@/lib/types/recipe'
import {
	getRecipeById,
	toggleLikeRecipe,
	toggleSaveRecipe,
} from '@/services/recipe'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
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
	Zap,
	Check,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useUiStore } from '@/store/uiStore'
import { useCookingStore } from '@/store/cookingStore'
import { RECIPE_MESSAGES } from '@/constants/messages'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_HOVER,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'

export default function RecipeDetailPage() {
	const params = useParams()
	const router = useRouter()
	const searchParams = useSearchParams()
	const recipeId = params?.id as string
	const shouldAutoStartCooking = searchParams?.get('cook') === 'true'
	const { openCookingPanel, expandCookingPanel } = useUiStore()
	const { startCooking, isLoading: isCookingLoading } = useCookingStore()
	const autoStartAttempted = useRef(false)

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

	// Auto-start cooking if navigated with ?cook=true
	useEffect(() => {
		if (
			shouldAutoStartCooking &&
			recipe &&
			!autoStartAttempted.current &&
			!isCookingLoading
		) {
			autoStartAttempted.current = true
			// Remove the query param to prevent re-triggering
			router.replace(`/recipes/${recipeId}`, { scroll: false })

			// Start cooking session
			const initCooking = async () => {
				const success = await startCooking(recipeId)
				if (success) {
					// Open docked panel on desktop, expanded on mobile
					const isDesktop = window.innerWidth >= 1280
					isDesktop ? openCookingPanel() : expandCookingPanel()
				} else {
					toast.error('Failed to start cooking session')
				}
			}
			initCooking()
		}
	}, [
		shouldAutoStartCooking,
		recipe,
		recipeId,
		isCookingLoading,
		startCooking,
		openCookingPanel,
		expandCookingPanel,
		router,
	])

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
			toast.error(RECIPE_MESSAGES.LIKE_FAILED)
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
			toast.error(RECIPE_MESSAGES.SAVE_FAILED)
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
			toast.success(RECIPE_MESSAGES.LINK_COPIED)
		}
	}

	const handleStartCooking = async () => {
		if (isCookingLoading || !recipeId) return

		const success = await startCooking(recipeId)
		if (success) {
			// Open docked panel on desktop, expanded on mobile
			const isDesktop = window.innerWidth >= 1280
			isDesktop ? openCookingPanel() : expandCookingPanel()
		} else {
			toast.error('Failed to start cooking session')
		}
	}

	if (isLoading) {
		return <RecipeDetailSkeleton />
	}

	if (error || !recipe) {
		return (
			<PageTransition>
				<PageContainer maxWidth='2xl'>
					<ErrorState
						title='Recipe not found'
						message={error || 'The recipe you are looking for does not exist.'}
						onRetry={() => router.push('/explore')}
						showHomeButton
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	const totalTime = getTotalTime(recipe)

	// Difficulty config for styling
	const difficultyConfig: Record<
		string,
		{ color: string; bg: string; glow: string }
	> = {
		Beginner: {
			color: 'text-success',
			bg: 'bg-success',
			glow: 'shadow-success/40',
		},
		Intermediate: {
			color: 'text-amber-500',
			bg: 'bg-amber-500',
			glow: 'shadow-amber-500/40',
		},
		Advanced: { color: 'text-error', bg: 'bg-error', glow: 'shadow-error/40' },
		Expert: { color: 'text-xp', bg: 'bg-xp', glow: 'shadow-xp/40' },
	}
	const diffConfig =
		difficultyConfig[recipe.difficulty] || difficultyConfig.Beginner

	return (
		<PageTransition>
			<PageContainer maxWidth='2xl'>
				{/* Hero Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-8 overflow-hidden rounded-3xl border border-border-subtle bg-bg-card shadow-lg'
				>
					{/* Hero Image with overlay */}
					<div className='group relative h-72 w-full overflow-hidden md:h-96'>
						<motion.div
							initial={{ scale: 1.1 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.8, ease: 'easeOut' }}
							className='absolute inset-0'
						>
							<Image
								src={getRecipeImage(recipe)}
								alt={recipe.title}
								fill
								className='object-cover transition-transform duration-700 group-hover:scale-105'
								priority
							/>
						</motion.div>

						{/* Gradient overlay */}
						<div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

						{/* XP Badge - top left */}
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.3, ...TRANSITION_SPRING }}
							className='absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-gradient-xp px-4 py-2 text-sm font-bold text-white shadow-lg shadow-xp/40'
						>
							<Zap className='size-4' />+{recipe.xpReward || 100} XP
						</motion.div>

						{/* Difficulty Badge - top right */}
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.4, ...TRANSITION_SPRING }}
							className={cn(
								'absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-sm',
								diffConfig.bg,
								diffConfig.glow,
							)}
						>
							{recipe.difficulty}
						</motion.div>

						{/* Video play button overlay */}
						{recipe.videoUrl && (
							<motion.button
								onClick={() => expandCookingPanel()}
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.95 }}
								className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
							>
								<div className='grid size-20 place-items-center rounded-full bg-white/90 shadow-2xl transition-all hover:bg-white'>
									<Play className='ml-1 size-8 fill-brand text-brand' />
								</div>
							</motion.button>
						)}
					</div>

					<div className='p-6 md:p-8'>
						{/* Title & Author */}
						<div className='mb-6'>
							<motion.h1
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className='mb-3 text-3xl font-bold text-text md:text-4xl'
							>
								{recipe.title}
							</motion.h1>
							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.3 }}
								className='mb-4 leading-relaxed text-text-secondary'
							>
								{recipe.description}
							</motion.p>
							{recipe.author && (
								<motion.div
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.4 }}
								>
									<Link
										href={`/${recipe.author.userId}`}
										className='group/author inline-flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-bg-elevated'
									>
										<div className='relative size-12 overflow-hidden rounded-full ring-2 ring-border ring-offset-2 ring-offset-bg-card transition-all group-hover/author:ring-brand'>
											<Image
												src={
													recipe.author.avatarUrl || '/placeholder-avatar.png'
												}
												alt={recipe.author.username}
												fill
												className='object-cover'
											/>
										</div>
										<div>
											<p className='font-semibold text-text group-hover/author:text-brand'>
												{recipe.author.displayName}
											</p>
											<p className='text-sm text-text-muted'>
												@{recipe.author.username}
											</p>
										</div>
									</Link>
								</motion.div>
							)}
						</div>

						{/* Stats */}
						<motion.div
							variants={staggerContainer}
							initial='hidden'
							animate='visible'
							className='mb-6 flex flex-wrap items-center gap-6 border-y border-border-subtle py-5'
						>
							{[
								{ icon: Clock, label: `${totalTime} min`, key: 'time' },
								{
									icon: Users,
									label: `${recipe.servings} servings`,
									key: 'servings',
								},
								{ icon: ChefHat, label: recipe.difficulty, key: 'difficulty' },
								{
									icon: Eye,
									label: `${recipe.viewCount || 0} views`,
									key: 'views',
								},
							].map(stat => (
								<motion.span
									key={stat.key}
									variants={staggerItem}
									className='flex items-center gap-2 text-text-secondary'
								>
									<stat.icon className='size-5 text-brand' />
									<span className='font-medium'>{stat.label}</span>
								</motion.span>
							))}
						</motion.div>

						{/* Action Buttons */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5 }}
							className='flex flex-wrap gap-3'
						>
							<motion.button
								onClick={handleStartCooking}
								disabled={isCookingLoading}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-hero py-4 text-lg font-bold text-white shadow-lg shadow-brand/30 transition-shadow hover:shadow-xl hover:shadow-brand/40 disabled:opacity-50'
							>
								<Play className='size-6 fill-white' />
								{isCookingLoading ? 'Starting...' : 'Start Cooking'}
							</motion.button>
							<motion.button
								onClick={handleLike}
								disabled={isLikeLoading}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className={cn(
									'flex items-center gap-2 rounded-xl border-2 px-6 py-4 font-semibold transition-all',
									isLiked
										? 'border-error bg-error/10 text-error'
										: 'border-border-medium hover:border-error hover:bg-error/5',
								)}
							>
								<Heart className={cn('size-5', isLiked && 'fill-current')} />
								{likeCount}
							</motion.button>
							<motion.button
								onClick={handleSave}
								disabled={isSaveLoading}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className={cn(
									'flex items-center gap-2 rounded-xl border-2 px-6 py-4 font-semibold transition-all',
									isSaved
										? 'border-brand bg-brand/10 text-brand'
										: 'border-border-medium hover:border-brand hover:bg-brand/5',
								)}
							>
								<Bookmark className={cn('size-5', isSaved && 'fill-current')} />
								{isSaved ? 'Saved' : 'Save'}
							</motion.button>
							<motion.button
								onClick={handleShare}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='grid size-14 place-items-center rounded-xl border-2 border-border-medium transition-colors hover:border-text-secondary hover:bg-bg-elevated'
							>
								<Share2 className='size-5' />
							</motion.button>
						</motion.div>

						{/* Tags */}
						{(recipe.cuisineType || recipe.dietaryTags.length > 0) && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.6 }}
								className='mt-6 flex flex-wrap gap-2'
							>
								{recipe.cuisineType && (
									<span className='rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand'>
										{recipe.cuisineType}
									</span>
								)}
								{recipe.dietaryTags.map(tag => (
									<span
										key={tag}
										className='rounded-full bg-bg-elevated px-4 py-1.5 text-sm font-medium text-text-secondary'
									>
										{tag}
									</span>
								))}
							</motion.div>
						)}
					</div>
				</motion.div>

				{/* Ingredients & Steps */}
				<div className='grid gap-8 lg:grid-cols-3'>
					{/* Ingredients */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.4 }}
						className='lg:col-span-1'
					>
						<div className='sticky top-4 rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card'>
							<h2 className='mb-4 flex items-center gap-2 text-2xl font-bold text-text'>
								<span className='text-2xl'>🧾</span> Ingredients
							</h2>
							<p className='mb-4 text-sm text-text-muted'>
								For {recipe.servings} servings
							</p>
							<ul className='space-y-2'>
								{recipe.fullIngredientList.map((ingredient, index) => (
									<motion.li
										key={`ingredient-${index}`}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.5 + index * 0.03 }}
										whileHover={{ x: 4 }}
										className='flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-bg-elevated'
									>
										<div className='mt-1.5 size-2 flex-shrink-0 rounded-full bg-brand' />
										<span className='flex-1 text-text-secondary'>
											<span className='font-semibold text-text'>
												{ingredient.quantity} {ingredient.unit}
											</span>{' '}
											{ingredient.name}
										</span>
									</motion.li>
								))}
							</ul>
						</div>
					</motion.div>

					{/* Steps */}
					<motion.div
						variants={staggerContainer}
						initial='hidden'
						animate='visible'
						className='lg:col-span-2'
					>
						<h2 className='mb-6 flex items-center gap-2 text-2xl font-bold text-text'>
							<span className='text-2xl'>👨‍🍳</span> Instructions
						</h2>
						<div className='space-y-4'>
							{recipe.steps
								.sort((a, b) => a.stepNumber - b.stepNumber)
								.map((step, index) => (
									<motion.div
										key={`step-${step.stepNumber}`}
										variants={staggerItem}
										whileHover={{ y: -2 }}
										className='group rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card transition-shadow hover:shadow-warm'
									>
										<div className='mb-4 flex items-center gap-4'>
											<motion.div
												whileHover={{ scale: 1.1, rotate: 5 }}
												className='grid size-12 flex-shrink-0 place-items-center rounded-xl bg-gradient-hero text-lg font-bold text-white shadow-md'
											>
												{index + 1}
											</motion.div>
											<div className='flex-1'>
												<h3 className='text-lg font-bold text-text'>
													{step.title}
												</h3>
												{step.timerSeconds && (
													<p className='flex items-center gap-1 text-sm text-streak'>
														<Clock className='size-3.5' />
														{Math.ceil(step.timerSeconds / 60)} min timer
													</p>
												)}
											</div>
										</div>
										{step.imageUrl && (
											<div className='relative mb-4 aspect-video overflow-hidden rounded-xl'>
												<Image
													src={step.imageUrl}
													alt={step.title}
													fill
													className='object-cover transition-transform duration-500 group-hover:scale-105'
												/>
											</div>
										)}
										<p className='leading-relaxed text-text-secondary'>
											{step.description}
										</p>
									</motion.div>
								))}
						</div>
					</motion.div>
				</div>
			</PageContainer>
		</PageTransition>
	)
}

// Loading skeleton component
function RecipeDetailSkeleton() {
	return (
		<PageContainer maxWidth='2xl'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className='mb-8 overflow-hidden rounded-3xl border border-border-subtle bg-bg-card shadow-lg'
			>
				<Skeleton className='h-72 w-full md:h-96' />
				<div className='p-6 md:p-8'>
					<Skeleton className='mb-3 h-10 w-3/4 rounded-lg' />
					<Skeleton className='mb-4 h-6 w-full rounded-lg' />
					<div className='mb-6 flex items-center gap-3'>
						<Skeleton className='size-12 rounded-full' />
						<div>
							<Skeleton className='mb-2 h-5 w-32 rounded-lg' />
							<Skeleton className='h-4 w-24 rounded-lg' />
						</div>
					</div>
					<div className='mb-6 flex gap-6 border-y border-border-subtle py-5'>
						{[1, 2, 3, 4].map(i => (
							<Skeleton key={i} className='h-6 w-24 rounded-lg' />
						))}
					</div>
					<div className='flex gap-3'>
						<Skeleton className='h-14 flex-1 rounded-xl' />
						<Skeleton className='h-14 w-24 rounded-xl' />
						<Skeleton className='h-14 w-24 rounded-xl' />
						<Skeleton className='size-14 rounded-xl' />
					</div>
				</div>
			</motion.div>
			<div className='grid gap-8 lg:grid-cols-3'>
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.1 }}
					className='lg:col-span-1'
				>
					<Skeleton className='h-96 w-full rounded-2xl' />
				</motion.div>
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.2 }}
					className='lg:col-span-2'
				>
					<Skeleton className='mb-6 h-8 w-48 rounded-lg' />
					{[1, 2, 3].map(i => (
						<motion.div
							key={i}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 + i * 0.1 }}
						>
							<Skeleton className='mb-4 h-48 w-full rounded-2xl' />
						</motion.div>
					))}
				</motion.div>
			</div>
		</PageContainer>
	)
}
