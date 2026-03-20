'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { TRANSITION_SPRING, CARD_HOVER } from '@/lib/motion'
import {
	generateMealPlan,
	getCurrentMealPlan,
	deleteMealPlan,
	getShoppingList,
} from '@/services/mealplan'
import type {
	MealPlan,
	PlannedDay,
	PlannedMeal,
	ShoppingItem,
} from '@/lib/types/mealplan'
import { toast } from 'sonner'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const
type MealType = (typeof MEAL_TYPES)[number]

const MEAL_LABELS: Record<MealType, { label: string; emoji: string }> = {
	breakfast: { label: 'Breakfast', emoji: '🌅' },
	lunch: { label: 'Lunch', emoji: '☀️' },
	dinner: { label: 'Dinner', emoji: '🌙' },
}

export default function MealPlannerPage() {
	const router = useRouter()
	const [plan, setPlan] = useState<MealPlan | null>(null)
	const [loading, setLoading] = useState(true)
	const [generating, setGenerating] = useState(false)
	const [showShopping, setShowShopping] = useState(false)
	const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
	const [loadingShopping, setLoadingShopping] = useState(false)
	const [copiedList, setCopiedList] = useState(false)
	const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [useAI, setUseAI] = useState(false)

	// ── Fetch current plan ────────────────────────────────

	const fetchPlan = useCallback(async () => {
		try {
			const data = await getCurrentMealPlan()
			setPlan(data)
		} catch {
			// No plan for this week
			setPlan(null)
		} finally {
			setLoading(false)
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
		} catch {
			toast.error('Failed to generate meal plan')
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
			toast.success('Meal plan deleted')
		} catch {
			toast.error('Failed to delete meal plan')
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
			toast.error('Failed to load shopping list')
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
			setTimeout(() => setCopiedList(false), 2000)
		} catch {
			toast.error('Failed to copy to clipboard')
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

	// ── Helpers ───────────────────────────────────────────

	const getMeal = (day: PlannedDay, type: MealType): PlannedMeal | null => {
		return day[type] ?? null
	}

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

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<div className='space-y-6 py-6'>
					{/* ── Header ────────────────────────── */}
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<CalendarDays className='size-7 text-brand' />
							<h1 className='text-2xl font-bold text-text'>Meal Planner</h1>
						</div>
						<div className='flex items-center gap-2'>
							{plan && (
								<>
									<button
										onClick={handleShowShopping}
										className='flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated/80'
									>
										<ShoppingCart className='size-4' />
										Shopping List
									</button>
									<button
										onClick={() => setConfirmingDelete(true)}
										className='flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20'
									>
										<Trash2 className='size-4' />
										Clear
									</button>
								</>
							)}
							<button
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
								{useAI ? 'AI Mode' : 'Quick Mode'}
							</button>
							<button
								onClick={handleGenerate}
								disabled={generating}
								className='flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50'
							>
								{generating ? (
									<RefreshCw className='size-4 animate-spin' />
								) : (
									<ChefHat className='size-4' />
								)}
								{plan ? 'Regenerate' : 'Generate Plan'}
							</button>
						</div>
					</div>

					{/* ── AI Reasoning Banner ───────────── */}
					{plan?.reasoning && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className='flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4'
						>
							<Sparkles className='mt-0.5 size-4 flex-shrink-0 text-brand' />
							<div className='flex-1'>
								<p className='text-sm text-text'>{plan.reasoning}</p>
								{plan.pantryUtilizationPercent != null &&
									plan.pantryUtilizationPercent > 0 && (
										<p className='mt-1 text-xs text-text-muted'>
											Pantry utilization:{' '}
											{Math.round(plan.pantryUtilizationPercent)}%
										</p>
									)}
							</div>
						</motion.div>
					)}

					{/* ── No Plan State ─────────────────── */}
					{!plan ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className='flex flex-col items-center justify-center gap-4 py-20'
						>
							<CalendarDays className='size-16 text-text-muted/40' />
							<h2 className='text-lg font-semibold text-text-secondary'>
								No meal plan yet
							</h2>
							<p className='max-w-sm text-center text-sm text-text-muted'>
								Click &ldquo;Generate Plan&rdquo; to create a 7-day meal plan
								based on your pantry and preferences.
							</p>
						</motion.div>
					) : (
						/* ── 7-Day Grid ──────────────────── */
						<div className='overflow-x-auto'>
							<div className='min-w-[900px]'>
								{/* Day Headers */}
								<div className='mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-2'>
									<div /> {/* spacer */}
									{plan.days.map(day => (
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
												{MEAL_LABELS[mealType].label}
											</span>
										</div>
										{plan.days.map(day => {
											const meal = getMeal(day, mealType)
											return (
												<motion.button
													key={`${day.dayOfWeek}-${mealType}`}
													whileHover={CARD_HOVER}
													onClick={() =>
														meal?.recipeId &&
														router.push(`/recipes/${meal.recipeId}`)
													}
													className='group rounded-xl border border-border-subtle bg-bg-card p-3 text-left shadow-card transition-colors hover:border-brand/30'
												>
													{meal ? (
														<>
															<p className='line-clamp-2 text-xs font-medium text-text'>
																{meal.title}
															</p>
															<div className='mt-1.5 flex items-center gap-1.5 text-[10px] text-text-muted'>
																<Clock className='size-3' />
																{meal.totalTimeMinutes}m
																{meal.aiGenerated && (
																	<span className='rounded bg-info/10 px-1 py-0.5 text-info'>
																		AI
																	</span>
																)}
															</div>
														</>
													) : (
														<p className='text-xs text-text-muted/50'>—</p>
													)}
												</motion.button>
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
											Shopping List
										</h2>
										{shoppingList.length > 0 && (
											<span className='rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-secondary'>
												{shoppingList.length} items
											</span>
										)}
									</div>
									<div className='flex items-center gap-2'>
										<button
											onClick={copyShoppingList}
											className='flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-elevated/80'
										>
											{copiedList ? (
												<Check className='size-3.5' />
											) : (
												<Copy className='size-3.5' />
											)}
											{copiedList ? 'Copied!' : 'Copy List'}
										</button>
										<button
											onClick={() => setShowShopping(false)}
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
									<p className='py-8 text-center text-sm text-text-muted'>
										You have everything you need! No missing ingredients.
									</p>
								) : (
									<ul className='divide-y divide-border-subtle'>
										{shoppingList.map(item => (
											<li
												key={item.ingredient}
												className='flex items-center gap-3 py-2.5'
											>
												<button
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
															className='rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted'
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

				{/* ── Delete Confirmation Dialog ── */}
				<AnimatePresence>
					{confirmingDelete && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
							onClick={() => setConfirmingDelete(false)}
						>
							<motion.div
								initial={{ scale: 0.95, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.95, opacity: 0 }}
								onClick={e => e.stopPropagation()}
								className='w-full max-w-sm rounded-xl bg-bg-card p-6 shadow-warm'
							>
								<h3 className='mb-2 text-lg font-bold text-text'>
									Delete Meal Plan?
								</h3>
								<p className='mb-6 text-sm text-text-muted'>
									This will permanently delete your current meal plan and all
									associated meals. This action cannot be undone.
								</p>
								<div className='flex justify-end gap-3'>
									<button
										onClick={() => setConfirmingDelete(false)}
										className='rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated'
									>
										Cancel
									</button>
									<button
										onClick={handleDelete}
										disabled={isDeleting}
										className='rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50'
									>
										{isDeleting ? 'Deleting...' : 'Delete'}
									</button>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</PageContainer>
		</PageTransition>
	)
}
