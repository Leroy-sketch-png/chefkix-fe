'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	CalendarDays,
	Sparkles,
	ShoppingCart,
	Clock,
	ChefHat,
	X,
	RefreshCw,
	Copy,
	Check,
	Trash2,
	Search,
	Shuffle,
	Loader2,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { Portal } from '@/components/ui/portal'
import { ErrorState } from '@/components/ui/error-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'
import {
	generateMealPlan,
	getCurrentMealPlan,
	deleteMealPlan,
	getShoppingList,
	swapMeal,
} from '@/services/mealplan'
import { getAllRecipes } from '@/services/recipe'
import { Recipe, getTotalTime, formatCookingTime } from '@/lib/types/recipe'
import type {
	MealPlan,
	PlannedDay,
	PlannedMeal,
	ShoppingItem,
} from '@/lib/types/mealplan'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const
type MealType = (typeof MEAL_TYPES)[number]

const MEAL_LABELS: Record<MealType, { labelKey: string; emoji: string }> = {
	breakfast: { labelKey: 'breakfast', emoji: '🌅' },
	lunch: { labelKey: 'lunch', emoji: '☀️' },
	dinner: { labelKey: 'dinner', emoji: '🌙' },
}

export default function MealPlannerPage() {
	const router = useRouter()
	const [plan, setPlan] = useState<MealPlan | null>(null)
	const [loading, setLoading] = useState(true)
	const [fetchError, setFetchError] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [showShopping, setShowShopping] = useState(false)
	const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
	const [loadingShopping, setLoadingShopping] = useState(false)
	const [copiedList, setCopiedList] = useState(false)
	const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

	// Auto-reset copiedList after 2s with proper cleanup
	useEffect(() => {
		if (!copiedList) return
		const id = setTimeout(() => setCopiedList(false), 2000)
		return () => clearTimeout(id)
	}, [copiedList])
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [useAI, setUseAI] = useState(false)

	// Swap meal state
	const [swapping, setSwapping] = useState<{
		day: string
		type: MealType
	} | null>(null)
	const [swapSearch, setSwapSearch] = useState('')
	const [swapResults, setSwapResults] = useState<Recipe[]>([])
	const [swapLoading, setSwapLoading] = useState(false)
	const [isSwapping, setIsSwapping] = useState(false)
	const swapSearchRef = useRef<HTMLInputElement>(null)
	const swapFocusTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const t = useTranslations('mealPlanner')

	useEscapeKey(confirmingDelete, () => setConfirmingDelete(false))
	useEscapeKey(!!swapping, () => setSwapping(null))

	// Cleanup swap focus timeout on unmount
	useEffect(() => {
		return () => {
			if (swapFocusTimeoutRef.current) clearTimeout(swapFocusTimeoutRef.current)
		}
	}, [])

	const isMountedRef = useRef(true)
	useEffect(() => {
		isMountedRef.current = true
		return () => {
			isMountedRef.current = false
		}
	}, [])

	// ── Fetch current plan ────────────────────────────────

	const fetchPlan = useCallback(async () => {
		setFetchError(false)
		try {
			const data = await getCurrentMealPlan()
			if (!isMountedRef.current) return
			setPlan(data)
		} catch (err: unknown) {
			if (!isMountedRef.current) return
			setFetchError(true)
		} finally {
			if (isMountedRef.current) setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchPlan()
	}, [fetchPlan])

	// ── Generate ──────────────────────────────────────────

	const handleGenerate = async () => {
		setGenerating(true)
		try {
			const newPlan = await generateMealPlan({ days: 7 }, useAI)
			setPlan(newPlan)
			toast.success(t('planGenerated'))
		} catch {
			toast.error(t('failedGenerate'))
		} finally {
			setGenerating(false)
		}
	}

	// ── Delete ────────────────────────────────────────────

	const handleDelete = async () => {
		if (!plan || isDeleting) return
		setIsDeleting(true)
		try {
			await deleteMealPlan(plan.id)
			setPlan(null)
			setConfirmingDelete(false)
			toast.success(t('planDeleted'))
		} catch {
			toast.error(t('failedDelete'))
		} finally {
			setIsDeleting(false)
		}
	}

	// ── Shopping List ─────────────────────────────────────

	const handleShowShopping = async () => {
		if (!plan) return
		setShowShopping(true)
		setLoadingShopping(true)
		try {
			const list = await getShoppingList(plan.id)
			setShoppingList(list)
		} catch {
			toast.error(t('failedLoadShopping'))
			setShoppingList(plan.shoppingList || [])
		} finally {
			setLoadingShopping(false)
		}
	}

	const copyShoppingList = async () => {
		const text = shoppingList
			.map(
				item =>
					`${item.ingredient}${item.quantity ? ` (${item.quantity})` : ''} — ${item.recipes.join(', ')}`,
			)
			.join('\n')
		try {
			await navigator.clipboard.writeText(text)
			setCopiedList(true)
		} catch {
			toast.error(t('failedCopy'))
		}
	}

	const toggleChecked = (ingredient: string) => {
		setCheckedItems(prev => {
			const next = new Set(prev)
			if (next.has(ingredient)) next.delete(ingredient)
			else next.add(ingredient)
			return next
		})
	}

	// ── Swap Meal ─────────────────────────────────────────

	const handleSwapClick = (day: string, type: MealType) => {
		setSwapping({ day, type })
		setSwapSearch('')
		setSwapResults([])
		fetchSwapSuggestions('')
		if (swapFocusTimeoutRef.current) clearTimeout(swapFocusTimeoutRef.current)
		swapFocusTimeoutRef.current = setTimeout(
			() => swapSearchRef.current?.focus(),
			100,
		)
	}

	const fetchSwapSuggestions = useCallback(async (query: string) => {
		setSwapLoading(true)
		try {
			const response = await getAllRecipes({
				search: query || undefined,
				size: 8,
				page: 0,
			})
			if (response.success && response.data) {
				setSwapResults(response.data)
			}
		} catch {
			setSwapResults([])
		} finally {
			setSwapLoading(false)
		}
	}, [])

	// Debounce swap search
	useEffect(() => {
		if (!swapping) return
		const timeout = setTimeout(() => fetchSwapSuggestions(swapSearch), 300)
		return () => clearTimeout(timeout)
	}, [swapSearch, swapping, fetchSwapSuggestions])

	const handleSwapSelect = async (recipe: Recipe) => {
		if (!swapping || !plan || isSwapping) return
		setIsSwapping(true)
		try {
			const updated = await swapMeal(plan.id, swapping.day, swapping.type, {
				recipeId: recipe.id,
				title: recipe.title,
				totalTimeMinutes: getTotalTime(recipe),
				servings: recipe.servings,
				aiGenerated: false,
			})
			setPlan(updated)
			setSwapping(null)
			toast.success(t('swappedTo', { title: recipe.title }))
		} catch {
			toast.error(t('failedSwap'))
		} finally {
			setIsSwapping(false)
		}
	}

	// ── Helpers ───────────────────────────────────────────

	const getMeal = (day: PlannedDay, type: MealType): PlannedMeal | null => {
		return day[type] ?? null
	}
	const plannedDays = Array.isArray(plan?.days) ? plan.days : []
	const hasPlan = plan !== null && plannedDays.length > 0

	// ── Skeleton ──────────────────────────────────────────

	if (loading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='xl'>
					<div className='space-y-6 py-6'>
						<div className='h-10 w-52 animate-pulse rounded-lg bg-bg-elevated' />
						<div className='grid grid-cols-7 gap-3'>
							{Array.from({ length: 21 }).map((_, i) => (
								<div
									key={i}
									className='h-24 animate-pulse rounded-xl bg-bg-elevated'
								/>
							))}
						</div>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}
	if (fetchError) {
		return (
			<PageTransition>
				<PageContainer maxWidth='xl'>
					<ErrorState
						title={t('failedLoad')}
						message={t('failedLoadDesc')}
						onRetry={() => {
							setLoading(true)
							fetchPlan()
						}}
					/>
				</PageContainer>
			</PageTransition>
		)
	}
	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<div className='space-y-6 py-6'>
					{/* ── Header with PageHeader ────────────────────────── */}
					<PageHeader
						icon={CalendarDays}
						title={t('title')}
						subtitle={t('subtitle')}
						gradient='green'
						marginBottom='sm'
						rightAction={
							<div className='flex flex-wrap items-center gap-2'>
								{hasPlan && (
									<>
										<button
											type='button'
											onClick={handleShowShopping}
											className='flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated/80'
										>
											<ShoppingCart className='size-4' />
											{t('shoppingList')}
										</button>
										<button
											type='button'
											onClick={() => setConfirmingDelete(true)}
											className='flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20'
										>
											<Trash2 className='size-4' />
											{t('clear')}
										</button>
									</>
								)}
								<button
									type='button'
									onClick={() => setUseAI(prev => !prev)}
									className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
										useAI
											? 'bg-brand/15 text-brand'
											: 'bg-bg-elevated text-text-secondary hover:bg-bg-elevated/80'
									}`}
									title={
										useAI
											? 'AI-powered generation (uses your pantry + Gemini)'
											: 'Quick generation (shuffles existing recipes)'
									}
								>
									<Sparkles className='size-4' />
									{useAI ? t('aiMode') : t('quickMode')}
								</button>
								<button
									type='button'
									onClick={handleGenerate}
									disabled={generating}
									className='flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50'
								>
									{generating ? (
										<RefreshCw className='size-4 animate-spin' />
									) : (
										<ChefHat className='size-4' />
									)}
									{plan ? t('regenerate') : t('generatePlan')}
								</button>
							</div>
						}
					/>

					{/* ── AI Mode Notice ─────────────────── */}
					{useAI && !plan?.reasoning && (
						<p className='text-xs text-text-muted'>
							<Sparkles className='mr-1 inline size-3 text-brand' />
							{t('aiModeNotice')}
						</p>
					)}

					{/* ── AI Reasoning Banner ───────────── */}
					{plan?.reasoning && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<Alert variant='info' className='rounded-xl'>
								<Sparkles className='size-4' />
								<AlertDescription>
									<p className='text-sm text-text'>{plan.reasoning}</p>
									{plan.pantryUtilizationPercent != null &&
										plan.pantryUtilizationPercent > 0 && (
											<p className='mt-1 text-xs text-text-muted'>
												{t('pantryUtilization')}{' '}
												{Math.round(plan.pantryUtilizationPercent)}%
											</p>
										)}
								</AlertDescription>
							</Alert>
						</motion.div>
					)}

					{/* ── No Plan State ─────────────────── */}
					{!hasPlan ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className='flex flex-col items-center justify-center gap-4 py-20'
						>
							<CalendarDays className='size-16 text-text-muted/40' />
							<h2 className='text-lg font-semibold text-text-secondary'>
								{t('noPlanYet')}
							</h2>
							<p className='max-w-sm text-center text-sm text-text-muted'>
								{t('noPlanDesc')}
							</p>
							<button
								type='button'
								onClick={handleGenerate}
								disabled={generating}
								className='flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-warm transition-colors hover:bg-brand/90 disabled:opacity-50'
							>
								{generating ? (
									<RefreshCw className='size-4 animate-spin' />
								) : (
									<ChefHat className='size-4' />
								)}
								{t('generatePlan')}
							</button>
						</motion.div>
					) : (
						/* ── 7-Day Grid ──────────────────── */
						<div className='overflow-x-auto scrollbar-hide'>
							<div className='min-w-[900px]'>
								{/* Day Headers */}
								<div className='mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-2'>
									<div /> {/* spacer */}
									{plannedDays.map(day => (
										<div
											key={day.dayOfWeek}
											className='rounded-lg bg-bg-elevated px-3 py-2 text-center text-sm font-semibold text-text'
										>
											{day.dayOfWeek.slice(0, 3)}
										</div>
									))}
								</div>

								{/* Meal Rows */}
								{MEAL_TYPES.map(mealType => (
									<div
										key={mealType}
										className='mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-2'
									>
										<div className='flex items-center justify-center gap-1 text-sm font-medium text-text-secondary'>
											<span>{MEAL_LABELS[mealType].emoji}</span>
											<span className='hidden lg:inline'>
												{t(MEAL_LABELS[mealType].labelKey)}
											</span>
										</div>
										{plannedDays.map(day => {
											const meal = getMeal(day, mealType)
											return (
												<motion.div
													key={`${day.dayOfWeek}-${mealType}`}
													whileHover={CARD_HOVER}
													className='group relative rounded-xl border border-border-subtle bg-bg-card p-3 text-left shadow-card transition-colors hover:border-brand/30'
												>
													<button
														type='button'
														onClick={() =>
															meal?.recipeId &&
															router.push(`/recipes/${meal.recipeId}`)
														}
														className='w-full text-left'
													>
														{meal ? (
															<>
																<p className='line-clamp-2 text-xs font-medium text-text'>
																	{meal.title}
																</p>
																<div className='mt-1.5 flex items-center gap-1.5 text-2xs text-text-muted'>
																	<Clock className='size-3' />
																	{formatCookingTime(meal.totalTimeMinutes)}
																	{meal.aiGenerated && (
																		<span className='rounded bg-info/10 px-1 py-0.5 text-info'>
																			AI
																		</span>
																	)}
																</div>
															</>
														) : (
															<p className='text-sm text-text-muted/50'>+</p>
														)}
													</button>
													{/* Swap button */}
													<button
														type='button'
														onClick={e => {
															e.stopPropagation()
															handleSwapClick(day.dayOfWeek, mealType)
														}}
														aria-label={t('swapMeal')}
														className='absolute right-1 top-1 rounded-md p-2 text-text-muted opacity-70 transition-all hover:bg-bg-elevated hover:text-brand active:opacity-100 md:opacity-60 md:group-hover:opacity-100 focus-visible:opacity-100'
													>
														<Shuffle className='size-4' />
													</button>
												</motion.div>
											)
										})}
									</div>
								))}
							</div>
						</div>
					)}

					{/* ── Shopping List Drawer ──────────── */}
					<AnimatePresence>
						{showShopping && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={TRANSITION_SPRING}
								className='rounded-xl border border-border-subtle bg-bg-card p-5 shadow-warm'
							>
								<div className='mb-4 flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<ShoppingCart className='size-5 text-brand' />
										<h2 className='text-lg font-semibold text-text'>
											{t('shoppingList')}
										</h2>
										{shoppingList.length > 0 && (
											<span className='rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-secondary'>
												{t('itemsCount', { count: shoppingList.length })}
											</span>
										)}
									</div>
									<div className='flex items-center gap-2'>
										<button
											type='button'
											onClick={copyShoppingList}
											className='flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-elevated/80'
										>
											{copiedList ? (
												<Check className='size-3.5' />
											) : (
												<Copy className='size-3.5' />
											)}
											{copiedList ? t('copied') : t('copyList')}
										</button>
										<button
											type='button'
											onClick={() => setShowShopping(false)}
											aria-label={t('closeShoppingList')}
											className='rounded-md p-1.5 text-text-muted hover:bg-bg-elevated'
										>
											<X className='size-4' />
										</button>
									</div>
								</div>

								{loadingShopping ? (
									<div className='space-y-2'>
										{Array.from({ length: 5 }).map((_, i) => (
											<div
												key={i}
												className='h-10 animate-pulse rounded-lg bg-bg-elevated'
											/>
										))}
									</div>
								) : shoppingList.length === 0 ? (
									<div className='flex flex-col items-center gap-2 py-8 text-center'>
										<Check className='size-8 text-green-500' />
										<p className='text-sm font-medium text-text-secondary'>
											{t('allCovered')}
										</p>
									</div>
								) : (
									<ul className='divide-y divide-border-subtle'>
										{shoppingList.map(item => (
											<li
												key={item.ingredient}
												className='flex items-center gap-3 py-2.5'
											>
												<button
													type='button'
													onClick={() => toggleChecked(item.ingredient)}
													className={`flex size-5 items-center justify-center rounded border transition-colors ${
														checkedItems.has(item.ingredient)
															? 'border-brand bg-brand text-white'
															: 'border-border-subtle bg-bg hover:border-brand/50'
													}`}
												>
													{checkedItems.has(item.ingredient) && (
														<Check className='size-3' />
													)}
												</button>
												<div className='flex-1'>
													<span
														className={`font-medium ${
															checkedItems.has(item.ingredient)
																? 'text-text-muted line-through'
																: 'text-text'
														}`}
													>
														{item.ingredient}
													</span>
													{item.quantity && (
														<span className='ml-2 text-xs text-text-secondary'>
															({item.quantity})
														</span>
													)}
												</div>
												<div className='flex flex-wrap gap-1'>
													{item.recipes.map(recipe => (
														<span
															key={recipe}
															className='rounded bg-bg-elevated px-1.5 py-0.5 text-2xs text-text-muted'
														>
															{recipe}
														</span>
													))}
												</div>
											</li>
										))}
									</ul>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* ── Swap Meal Modal ── */}
				<AnimatePresence>
					{swapping && (
						<Portal>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4'
								onClick={() => setSwapping(null)}
							>
								<motion.div
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.95, opacity: 0 }}
									onClick={e => e.stopPropagation()}
									role='dialog'
									aria-modal='true'
									aria-labelledby='swap-meal-title'
									className='flex w-full max-w-md flex-col rounded-xl bg-bg-card shadow-warm'
									style={{ maxHeight: '80vh' }}
								>
									<div className='border-b border-border-subtle p-5'>
										<div className='mb-4 flex items-center justify-between'>
											<div>
												<h3
													className='text-lg font-bold text-text'
													id='swap-meal-title'
												>
													{t('swapMeal')}
												</h3>
												<p className='text-xs text-text-muted'>
													{swapping.day} &middot;{' '}
													{MEAL_LABELS[swapping.type].emoji}{' '}
													{t(MEAL_LABELS[swapping.type].labelKey)}
												</p>
											</div>
											<button
												type='button'
												onClick={() => setSwapping(null)}
												aria-label={t('closeSwapPanel')}
												className='rounded-md p-1.5 text-text-muted hover:bg-bg-elevated'
											>
												<X className='size-4' />
											</button>
										</div>
										<div className='relative'>
											<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
											<input
												ref={swapSearchRef}
												type='text'
												placeholder={t('searchRecipes')}
												value={swapSearch}
												onChange={e => setSwapSearch(e.target.value)}
												aria-label={t('searchRecipes')}
												className='w-full rounded-lg border border-border-subtle bg-bg py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-1 focus-visible:ring-brand/30'
											/>
										</div>
									</div>

									<div className='flex-1 overflow-y-auto p-2'>
										{swapLoading ? (
											<div className='flex items-center justify-center py-8'>
												<Loader2 className='size-5 animate-spin text-brand' />
											</div>
										) : swapResults.length === 0 ? (
											<div className='flex flex-col items-center gap-2 py-8 text-center'>
												<Search className='size-6 text-text-muted/40' />
												<p className='text-sm text-text-muted'>
													{t('noRecipesFound')}
												</p>
											</div>
										) : (
											<div className='space-y-1'>
												{swapResults.map(recipe => (
													<button
														type='button'
														key={recipe.id}
														onClick={() => handleSwapSelect(recipe)}
														disabled={isSwapping}
														className='flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-bg-elevated disabled:opacity-50'
													>
														<div className='flex size-10 items-center justify-center rounded-lg bg-brand/10'>
															<ChefHat className='size-5 text-brand' />
														</div>
														<div className='min-w-0 flex-1'>
															<p className='truncate text-sm font-medium text-text'>
																{recipe.title}
															</p>
															<div className='flex items-center gap-2 text-xs text-text-muted'>
																<span className='flex items-center gap-1'>
																	<Clock className='size-3' />
																	{formatCookingTime(getTotalTime(recipe))}
																</span>
																<span>{recipe.servings} servings</span>
															</div>
														</div>
														{isSwapping && (
															<Loader2 className='size-4 animate-spin text-brand' />
														)}
													</button>
												))}
											</div>
										)}
									</div>
								</motion.div>
							</motion.div>
						</Portal>
					)}
				</AnimatePresence>

				{/* ── Delete Confirmation Dialog ── */}
				<AnimatePresence>
					{confirmingDelete && (
						<Portal>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4'
								onClick={() => setConfirmingDelete(false)}
							>
								<motion.div
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.95, opacity: 0 }}
									onClick={e => e.stopPropagation()}
									role='alertdialog'
									aria-modal='true'
									aria-labelledby='delete-plan-title'
									aria-describedby='delete-plan-desc'
									className='w-full max-w-sm rounded-xl bg-bg-card p-6 shadow-warm'
								>
									<h3
										className='mb-2 text-lg font-bold text-text'
										id='delete-plan-title'
									>
										{t('deletePlanTitle')}
									</h3>
									<p
										className='mb-6 text-sm text-text-muted'
										id='delete-plan-desc'
									>
										{t('deletePlanDesc')}
									</p>
									<div className='flex justify-end gap-3'>
										<button
											type='button'
											onClick={() => setConfirmingDelete(false)}
											className='rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated'
										>
											{t('cancel')}
										</button>
										<button
											type='button'
											onClick={handleDelete}
											disabled={isDeleting}
											className='rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50'
										>
											{isDeleting ? t('deleting') : t('delete')}
										</button>
									</div>
								</motion.div>
							</motion.div>
						</Portal>
					)}
				</AnimatePresence>

				{/* Bottom breathing room for MobileBottomNav */}
				<div className='pb-40 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
