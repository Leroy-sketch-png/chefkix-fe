'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
	Check,
	ChefHat,
	Clock3,
	Copy,
	Loader2,
	Minus,
	Plus,
	RefreshCw,
	ShoppingBasket,
	Sparkles,
	Users,
	Utensils,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { Switch } from '@/components/ui/switch'
import { createCookPlan, getCurrentCookPlan } from '@/services/cookplan'
import { getAllSettings } from '@/services/settings'
import type { CookPlan, CookPlanMode, MealRole } from '@/lib/types/cookplan'

const MODES: CookPlanMode[] = ['COOK_ONCE_TODAY', 'DINNER_WITH_LEFTOVERS']

function localDateKey() {
	const now = new Date()
	const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
	return local.toISOString().slice(0, 10)
}

function mealRoleLabel(role: MealRole) {
	return role.charAt(0) + role.slice(1).toLowerCase()
}

export default function MealPlannerPage() {
	const t = useTranslations('mealPlanner')
	const planDate = useMemo(localDateKey, [])
	const [mode, setMode] = useState<CookPlanMode>('COOK_ONCE_TODAY')
	const [householdSize, setHouseholdSize] = useState(2)
	const [maxActiveMinutes, setMaxActiveMinutes] = useState(60)
	const [pantryFirst, setPantryFirst] = useState(true)
	const [plan, setPlan] = useState<CookPlan | null>(null)
	const [loading, setLoading] = useState(true)
	const [generating, setGenerating] = useState(false)
	const [copied, setCopied] = useState(false)
	const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const [currentPlan, settingsResponse] = await Promise.all([
				getCurrentCookPlan(planDate),
				getAllSettings(),
			])
			setPlan(currentPlan)
			if (currentPlan) {
				setMode(currentPlan.mode)
				setHouseholdSize(currentPlan.householdSize)
				setMaxActiveMinutes(currentPlan.maxActiveMinutes)
				setPantryFirst(currentPlan.pantryFirst)
			} else if (settingsResponse.success && settingsResponse.data?.cooking) {
				const cooking = settingsResponse.data.cooking
				setHouseholdSize(
					Math.min(12, Math.max(1, cooking.defaultServings || 2)),
				)
				if (cooking.maxCookingTimeMinutes) {
					setMaxActiveMinutes(
						Math.min(240, Math.max(15, cooking.maxCookingTimeMinutes)),
					)
				}
			}
		} catch {
			toast.error(t('failedLoad'))
		} finally {
			setLoading(false)
		}
	}, [planDate, t])

	useEffect(() => {
		void load()
	}, [load])

	useEffect(() => {
		if (!copied) return
		const timeout = window.setTimeout(() => setCopied(false), 2000)
		return () => window.clearTimeout(timeout)
	}, [copied])

	const generate = async () => {
		setGenerating(true)
		setCheckedItems(new Set())
		try {
			const nextPlan = await createCookPlan({
				planDate,
				mode,
				householdSize,
				maxActiveMinutes,
				pantryFirst,
			})
			setPlan(nextPlan)
			if (nextPlan.cookBatches.length > 0) {
				toast.success(t('todayPlanGenerated'))
			}
		} catch {
			toast.error(t('failedGenerate'))
		} finally {
			setGenerating(false)
		}
	}

	const copyShoppingList = async () => {
		if (!plan) return
		const text = plan.shoppingList
			.map(item =>
				[item.quantity, item.unit, item.ingredient].filter(Boolean).join(' '),
			)
			.join('\n')
		try {
			await navigator.clipboard.writeText(text)
			setCopied(true)
		} catch {
			toast.error(t('failedCopy'))
		}
	}

	const toggleShoppingItem = (ingredient: string) => {
		setCheckedItems(current => {
			const next = new Set(current)
			if (next.has(ingredient)) next.delete(ingredient)
			else next.add(ingredient)
			return next
		})
	}

	const hasPlan = Boolean(plan?.cookBatches.length)
	const planMatchesControls = Boolean(
		plan &&
			plan.mode === mode &&
			plan.householdSize === householdSize &&
			plan.maxActiveMinutes === maxActiveMinutes &&
			plan.pantryFirst === pantryFirst,
	)
	const hasPendingChanges = Boolean(plan) && !planMatchesControls
	const showPlan = hasPlan && planMatchesControls && !generating
	const batch = plan?.cookBatches[0]

	if (loading) {
		return (
			<PageTransition>
				<PageContainer maxWidth='xl' className='px-4 py-6 sm:px-6'>
					<div className='space-y-4'>
						<div className='h-14 animate-pulse rounded-lg bg-bg-elevated' />
						<div className='h-48 animate-pulse rounded-lg bg-bg-elevated' />
						<div className='grid gap-3 md:grid-cols-3'>
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={index}
									className='h-64 animate-pulse rounded-lg bg-bg-elevated'
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
			<PageContainer maxWidth='xl' className='px-4 py-6 sm:px-6'>
				<div className='space-y-6'>
					<header className='flex flex-col gap-2 border-b border-border-subtle pb-5 sm:flex-row sm:items-end sm:justify-between'>
						<div>
							<p className='text-xs font-semibold uppercase text-brand'>
								{t('planTodayEyebrow')}
							</p>
							<h1 className='text-2xl font-bold text-text-primary sm:text-3xl'>
								{t('planTodayTitle')}
							</h1>
							<p className='mt-1 max-w-2xl text-sm text-text-muted'>
								{t('planTodaySubtitle')}
							</p>
						</div>
						<div className='text-sm font-medium text-text-secondary'>
							{new Intl.DateTimeFormat(undefined, {
								weekday: 'long',
								month: 'long',
								day: 'numeric',
							}).format(new Date(`${planDate}T12:00:00`))}
						</div>
					</header>

					<section
						aria-labelledby='plan-controls-title'
						aria-busy={generating}
						className='border-b border-border-subtle pb-6'
					>
						<div className='mb-4 flex items-center justify-between gap-3'>
							<div>
								<h2
									id='plan-controls-title'
									className='text-base font-semibold text-text-primary'
								>
									{t('choosePlanShape')}
								</h2>
								<p className='text-sm text-text-muted'>
									{t('constraintsFromSettings')}
								</p>
							</div>
							<Button onClick={generate} disabled={generating}>
								{generating ? (
									<Loader2 className='animate-spin' />
								) : hasPlan ? (
									<RefreshCw />
								) : (
									<Sparkles />
								)}
								{generating
									? t('buildingPlan')
									: hasPendingChanges
										? t('applyChanges')
										: hasPlan
											? t('rebuildToday')
											: t('buildToday')}
							</Button>
						</div>

						<div className='grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]'>
							<div
								role='radiogroup'
								aria-label={t('planMode')}
								className='grid grid-cols-2 rounded-lg border border-border-medium bg-bg-elevated p-1'
							>
								{MODES.map(option => (
									<button
										key={option}
										type='button'
										role='radio'
										aria-checked={mode === option}
										disabled={generating}
										onClick={() => setMode(option)}
										className={`min-h-20 rounded-md px-3 py-3 text-left transition-colors disabled:cursor-wait disabled:opacity-60 ${
											mode === option
												? 'bg-bg-card text-text-primary shadow-card'
												: 'text-text-secondary hover:text-text-primary'
										}`}
									>
										<span className='block text-sm font-semibold'>
											{option === 'COOK_ONCE_TODAY'
												? t('cookOnceToday')
												: t('dinnerLeftovers')}
										</span>
										<span className='mt-1 block text-xs leading-5 text-text-muted'>
											{option === 'COOK_ONCE_TODAY'
												? t('cookOnceTodayDesc')
												: t('dinnerLeftoversDesc')}
										</span>
									</button>
								))}
							</div>

							<div className='grid gap-4 sm:grid-cols-3 lg:grid-cols-1'>
								<div className='flex items-center justify-between gap-3'>
									<div className='flex items-center gap-2'>
										<Users className='size-4 text-text-muted' />
										<span className='text-sm font-medium text-text-primary'>
											{t('household')}
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<Button
											variant='outline'
											size='icon'
											aria-label={t('decreaseHousehold')}
											disabled={generating || householdSize <= 1}
											onClick={() =>
												setHouseholdSize(value => Math.max(1, value - 1))
											}
										>
											<Minus />
										</Button>
										<span className='w-8 text-center font-semibold tabular-nums text-text-primary'>
											{householdSize}
										</span>
										<Button
											variant='outline'
											size='icon'
											aria-label={t('increaseHousehold')}
											disabled={generating || householdSize >= 12}
											onClick={() =>
												setHouseholdSize(value => Math.min(12, value + 1))
											}
										>
											<Plus />
										</Button>
									</div>
								</div>

								<label className='block'>
									<span className='mb-2 flex items-center justify-between gap-3 text-sm font-medium text-text-primary'>
										<span className='flex items-center gap-2'>
											<Clock3 className='size-4 text-text-muted' />
											{t('activeTime')}
										</span>
										<span className='tabular-nums'>
											{t('minutesShort', { count: maxActiveMinutes })}
										</span>
									</span>
									<input
										type='range'
										min={15}
										max={180}
										step={15}
										value={maxActiveMinutes}
										disabled={generating}
										onChange={event =>
											setMaxActiveMinutes(Number(event.target.value))
										}
										className='w-full accent-brand disabled:cursor-wait disabled:opacity-60'
									/>
								</label>

								<div className='flex items-center justify-between gap-3'>
									<div>
										<p className='text-sm font-medium text-text-primary'>
											{t('pantryFirst')}
										</p>
										<p className='text-xs text-text-muted'>
											{t('pantryFirstDesc')}
										</p>
									</div>
									<Switch
										checked={pantryFirst}
										disabled={generating}
										onCheckedChange={setPantryFirst}
									/>
								</div>
							</div>
						</div>
					</section>

					{generating ? (
						<section
							role='status'
							aria-live='polite'
							className='flex min-h-48 flex-col items-center justify-center border border-border-medium bg-bg-elevated/40 px-6 py-10 text-center'
						>
							<Loader2 className='size-8 animate-spin text-brand' />
							<h2 className='mt-3 text-lg font-semibold text-text-primary'>
								{t('buildingPlan')}
							</h2>
							<p className='mt-1 max-w-xl text-sm text-text-muted'>
								{t('buildingPlanDesc')}
							</p>
						</section>
					) : null}

					{hasPendingChanges && !generating ? (
						<section
							role='status'
							className='flex min-h-48 flex-col items-center justify-center border border-brand/30 bg-brand/5 px-6 py-10 text-center'
						>
							<RefreshCw className='size-8 text-brand' />
							<h2 className='mt-3 text-lg font-semibold text-text-primary'>
								{t('changesPending')}
							</h2>
							<p className='mt-1 max-w-xl text-sm text-text-muted'>
								{t('changesPendingDesc')}
							</p>
						</section>
					) : null}

					{plan && !hasPlan && planMatchesControls && !generating ? (
						<section className='border-l-4 border-warning bg-warning/5 px-5 py-4'>
							<h2 className='font-semibold text-text-primary'>
								{t('noSafePlan')}
							</h2>
							<p className='mt-1 text-sm text-text-muted'>
								{t('noSafePlanDesc')}
							</p>
							<ul className='mt-3 space-y-2'>
								{plan.unmetConstraints.map(constraint => (
									<li
										key={constraint}
										className='flex gap-2 text-sm text-text-secondary'
									>
										<span aria-hidden='true'>-</span>
										<span>{constraint}</span>
									</li>
								))}
							</ul>
						</section>
					) : null}

					{!plan && !generating ? (
						<section className='flex min-h-48 flex-col items-center justify-center border border-dashed border-border-medium px-6 py-10 text-center'>
							<ChefHat className='size-10 text-text-muted' />
							<h2 className='mt-3 text-lg font-semibold text-text-primary'>
								{t('oneBatchNotTwentyOneMeals')}
							</h2>
							<p className='mt-1 max-w-xl text-sm text-text-muted'>
								{t('emptyTodayDesc')}
							</p>
						</section>
					) : null}

					{showPlan && batch ? (
						<>
							<section className='grid gap-4 border-b border-border-subtle pb-6 md:grid-cols-[1fr_auto] md:items-end'>
								<div>
									<p className='text-xs font-semibold uppercase text-success'>
										{t('todayCoverage')}
									</p>
									<h2 className='mt-1 text-xl font-bold text-text-primary'>
										{batch.title}
									</h2>
									<div className='mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary'>
										<span className='flex items-center gap-1.5'>
											<Clock3 className='size-4 text-text-muted' />
											{t('activeMinutesSummary', {
												active: batch.activeMinutes,
												budget: plan?.maxActiveMinutes ?? maxActiveMinutes,
											})}
										</span>
										<span className='flex items-center gap-1.5'>
											<Utensils className='size-4 text-text-muted' />
											{t('dishCount', { count: batch.dishes.length })}
										</span>
									</div>
								</div>
								<div className='flex flex-wrap gap-2'>
									{plan?.eatingOccasions.map(occasion => (
										<span
											key={occasion.name}
											className='rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm font-medium text-text-primary'
										>
											{occasion.name} - {occasion.servings}
										</span>
									))}
								</div>
							</section>

							<section aria-labelledby='planned-dishes-title'>
								<div className='mb-3 flex items-center justify-between'>
									<h2
										id='planned-dishes-title'
										className='text-base font-semibold text-text-primary'
									>
										{t('plannedDishes')}
									</h2>
									<span className='text-xs text-text-muted'>
										{t('everyDishCookable')}
									</span>
								</div>
								<div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
									{batch.dishes.map(dish => (
										<Link
											key={dish.recipeId}
											href={`/recipes/${dish.recipeId}`}
											className='group overflow-hidden rounded-lg border border-border-subtle bg-bg-card transition-colors hover:border-brand/40'
										>
											<div className='relative aspect-video overflow-hidden bg-bg-elevated'>
												<ImageWithFallback
													src={dish.coverImageUrl || ''}
													alt={dish.title}
													fill
													fallbackType='recipe'
													className='object-cover transition-transform duration-300 group-hover:scale-[1.02]'
												/>
											</div>
											<div className='p-4'>
												<div className='flex items-start justify-between gap-3'>
													<div>
														<h3 className='font-semibold leading-5 text-text-primary group-hover:text-brand'>
															{dish.title}
														</h3>
														{dish.cuisineType ? (
															<p className='mt-1 text-xs text-text-muted'>
																{dish.cuisineType} -{' '}
																{mealRoleLabel(dish.mealRole)}
															</p>
														) : null}
													</div>
													<ChefHat className='size-4 shrink-0 text-brand' />
												</div>
												<div className='mt-4 grid grid-cols-3 gap-2 border-t border-border-subtle pt-3 text-xs'>
													<div>
														<p className='text-text-muted'>{t('active')}</p>
														<p className='mt-0.5 font-semibold text-text-primary'>
															{t('minutesShort', {
																count: dish.activeMinutes,
															})}
														</p>
													</div>
													<div>
														<p className='text-text-muted'>{t('yield')}</p>
														<p className='mt-0.5 font-semibold text-text-primary'>
															{dish.plannedServings}
														</p>
													</div>
													<div>
														<p className='text-text-muted'>{t('fromPantry')}</p>
														<p className='mt-0.5 font-semibold text-text-primary'>
															{dish.pantryIngredientCount}
														</p>
													</div>
												</div>
											</div>
										</Link>
									))}
								</div>
							</section>

							<section
								aria-labelledby='shopping-title'
								className='border-t border-border-subtle pt-6'
							>
								<div className='mb-3 flex items-center justify-between gap-3'>
									<div>
										<h2
											id='shopping-title'
											className='flex items-center gap-2 text-base font-semibold text-text-primary'
										>
											<ShoppingBasket className='size-4 text-brand' />
											{t('shoppingAdditions')}
										</h2>
										<p className='text-sm text-text-muted'>
											{t('scaledForHousehold', {
												count: plan?.householdSize ?? householdSize,
											})}
										</p>
									</div>
									<Button
										variant='outline'
										size='sm'
										onClick={copyShoppingList}
										disabled={!plan?.shoppingList.length}
									>
										{copied ? <Check /> : <Copy />}
										{copied ? t('copied') : t('copyList')}
									</Button>
								</div>

								{plan?.shoppingList.length === 0 ? (
									<div className='flex items-center gap-2 border border-success/30 bg-success/5 px-4 py-3 text-sm text-text-secondary'>
										<Check className='size-4 text-success' />
										{t('allCovered')}
									</div>
								) : (
									<ul className='grid gap-x-6 md:grid-cols-2'>
										{plan?.shoppingList.map(item => {
											const checked = checkedItems.has(item.ingredient)
											return (
												<li
													key={`${item.ingredient}-${item.unit || ''}`}
													className='flex items-center gap-3 border-b border-border-subtle py-3'
												>
													<button
														type='button'
														aria-label={t('toggleShoppingItem', {
															item: item.ingredient,
														})}
														aria-pressed={checked}
														onClick={() => toggleShoppingItem(item.ingredient)}
														className={`flex size-5 shrink-0 items-center justify-center rounded border ${
															checked
																? 'border-brand bg-brand text-white'
																: 'border-border-medium bg-bg-card'
														}`}
													>
														{checked ? <Check className='size-3' /> : null}
													</button>
													<div className='min-w-0 flex-1'>
														<p
															className={`text-sm font-medium ${
																checked
																	? 'text-text-muted line-through'
																	: 'text-text-primary'
															}`}
														>
															{[item.quantity, item.unit, item.ingredient]
																.filter(Boolean)
																.join(' ')}
														</p>
														<p className='truncate text-xs text-text-muted'>
															{item.sourceRecipes.join(', ')}
														</p>
													</div>
												</li>
											)
										})}
									</ul>
								)}
							</section>
						</>
					) : null}

					<div className='pb-[calc(var(--h-mobile-nav)+var(--space-8))] md:pb-4' />
				</div>
			</PageContainer>
		</PageTransition>
	)
}
