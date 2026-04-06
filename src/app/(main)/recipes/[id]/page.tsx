'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'
import { Recipe, getRecipeImage, getTotalTime } from '@/lib/types/recipe'
import {
	getRecipeById,
	toggleLikeRecipe,
	toggleSaveRecipe,
	deleteRecipe,
} from '@/services/recipe'
import { trackEvent } from '@/lib/eventTracker'
import { getIngredientBuyLinks, createFromRecipe } from '@/services/shoppingList'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
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
	Edit3,
	Rocket,
	Info,
	Timer,
	ArrowLeft,
	UtensilsCrossed,
	Loader2,
	AlertCircle,
	Sparkles,
	Flame,
	Trash2,
	ShoppingCart,
	MoreHorizontal,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useUiStore } from '@/store/uiStore'
import { useCookingStore } from '@/store/cookingStore'
import { useAuth } from '@/hooks/useAuth'
import { useAuthGate } from '@/hooks/useAuthGate'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SocialProof } from '@/components/recipe/SocialProof'
import { SimilarRecipes } from '@/components/recipe/SimilarRecipes'
import { RecipeReviews } from '@/components/recipe/RecipeReviews'
import { SubstitutionButton } from '@/components/recipe/SubstitutionButton'
import { QualityBadge, getTierDescription } from '@/components/recipe/QualityBadge'
import { Portal } from '@/components/ui/portal'
import {
	remixRecipe,
	type RemixType,
	type RemixRecipeResponse,
} from '@/services/ai'
import { cn } from '@/lib/utils'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_HOVER,
	BOOKMARK_SLIDE,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	ICON_HOVER,
	NAV_ITEM_HOVER,
	STAT_ITEM_HOVER,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import { triggerSaveConfetti } from '@/lib/confetti'
import { AnimatedNumber } from '@/components/ui/animated-number'
import {
	calibrateDifficulty,
	type CalibrationResult,
} from '@/services/ml'
import { TipJarButton } from '@/components/tip/TipJarButton'
import { useTranslations } from 'next-intl'

function RecipeDetailContent() {
	const params = useParams()
	const router = useRouter()
	const searchParams = useSearchParams()
	const recipeId = params?.id as string
	const t = useTranslations('recipeDetail')

	// Difficulty explanations for tooltip (must be inside component for i18n hook access)
	const DIFFICULTY_EXPLANATIONS: Record<
		string,
		{ label: string; description: string; techniques: string }
	> = {
		Beginner: {
			label: t('diffBeginner'),
			description: t('diffBeginnerDesc'),
			techniques: t('diffBeginnerTech'),
		},
		Intermediate: {
			label: t('diffIntermediate'),
			description: t('diffIntermediateDesc'),
			techniques: t('diffIntermediateTech'),
		},
		Advanced: {
			label: t('diffAdvanced'),
			description: t('diffAdvancedDesc'),
			techniques: t('diffAdvancedTech'),
		},
		Expert: {
			label: t('diffExpert'),
			description: t('diffExpertDesc'),
			techniques: t('diffExpertTech'),
		},
	}
	const shouldAutoStartCooking = searchParams?.get('cook') === 'true'
	const { openCookingPanel, expandCookingPanel } = useUiStore()
	const {
		startCooking,
		isLoading: isCookingLoading,
		session: activeSession,
	} = useCookingStore()
	const { user } = useAuth()
	const requireAuth = useAuthGate()
	const autoStartAttempted = useRef(false)

	// Determine cooking button state — only count COMPLETE & ACTIVE sessions
	// A partial session (from localStorage) has sessionId/recipeId but no status
	// We need the full session data to properly show Continue Cooking
	const isCompleteSession = activeSession && activeSession.status !== undefined
	const isSessionActive =
		isCompleteSession &&
		activeSession.status !== 'completed' &&
		activeSession.status !== 'abandoned'
	const isCurrentlyCooked =
		isSessionActive && activeSession?.recipeId === recipeId
	const hasOtherSession =
		isSessionActive && activeSession?.recipeId !== recipeId

	const [recipe, setRecipe] = useState<Recipe | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isLiked, setIsLiked] = useState(false)
	const [isSaved, setIsSaved] = useState(false)
	const [likeCount, setLikeCount] = useState(0)
	const [saveCount, setSaveCount] = useState(0)
	const [isLikeLoading, setIsLikeLoading] = useState(false)
	const [isSaveLoading, setIsSaveLoading] = useState(false)
	const [showRemixMenu, setShowRemixMenu] = useState(false)
	const [isRemixing, setIsRemixing] = useState(false)
	const [remixResult, setRemixResult] = useState<RemixRecipeResponse | null>(
		null,
	)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [calibration, setCalibration] = useState<CalibrationResult | null>(null)
	const [ingredientBuyLinks, setIngredientBuyLinks] = useState<Record<string, string>>({})
	const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false)

	// Check if current user is the recipe owner
	const isOwner = user?.userId === recipe?.author?.userId

	const fetchRecipe = useCallback(async () => {
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
				trackEvent('RECIPE_VIEWED', recipeId, 'recipe')
			} else {
				setError(t('errorRecipeNotFound'))
			}
		} catch (err) {
			setError(t('errorFailedLoadRecipe'))
		} finally {
			setIsLoading(false)
		}
	}, [recipeId])

	useEffect(() => {
		if (recipeId) {
			fetchRecipe()
		}
	}, [recipeId, fetchRecipe])

	// AI difficulty calibration — fail-open, non-blocking
	useEffect(() => {
		if (!recipe) return
		const req = {
			ingredient_count: recipe.fullIngredientList?.length ?? 0,
			step_count: recipe.steps?.length ?? 0,
			techniques: recipe.skillTags ?? recipe.enrichment?.techniqueGuides ?? [],
			estimated_time_minutes: recipe.totalTimeMinutes ?? 0,
			equipment_count: recipe.enrichment?.equipmentNeeded?.length ?? 0,
		}
		// Only calibrate if we have meaningful data
		if (req.ingredient_count === 0 && req.step_count === 0) return
		let cancelled = false
		calibrateDifficulty(req).then((res) => {
			if (!cancelled && res.success && res.data) {
				setCalibration(res.data)
			}
		}).catch(() => {})
		return () => { cancelled = true }
	}, [recipe])

	// Fetch per-ingredient buy links — fail-open, non-blocking
	useEffect(() => {
		if (!recipe?.fullIngredientList?.length) return
		let cancelled = false
		const items = recipe.fullIngredientList.map((ing, i) => ({
			itemId: `ing-${i}`,
			name: ing.name,
			quantity: ing.quantity,
			unit: ing.unit,
		}))
		getIngredientBuyLinks(items).then((links) => {
			if (!cancelled) setIngredientBuyLinks(links)
		})
		return () => { cancelled = true }
	}, [recipe])

	// Auto-start cooking if navigated with ?cook=true
	useEffect(() => {
		if (
			!shouldAutoStartCooking ||
			!recipe ||
			autoStartAttempted.current ||
			isCookingLoading
		)
			return

		autoStartAttempted.current = true
		// Remove the query param to prevent re-triggering
		router.replace(`/recipes/${recipeId}`, { scroll: false })

		let cancelled = false
		// Start cooking session
		const initCooking = async () => {
			const success = await startCooking(recipeId)
			if (cancelled) return
			if (success) {
				// Open docked panel on desktop, expanded on mobile
				const isDesktop = window.innerWidth >= 1280
				isDesktop ? openCookingPanel() : expandCookingPanel()
			} else {
				// Get the error message from the store for better context
				const errorMsg = useCookingStore.getState().error
				toast.error(errorMsg || t('toastFailedStartCooking'))
			}
		}
		initCooking()
		return () => {
			cancelled = true
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
		t,
	])

	const handleLike = useCallback(async () => {
		if (isLikeLoading) return
		if (!requireAuth(t('authActionLike'))) return

		const previousLiked = isLiked
		const previousCount = likeCount
		const newLikedState = !isLiked
		setIsLiked(newLikedState)
		setLikeCount(prev => (isLiked ? prev - 1 : prev + 1))
		setIsLikeLoading(true)

		try {
			const response = await toggleLikeRecipe(recipeId)
			if (response.success && response.data) {
				// Defensive: handle both 'isLiked' and 'liked' (Jackson serialization quirk)
				const serverLiked =
					response.data.isLiked ??
					(response.data as { liked?: boolean }).liked ??
					newLikedState
				setIsLiked(serverLiked)
				setLikeCount(
					response.data.likeCount ?? previousCount + (serverLiked ? 1 : -1),
				)
			}
		} catch (error) {
			setIsLiked(previousLiked)
			setLikeCount(previousCount)
			toast.error(t('toastFailedLike'))
		} finally {
			setIsLikeLoading(false)
		}
	}, [isLikeLoading, isLiked, likeCount, recipeId, requireAuth])

	const handleSave = useCallback(async () => {
		if (isSaveLoading) return
		if (!requireAuth(t('authActionSave'))) return

		const previousSaved = isSaved
		const previousCount = saveCount
		const newSavedState = !isSaved
		setIsSaved(newSavedState)
		setSaveCount(prev => (isSaved ? prev - 1 : prev + 1))
		setIsSaveLoading(true)

		try {
			const response = await toggleSaveRecipe(recipeId)
			if (response.success && response.data) {
				// Defensive: handle both 'isSaved' and 'saved' (Jackson serialization quirk)
				const serverSaved =
					response.data.isSaved ??
					(response.data as { saved?: boolean }).saved ??
					newSavedState
				setIsSaved(serverSaved)
				setSaveCount(
					response.data.saveCount ?? previousCount + (serverSaved ? 1 : -1),
				)
				trackEvent(
					serverSaved ? 'RECIPE_SAVED' : 'RECIPE_UNSAVED',
					recipeId,
					'recipe',
				)
				toast.success(serverSaved ? t('toastSaved') : t('toastUnsaved'))
				if (serverSaved) triggerSaveConfetti()
			}
		} catch (error) {
			setIsSaved(previousSaved)
			setSaveCount(previousCount)
			toast.error(t('toastFailedSave'))
		} finally {
			setIsSaveLoading(false)
		}
	}, [isSaveLoading, isSaved, recipeId, saveCount, requireAuth, t])

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: recipe?.title,
					text: recipe?.description,
					url: window.location.href,
				})
			} catch (err) {
				if ((err as Error).name !== 'AbortError') {
					// Share failed for non-cancel reason — fall back to clipboard
					try {
						await navigator.clipboard.writeText(window.location.href)
						toast.success(t('toastLinkCopied'))
					} catch {
						toast.error(t('toastFailedShare'))
					}
				}
			}
		} else {
			try {
				await navigator.clipboard.writeText(window.location.href)
				toast.success(t('toastLinkCopied'))
			} catch {
				toast.error(t('toastFailedCopy'))
			}
		}
	}

	const REMIX_OPTIONS: { type: RemixType; label: string; emoji: string }[] = [
		{ type: 'vegetarian', label: t('dietVegetarian'), emoji: '🌿' },
		{ type: 'vegan', label: t('dietVegan'), emoji: '🌱' },
		{ type: 'gluten-free', label: t('dietGlutenFree'), emoji: '🌾' },
		{ type: 'spicy', label: t('remixSpicy'), emoji: '🌶️' },
		{ type: 'healthy', label: t('remixHealthy'), emoji: '💚' },
		{ type: 'quick', label: t('remixQuick'), emoji: '⚡' },
	]

	const handleRemix = async (remixType: RemixType) => {
		if (!recipe || isRemixing) return
		setShowRemixMenu(false)
		setIsRemixing(true)
		try {
			const steps = recipe.steps.map(s => s.description || '')
			const response = await remixRecipe({
				recipe_title: recipe.title,
				current_steps: steps,
				remix_type: remixType,
			})
			if (response.success && response.data) {
				toast.success(t('toastRemixCreated'))
				setRemixResult(response.data)
			} else {
				toast.error(response.message || t('toastFailedRemixRecipe'))
			}
		} catch {
			toast.error(t('toastFailedRemix'))
		} finally {
			setIsRemixing(false)
		}
	}

	const handleStartCooking = useCallback(async () => {
		if (isCookingLoading || !recipeId) return
		if (!requireAuth(t('authActionCook'))) return

		// If already cooking THIS recipe, just open the panel
		if (isCurrentlyCooked) {
			const isDesktop = window.innerWidth >= 1280
			isDesktop ? openCookingPanel() : expandCookingPanel()
			return
		}

		const success = await startCooking(recipeId)
		if (success) {
			// Pre-cache recipe data for offline cooking via Cache API
			if ('caches' in window) {
				caches.open('recipe-cooking-cache').then(cache => {
					cache.put(
						`/api/v1/recipes/${recipeId}`,
						new Response(JSON.stringify({ success: true, statusCode: 200, data: recipe }), {
							headers: { 'Content-Type': 'application/json' },
						}),
					)
				}).catch(() => {/* non-critical */})
			}
			// Open docked panel on desktop, expanded on mobile
			const isDesktop = window.innerWidth >= 1280
			isDesktop ? openCookingPanel() : expandCookingPanel()
		} else {
			// Get the error message from the store for better context
			const errorMsg = useCookingStore.getState().error
			toast.error(errorMsg || t('toastFailedStartCooking'))
		}
	}, [
		isCookingLoading,
		recipeId,
		isCurrentlyCooked,
		startCooking,
		openCookingPanel,
		expandCookingPanel,
		requireAuth,
		recipe,
		t,
	])

	const [isCreatingRoom, setIsCreatingRoom] = useState(false)

	const handleCookTogether = async () => {
		if (isCreatingRoom || !recipeId) return
		if (!requireAuth(t('authActionCookTogether'))) return
		setIsCreatingRoom(true)
		try {
			const { createRoom } = useCookingStore.getState()
			const roomCode = await createRoom(recipeId)
			if (roomCode) {
				toast.success(t('toastRoomCreated', { roomCode }), {
					description: t('toastShareCode'),
					duration: 8000,
				})
				router.push('/cook-together')
			} else {
				const errorMsg = useCookingStore.getState().error
				toast.error(errorMsg || t('toastFailedCreateRoom'))
			}
		} catch {
			toast.error(t('toastFailedRoom'))
		} finally {
			setIsCreatingRoom(false)
		}
	}

	const handleDeleteRecipe = useCallback(async () => {
		if (isDeleting) return
		setIsDeleting(true)
		try {
			const response = await deleteRecipe(recipeId)
			if (response.success) {
				toast.success(t('toastDeleted'))
				router.push('/profile')
			} else {
				toast.error(response.message || t('toastFailedDeleteRecipe'))
			}
		} catch {
			toast.error(t('toastFailedDelete'))
		} finally {
			setIsDeleting(false)
			setShowDeleteConfirm(false)
		}
	}, [isDeleting, recipeId, router, t])

	const handleAddToShoppingList = async () => {
		if (!requireAuth(t('authActionShoppingList'))) return
		if (isAddingToShoppingList || !recipe) return
		setIsAddingToShoppingList(true)
		try {
			const shoppingList = await createFromRecipe({ recipeId, servings: recipe.servings ?? 1 })
			toast.success(t('toastShoppingListCreated'), {
				description: t('toastShoppingListDetails', {n: shoppingList.totalItems}),
				action: {
					label: t('viewAction'),
					onClick: () => router.push('/shopping-lists'),
				},
			})
			trackEvent('SHOPPING_LIST_CREATED', recipeId, 'recipe', { source: 'recipe_detail', items: shoppingList.totalItems })
		} catch {
			toast.error(t('toastFailedShoppingList'))
		} finally {
			setIsAddingToShoppingList(false)
		}
	}

	// Keyboard shortcuts: Enter=cook, S=save, L=like, Esc=back
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input/textarea
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return
			}

			// Escape always works — closes modals or navigates back
			if (e.key === 'Escape') {
				e.preventDefault()
				if (showDeleteConfirm) {
					setShowDeleteConfirm(false)
				} else if (showRemixMenu) {
					setShowRemixMenu(false)
				} else if (remixResult) {
					setRemixResult(null)
				} else {
					router.back()
				}
				return
			}

			// All other shortcuts: ignore when menus or modals are open
			if (showRemixMenu || remixResult || showDeleteConfirm) {
				return
			}

			// Ignore if any modifier keys are pressed (except shift)
			if (e.ctrlKey || e.metaKey || e.altKey) {
				return
			}

			switch (e.key) {
				case 'Enter':
					e.preventDefault()
					if (!isCookingLoading && recipe) {
						handleStartCooking()
					}
					break
				case 's':
				case 'S':
					e.preventDefault()
					if (!isSaveLoading && recipe) {
						handleSave()
					}
					break
				case 'l':
				case 'L':
					e.preventDefault()
					if (!isLikeLoading && recipe) {
						handleLike()
					}
					break
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [
		recipe,
		isCookingLoading,
		isSaveLoading,
		isLikeLoading,
		router,
		handleStartCooking,
		handleSave,
		handleLike,
		showRemixMenu,
		remixResult,
		showDeleteConfirm,
	])

	if (isLoading) {
		return <RecipeDetailSkeleton />
	}

	if (error || !recipe) {
		return (
			<PageTransition>
				<PageContainer maxWidth='2xl'>
					<ErrorState
						title={t('notFoundTitle')}
						message={error || t('notFoundBody')}
						onRetry={fetchRecipe}
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
			color: 'text-warning',
			bg: 'bg-warning',
			glow: 'shadow-warning/40',
		},
		Advanced: { color: 'text-error', bg: 'bg-error', glow: 'shadow-error/40' },
		Expert: { color: 'text-xp', bg: 'bg-xp', glow: 'shadow-xp/40' },
	}
	const diffConfig =
		difficultyConfig[recipe.difficulty] || difficultyConfig.Beginner

	return (
		<PageTransition>
			<PageContainer maxWidth='2xl'>
				{/* Back Button */}
				<motion.div
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-4'
				>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => router.back()}
						className='gap-2 text-text-secondary hover:text-text'
					>
						<ArrowLeft className='size-4' />
						<span>{t('back')}</span>
					</Button>
				</motion.div>

				{/* Hero Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card'
				>
					{/* Hero Image with overlay */}
					<div className='group relative h-72 w-full overflow-hidden md:h-96'>
						<motion.div
							initial={{ scale: 1.1 }}
							animate={{ scale: 1 }}
							transition={{ duration: DURATION_S.verySlow, ease: 'easeOut' }}
							className='absolute inset-0'
						>
							<Image
								src={getRecipeImage(recipe)}
								alt={recipe.title}
								fill
								sizes='100vw'
								className='object-cover transition-transform duration-700 group-hover:scale-105'
								priority
							/>
						</motion.div>

						{/* Gradient overlay */}
						<div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

						{/* XP Badge - top left */}
						{recipe.xpReward != null && recipe.xpReward > 0 && (
							<motion.div
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ delay: 0.3, ...TRANSITION_SPRING }}
								className='absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-gradient-xp px-4 py-2 text-sm font-bold text-white shadow-lg shadow-xp/40'
							>
								<Zap className='size-4' />+{recipe.xpReward} XP
							</motion.div>
						)}

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

						{/* Video play button overlay - opens video or starts cooking */}
						{recipe.videoUrl && recipe.videoUrl.length > 0 && (
							<TooltipProvider delayDuration={100}>
								<Tooltip>
									<TooltipTrigger asChild>
										<motion.button
											type='button'
											onClick={() => {
												// Get the first video URL from the array
												const firstVideoUrl = recipe.videoUrl?.[0]
												// If it's a valid URL, open it; otherwise start cooking
												if (firstVideoUrl?.startsWith('http')) {
													window.open(
														firstVideoUrl,
														'_blank',
														'noopener,noreferrer',
													)
												} else {
													// Video is embedded in cooking mode
													handleStartCooking()
													toast.info(t('toastWatchVideoInCookingMode'))
												}
											}}
											whileHover={ICON_BUTTON_HOVER}
											whileTap={ICON_BUTTON_TAP}
											transition={TRANSITION_SPRING}
											className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 focus-visible:ring-2 focus-visible:ring-brand/50'
										>
											<div className='grid size-20 place-items-center rounded-full bg-white/90 shadow-2xl transition-all hover:bg-white'>
												<Play className='ml-1 size-8 fill-brand text-brand' />
											</div>
										</motion.button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{t('watchVideo')}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>

					<div className='p-6 md:p-8'>
						{/* Title & Author */}
						<div className='mb-6'>
							<motion.h1
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
								className='mb-3 text-3xl font-serif font-bold text-text md:text-4xl'
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
													recipe.author.avatarUrl || '/placeholder-avatar.svg'
												}
												alt={recipe.author.username || 'Recipe author'}
												fill
												sizes='48px'
												className='object-cover'
											/>
										</div>
										<div>
											<p className='font-semibold text-text group-hover/author:text-brand'>
												{recipe.author.displayName ||
													recipe.author.username ||
													'Unknown'}
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
							{/* Time with prep + cook breakdown */}
							<motion.span
								variants={staggerItem}
								className='flex items-center gap-2 text-text-secondary'
							>
								<Clock className='size-5 text-brand' />
								<TooltipProvider delayDuration={100}>
									<Tooltip>
										<TooltipTrigger asChild>
											<span className='cursor-help font-medium underline decoration-dotted underline-offset-4'>
												{totalTime} min
											</span>
										</TooltipTrigger>
										<TooltipContent className='p-3'>
											<div className='space-y-1 text-sm'>
												<div className='flex items-center gap-2'>
													<Timer className='size-4 text-text-muted' />
													<span>{t('prepMin', {n: recipe.prepTimeMinutes || 0})}</span>
												</div>
												<div className='flex items-center gap-2'>
													<UtensilsCrossed className='size-4 text-brand' />
													<span>{t('cookMin', {n: recipe.cookTimeMinutes || 0})}</span>
												</div>
											</div>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</motion.span>

							{/* Servings */}
							<motion.span
								variants={staggerItem}
								className='flex items-center gap-2 text-text-secondary'
							>
								<Users className='size-5 text-brand' />
								<span className='font-medium tabular-nums'>{recipe.servings} {t('servings')}</span>
							</motion.span>

							{/* Difficulty with explanation tooltip */}
							<motion.span
								variants={staggerItem}
								className='flex items-center gap-2 text-text-secondary'
							>
								<ChefHat className='size-5 text-brand' />
								<TooltipProvider delayDuration={100}>
									<Tooltip>
										<TooltipTrigger asChild>
											<span className='cursor-help font-medium underline decoration-dotted underline-offset-4'>
												{recipe.difficulty}
											</span>
										</TooltipTrigger>
										<TooltipContent className='max-w-xs p-3'>
											{DIFFICULTY_EXPLANATIONS[recipe.difficulty] ? (
												<div className='space-y-2 text-sm'>
													<p className='font-semibold text-text'>
														{DIFFICULTY_EXPLANATIONS[recipe.difficulty].label}
													</p>
													<p className='text-text-secondary'>
														{
															DIFFICULTY_EXPLANATIONS[recipe.difficulty]
																.description
														}
													</p>
													<p className='text-xs text-text-muted'>
														<strong>Techniques:</strong>{' '}
														{
															DIFFICULTY_EXPLANATIONS[recipe.difficulty]
																.techniques
														}
													</p>
												</div>
											) : (
												<p className='text-sm text-text-secondary'>
													{recipe.difficulty} level recipe
												</p>
											)}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
								{/* AI difficulty calibration badge */}
								{calibration && calibration.predictedDifficulty !== recipe.difficulty && (
									<TooltipProvider delayDuration={100}>
										<Tooltip>
											<TooltipTrigger asChild>
												<span className='inline-flex items-center gap-1 rounded-full bg-gaming-xp/10 px-2 py-0.5 text-xs font-medium text-gaming-xp'>
													<Sparkles className='size-3' />
													AI: {calibration.predictedDifficulty}
												</span>
											</TooltipTrigger>
											<TooltipContent className='max-w-xs p-3'>
												<div className='space-y-1 text-sm'>
													<p className='font-semibold text-text'>{t('aiDifficultyCalibration')}</p>
													<p className='text-text-secondary'>
														Based on {recipe.steps?.length} steps, {recipe.fullIngredientList?.length} ingredients, and detected techniques,
														our AI rates this as <strong>{calibration.predictedDifficulty}</strong> ({Math.round(calibration.confidence * 100)}% confidence).
													</p>
													<p className='text-xs text-text-muted'>
														Source: {calibration.calibrationSource}
													</p>
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
							</motion.span>

							{/* Recipe Quality Score */}
							{recipe.qualityTier && (
								<motion.span variants={staggerItem}>
									<TooltipProvider delayDuration={100}>
										<Tooltip>
											<TooltipTrigger asChild>
												<span className='cursor-help'>
													<QualityBadge
														tier={recipe.qualityTier}
														score={recipe.qualityScore}
														size='md'
														showLabel
														showScore
														animate={false}
													/>
												</span>
											</TooltipTrigger>
											<TooltipContent className='max-w-xs p-3'>
												<div className='space-y-1 text-sm'>
													<p className='font-semibold text-text'>
														{t('recipeQuality', {tier: recipe.qualityTier})}
													</p>
													<p className='text-text-secondary'>
														{getTierDescription(recipe.qualityTier)}
													</p>
													{recipe.qualityScore != null && (
														<div className='flex items-center gap-2'>
															<div className='h-1.5 flex-1 overflow-hidden rounded-full bg-border'>
																<div
																	className='h-full rounded-full bg-brand transition-all'
																	style={{ width: `${recipe.qualityScore}%` }}
																/>
															</div>
															<span className='text-xs font-bold tabular-nums text-text-muted'>
																{recipe.qualityScore}/100
															</span>
														</div>
													)}
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</motion.span>
							)}

							{/* Views */}
							<motion.span
								variants={staggerItem}
								className='flex items-center gap-2 text-text-secondary'
							>
								<Eye className='size-5 text-brand' />
								<span className='font-medium tabular-nums'>
									<AnimatedNumber
										value={recipe.viewCount || 0}
										format={n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`}
									/>{' '}
									views
								</span>
							</motion.span>

							{/* Calories */}
							{recipe.caloriesPerServing != null &&
								recipe.caloriesPerServing > 0 && (
									<motion.span
										variants={staggerItem}
										className='flex items-center gap-2 text-text-secondary'
									>
										<Flame className='size-5 text-brand' />
										<span className='font-medium'>
											{recipe.caloriesPerServing} cal/serving
										</span>
									</motion.span>
								)}
						</motion.div>

						{/* Action Buttons — 3-tier hierarchy */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.5 }}
							className='space-y-3'
						>
							{/* Tier 1: Primary CTA — full width, unmissable */}
							<motion.button
								type='button'
								onClick={handleStartCooking}
								disabled={isCookingLoading || hasOtherSession}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								title={
									hasOtherSession
										? t('alreadyCookingTitle', { recipe: activeSession?.recipe?.title || t('anotherRecipe') })
										: undefined
								}
								className={cn(
									'flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold shadow-lg transition-shadow disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50',
									isCurrentlyCooked
										? 'bg-success text-white shadow-success/30 hover:shadow-success/40'
										: hasOtherSession
											? 'cursor-not-allowed bg-border-strong text-white shadow-none'
											: 'bg-gradient-hero text-white shadow-brand/30 hover:shadow-xl hover:shadow-brand/40',
								)}
							>
								{isCookingLoading ? (
									<>
										<Loader2 className='size-6 animate-spin' />
										{t('startingCooking')}
									</>
								) : isCurrentlyCooked ? (
									<>
										<Play className='size-6 fill-white' />
										{t('continueCooking')}
									</>
								) : hasOtherSession ? (
									<>
										<AlertCircle className='size-6' />
										{t('alreadyCooking')}
									</>
								) : (
									<>
										<Play className='size-6 fill-white' />
										{t('startCooking')}
										<kbd className='ml-2 rounded bg-white/20 px-1.5 py-0.5 text-xs font-normal'>Enter</kbd>
									</>
								)}
							</motion.button>

							{/* Tier 2: Social actions — compact inline bar */}
							<div className='flex items-center gap-2'>
								<motion.button
									type='button'
									onClick={handleLike}
									disabled={isLikeLoading}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className={cn(
										'flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
										isLiked
											? 'border-error bg-error/10 text-error'
											: 'border-border-medium hover:border-error hover:bg-error/5',
									)}
								>
									<Heart className={cn('size-4', isLiked && 'fill-current')} />
									<AnimatedNumber value={likeCount} className='tabular-nums' />
									<kbd className='hidden text-xs font-normal text-text-muted sm:inline'>L</kbd>
								</motion.button>
								<motion.button
									type='button'
									onClick={handleSave}
									disabled={isSaveLoading}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className={cn(
										'flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-brand/50',
										isSaved
											? 'border-brand bg-brand/10 text-brand'
											: 'border-border-medium hover:border-brand hover:bg-brand/5',
									)}
								>
									<motion.span
										animate={isSaved ? 'saved' : 'unsaved'}
										variants={BOOKMARK_SLIDE}
										className='inline-flex'
									>
										<Bookmark className={cn('size-4', isSaved && 'fill-current')} />
									</motion.span>
									{isSaved ? t('saved') : t('save')}
									<kbd className='hidden text-xs font-normal text-text-muted sm:inline'>S</kbd>
								</motion.button>
								<motion.button
									type='button'
									onClick={handleShare}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border-medium px-4 py-3 text-sm font-semibold transition-colors hover:border-text-secondary hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50'
									aria-label={t('ariaShareRecipe')}
								>
									<Share2 className='size-4' />
									{t('share')}
								</motion.button>
								<motion.button
									type='button'
									onClick={handleCookTogether}
									disabled={isCreatingRoom || hasOtherSession}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									title={
										hasOtherSession
											? t('alreadyCookingTooltip', { recipe: activeSession?.recipe?.title || t('anotherRecipe') })
											: t('cookTogetherTitle')
									}
									className='flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-brand/40 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand transition-all hover:border-brand hover:bg-brand/10 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									{isCreatingRoom ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<Users className='size-4' />
									)}
									<span className='hidden sm:inline'>{t('together')}</span>
								</motion.button>
							</div>

							{/* Tier 3: Secondary actions — condensed row with more-menu */}
							<div className='flex items-center gap-2'>
								<motion.button
									type='button'
									onClick={handleAddToShoppingList}
									disabled={isAddingToShoppingList}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='flex items-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-success hover:bg-success/5 hover:text-success focus-visible:ring-2 focus-visible:ring-brand/50'
									title={t('addToShoppingListTitle')}
								>
									{isAddingToShoppingList ? (
										<Loader2 className='size-3.5 animate-spin' />
									) : (
										<ShoppingCart className='size-3.5' />
									)}
									{t('shoppingList')}
								</motion.button>
								{/* Remix Dropdown */}
								<DropdownMenu
									open={showRemixMenu}
									onOpenChange={setShowRemixMenu}
								>
									<DropdownMenuTrigger asChild>
										<motion.button
											type='button'
											whileHover={BUTTON_HOVER}
											whileTap={BUTTON_TAP}
											disabled={isRemixing}
											className='flex items-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-xp hover:bg-xp/5 hover:text-xp disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
											title={t('remixRecipeTitle')}
										>
											{isRemixing ? (
												<Loader2 className='size-3.5 animate-spin' />
											) : (
												<Sparkles className='size-3.5' />
											)}
											{t('remix')}
										</motion.button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='center' className='w-48'>
										{REMIX_OPTIONS.map(opt => (
											<DropdownMenuItem
												key={opt.type}
												onClick={() => handleRemix(opt.type)}
												className='cursor-pointer gap-2 text-sm'
											>
												<span>{opt.emoji}</span>
												<span>{opt.label}</span>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
								{!isOwner && recipe?.author?.userId && (
									<TipJarButton
										creatorId={recipe.author.userId}
										creatorName={recipe.author.displayName || recipe.author.username || 'this creator'}
										recipeId={recipe.id}
									/>
								)}
								{/* Owner Controls — collapsed into dropdown */}
								{isOwner && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<motion.button
												type='button'
												whileHover={BUTTON_HOVER}
												whileTap={BUTTON_TAP}
												className='ml-auto flex items-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-text-secondary hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50'
												title={t('recipeActionsTitle')}
											>
												<MoreHorizontal className='size-3.5' />
												{t('manage')}
											</motion.button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end' className='w-48'>
											<DropdownMenuItem
												onClick={() => {
													if (!recipe) return
													useCookingStore.getState().startPreviewCooking(recipe)
													useUiStore.getState().expandCookingPanel()
												}}
												className='cursor-pointer gap-2 text-sm'
											>
												<Rocket className='size-4' />
												{t('testCookPreview')}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => router.push(`/create?draftId=${recipeId}`)}
												className='cursor-pointer gap-2 text-sm'
											>
												<Edit3 className='size-4' />
												{t('editRecipe')}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => setShowDeleteConfirm(true)}
												className='cursor-pointer gap-2 text-sm text-error focus:text-error'
											>
												<Trash2 className='size-4' />
												{t('deleteRecipe')}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</motion.div>

						{/* Tags */}
						{(recipe.cuisineType || (recipe.dietaryTags?.length ?? 0) > 0) && (
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
								{recipe.dietaryTags?.map(tag => (
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

				{/* Social Proof — community activity */}
				<SocialProof recipeId={recipeId} />

				{/* XP Breakdown - Transparency for gamification */}
				{recipe.xpBreakdown ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className='mb-8 rounded-2xl border border-xp/20 bg-gradient-to-br from-xp/5 to-transparent p-6 shadow-card'
					>
						<h2 className='mb-4 flex items-center gap-2 text-xl font-bold text-text'>
							<Zap className='size-5 text-xp' />
							XP Breakdown
							<TooltipProvider delayDuration={100}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className='size-4 cursor-help text-text-muted' />
									</TooltipTrigger>
									<TooltipContent className='max-w-xs p-3'>
										<p className='text-sm text-text-secondary'>
											{t('xpTooltipExplanation')}
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</h2>
						<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
							<div className='rounded-xl bg-bg-card p-4 text-center'>
								<div className='text-2xl font-bold tabular-nums text-success'>
									+<AnimatedNumber value={recipe.xpBreakdown.base} />
								</div>
								<div className='text-xs text-text-muted'>
									{t('xpBase', {difficulty: recipe.difficulty})}
								</div>
							</div>
							<div className='rounded-xl bg-bg-card p-4 text-center'>
								<div className='text-2xl font-bold tabular-nums text-success'>
									+<AnimatedNumber value={recipe.xpBreakdown.steps} />
								</div>
								<div className='text-xs text-text-muted'>
									{t('xpSteps', {n: recipe.steps.length})}
								</div>
							</div>
							<div className='rounded-xl bg-bg-card p-4 text-center'>
								<div className='text-2xl font-bold tabular-nums text-success'>
									+<AnimatedNumber value={recipe.xpBreakdown.time} />
								</div>
								<div className='text-xs text-text-muted'>
									{t('xpTime', {n: totalTime})}
								</div>
							</div>
							{recipe.xpBreakdown.techniques ? (
								<div className='rounded-xl bg-bg-card p-4 text-center'>
									<div className='text-2xl font-bold tabular-nums text-success'>
										+<AnimatedNumber value={recipe.xpBreakdown.techniques} />
									</div>
									<div className='text-xs text-text-muted'>{t('xpTechniques')}</div>
								</div>
							) : null}
						</div>
						<div className='mt-4 flex items-center justify-between rounded-xl bg-gradient-xp p-4'>
							<span className='font-semibold text-white'>{t('xpTotal')}</span>
							<span className='text-2xl font-black tabular-nums text-white'>
								+<AnimatedNumber value={(() => {
									const computed =
										recipe.xpBreakdown.base +
										recipe.xpBreakdown.steps +
										recipe.xpBreakdown.time +
										(recipe.xpBreakdown.techniques ?? 0)
									return recipe.xpBreakdown.total > 0
										? recipe.xpBreakdown.total
										: computed
								})()} duration={0.8} />
							</span>
						</div>
					</motion.div>
				) : (
					// Fallback when xpBreakdown is not available - compute estimate
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className='mb-8 rounded-2xl border border-xp/20 bg-gradient-to-br from-xp/5 to-transparent p-6 shadow-card'
					>
						<h2 className='mb-4 flex items-center gap-2 text-xl font-bold text-text'>
							<Zap className='size-5 text-xp' />
							XP Reward
							<TooltipProvider delayDuration={100}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className='size-4 cursor-help text-text-muted' />
									</TooltipTrigger>
									<TooltipContent className='max-w-xs p-3'>
										<p className='text-sm text-text-secondary'>
											{t('xpTooltipExplanation')}
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</h2>
						<div className='flex items-center justify-between rounded-xl bg-gradient-xp p-4'>
							<div>
								<span className='font-semibold text-white'>
									{t('estimatedXpReward')}
								</span>
								<p className='text-xs text-white/70'>
									{t('xpRewardBasis')}
								</p>
							</div>
							<span className='text-2xl font-black text-white'>
								+{recipe.xpReward ?? 0}
							</span>
						</div>
					</motion.div>
				)}

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
								<span className='text-2xl'>🧾</span> {t('ingredients')}
							</h2>
							<p className='mb-4 text-sm text-text-muted'>
								{t('forServings', {n: recipe.servings})}
							</p>
							<ul className='space-y-2'>
								{recipe.fullIngredientList.map((ingredient, index) => (
									<motion.li
										key={`ingredient-${index}`}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.5 + index * 0.03 }}
										whileHover={NAV_ITEM_HOVER}
										className='group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-bg-elevated'
									>
										<div className='mt-1.5 size-2 flex-shrink-0 rounded-full bg-brand' />
										<span className='flex-1 text-text-secondary'>
											<span className='font-semibold text-text'>
												{ingredient.quantity} {ingredient.unit}
											</span>{' '}
											{ingredient.name}
										</span>
										<div className='flex flex-shrink-0 items-center gap-1'>
											{ingredientBuyLinks[`ing-${index}`] && (
												<a
													href={ingredientBuyLinks[`ing-${index}`]}
													target='_blank'
													rel='noopener noreferrer'
													className='flex size-8 items-center justify-center rounded-lg text-text-muted opacity-70 transition-all hover:bg-brand/10 hover:text-brand md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
													title={t('buyIngredient', { name: ingredient.name })}
													onClick={() => trackEvent('INGREDIENT_CHECKED', `ing-${index}`, 'ingredient', { name: ingredient.name, action: 'buy_click' })}
												>
													<ShoppingCart className='size-4' />
												</a>
											)}
											<SubstitutionButton
												ingredientName={ingredient.name}
												recipeTitle={recipe.title}
											/>
										</div>
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
							<span className='text-2xl'>👨‍🍳</span> {t('instructions')}
						</h2>
						<div className='space-y-4'>
							{recipe.steps
								.sort((a, b) => a.stepNumber - b.stepNumber)
								.map((step, index) => (
									<motion.div
										key={`step-${step.stepNumber}`}
										variants={staggerItem}
										whileHover={STAT_ITEM_HOVER}
										className='group rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card transition-shadow hover:shadow-warm'
									>
										<div className='mb-4 flex items-center gap-4'>
											<motion.div
												whileHover={ICON_HOVER}
												transition={TRANSITION_SPRING}
												className='grid size-12 flex-shrink-0 place-items-center rounded-xl bg-gradient-hero text-lg font-bold text-white shadow-card'
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
														{Math.ceil(step.timerSeconds / 60)} {t('minTimer')}
													</p>
												)}
											</div>
										</div>
										{step.videoUrl ? (
											<div className='relative mb-4 aspect-video overflow-hidden rounded-xl'>
												<video
													src={step.videoUrl}
													poster={step.videoThumbnailUrl || undefined}
													controls
													loop
													muted
													playsInline
													className='h-full w-full object-cover'
												/>
											</div>
										) : step.imageUrl ? (
											<div className='relative mb-4 aspect-video overflow-hidden rounded-xl'>
												<Image
													src={step.imageUrl}
													alt={step.title || `Step ${step.stepNumber}`}
													fill
													sizes='(max-width: 768px) 100vw, 50vw'
													className='object-cover transition-transform duration-500 group-hover:scale-105'
												/>
											</div>
										) : null}
										<p className='leading-relaxed text-text-secondary'>
											{step.description}
										</p>
									</motion.div>
								))}
						</div>
					</motion.div>
				</div>

				{/* Community Reviews */}
				<RecipeReviews recipeId={recipeId} />

				{/* Similar Recipes */}
				<SimilarRecipes recipeId={recipeId} />
			</PageContainer>

			{/* Remix Result Modal */}
			{remixResult && (
				<Portal>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4'
						onClick={() => setRemixResult(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							transition={TRANSITION_SPRING}
							className='max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-card md:p-8'
							onClick={e => e.stopPropagation()}
						>
							<div className='mb-4 flex items-start justify-between'>
								<div>
									<span className='mb-1 inline-block rounded-full bg-xp/10 px-3 py-1 text-xs font-semibold text-xp'>
										{t('aiRemix')}
									</span>
									<h2 className='mt-2 text-xl font-bold text-text'>
										{remixResult.remix_title}
									</h2>
								</div>
								<button
									type='button'
									onClick={() => setRemixResult(null)}
									className='grid size-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
									aria-label={t('remixClose')}
								>
									✕
								</button>
							</div>

							{/* Modifications */}
							{remixResult.modifications &&
								remixResult.modifications.length > 0 && (
									<div className='mb-5'>
										<h3 className='mb-2 text-sm font-semibold uppercase tracking-wider text-text-secondary'>
											{t('changesMade')}
										</h3>
										<ul className='space-y-1'>
											{remixResult.modifications.map((mod, i) => (
												<li
													key={i}
													className='flex items-start gap-2 text-sm text-text-secondary'
												>
													<Check className='mt-0.5 size-4 flex-shrink-0 text-brand' />
													{mod}
												</li>
											))}
										</ul>
									</div>
								)}

							{/* Ingredient Changes */}
							{((remixResult.new_ingredients &&
								remixResult.new_ingredients.length > 0) ||
								(remixResult.removed_ingredients &&
									remixResult.removed_ingredients.length > 0)) && (
								<div className='mb-5 flex gap-4'>
									{remixResult.new_ingredients &&
										remixResult.new_ingredients.length > 0 && (
											<div className='flex-1'>
												<h3 className='mb-2 text-sm font-semibold uppercase tracking-wider text-brand'>
													{t('addedItems')}
												</h3>
												<ul className='space-y-1'>
													{remixResult.new_ingredients.map((ing, i) => (
														<li key={i} className='text-sm text-text-secondary'>
															{ing}
														</li>
													))}
												</ul>
											</div>
										)}
									{remixResult.removed_ingredients &&
										remixResult.removed_ingredients.length > 0 && (
											<div className='flex-1'>
												<h3 className='mb-2 text-sm font-semibold uppercase tracking-wider text-error'>
													{t('removedItems')}
												</h3>
												<ul className='space-y-1'>
													{remixResult.removed_ingredients.map((ing, i) => (
														<li
															key={i}
															className='text-sm text-text-secondary line-through'
														>
															{ing}
														</li>
													))}
												</ul>
											</div>
										)}
								</div>
							)}

							{/* Modified Steps */}
							{remixResult.modified_steps &&
								remixResult.modified_steps.length > 0 && (
									<div className='mb-5'>
										<h3 className='mb-2 text-sm font-semibold uppercase tracking-wider text-text-secondary'>
											Steps
										</h3>
										<ol className='space-y-2'>
											{remixResult.modified_steps.map((step, i) => (
												<li
													key={i}
													className='flex gap-3 text-sm text-text-secondary'
												>
													<span className='flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand'>
														{i + 1}
													</span>
													<span className='pt-0.5'>{step}</span>
												</li>
											))}
										</ol>
									</div>
								)}

							{/* Tip */}
							{remixResult.tip && (
								<div className='rounded-xl border border-border-subtle bg-bg-elevated p-4'>
									<div className='flex items-start gap-2'>
										<Info className='mt-0.5 size-4 flex-shrink-0 text-brand' />
										<p className='text-sm text-text-secondary'>
											{remixResult.tip}
										</p>
									</div>
								</div>
							)}
						</motion.div>
					</motion.div>
				</Portal>
			)}

			{/* Delete Confirmation */}
			{showDeleteConfirm && (
				<Portal>
					<div className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 backdrop-blur-sm'>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							className='mx-4 w-full max-w-md rounded-2xl bg-bg-card p-6 shadow-card'
						>
							<h3 className='mb-2 text-lg font-bold text-text'>
								{t('deleteRecipeConfirmTitle')}
							</h3>
							<p className='mb-6 text-sm text-text-secondary'>
								{t('deleteRecipeConfirmDesc')}
							</p>
							<div className='flex gap-3'>
								<Button
									variant='outline'
									className='flex-1'
									onClick={() => setShowDeleteConfirm(false)}
									disabled={isDeleting}
								>
									{t('cancel')}
								</Button>
								<Button
									variant='destructive'
									className='flex-1'
									onClick={handleDeleteRecipe}
									disabled={isDeleting}
								>
									{isDeleting ? (
										<Loader2 className='mr-2 size-4 animate-spin' />
									) : (
										<Trash2 className='mr-2 size-4' />
									)}
									{t('delete')}
								</Button>
							</div>
						</motion.div>
					</div>
				</Portal>
			)}
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
				transition={{ duration: DURATION_S.smooth }}
				className='mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card'
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

export default function RecipeDetailPage() {
	return (
		<Suspense fallback={<RecipeDetailSkeleton />}>
			<RecipeDetailContent />
		</Suspense>
	)
}
