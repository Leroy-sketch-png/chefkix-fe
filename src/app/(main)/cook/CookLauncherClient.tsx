'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
	ArrowRight,
	Bookmark,
	ChefHat,
	Clock,
	Compass,
	Flame,
	Loader2,
	Search,
	Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PATHS } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import { useCookingStore } from '@/store/cookingStore'
import { useUiStore } from '@/store/uiStore'
import { hasActiveCookSession } from './cook-launcher.logic'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Button } from '@/components/ui/button'
import { getTonightsPick, getTrendingRecipes } from '@/services/recipe'
import {
	formatCookingTime,
	getRecipeImage,
	getTotalTime,
	type Recipe,
} from '@/lib/types/recipe'
import { difficultyToDisplay } from '@/lib/apiUtils'
import { logDevError } from '@/lib/dev-log'

const QUICK_COOK_MAX_MINUTES = 30
const LAUNCHPAD_RECIPE_TIMEOUT_MS = 7000

const getRecipeTimeLabel = (recipe: Recipe) => {
	const totalTime = getTotalTime(recipe)
	return totalTime > 0 ? formatCookingTime(totalTime) : null
}

const withLaunchpadTimeout = async <T,>(
	promise: Promise<T>,
	fallback: T,
): Promise<T> => {
	let timeoutId: ReturnType<typeof setTimeout> | undefined
	const timeout = new Promise<T>(resolve => {
		timeoutId = setTimeout(() => resolve(fallback), LAUNCHPAD_RECIPE_TIMEOUT_MS)
	})

	try {
		return await Promise.race([promise, timeout])
	} finally {
		if (timeoutId) clearTimeout(timeoutId)
	}
}

export function CookLauncherClient() {
	const t = useTranslations('common')
	const router = useRouter()
	const launchStartedRef = useRef(false)
	const { isAuthenticated, isHydrated } = useAuth()
	const { session, resumeExistingSession } = useCookingStore()
	const { openCookingPanel, expandCookingPanel } = useUiStore()
	const [isCheckingSession, setIsCheckingSession] = useState(true)
	const [recipesLoading, setRecipesLoading] = useState(false)
	const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([])
	const [recipeLoadFailed, setRecipeLoadFailed] = useState(false)
	const featuredRecipe = recommendedRecipes[0]
	const supportingRecipes = recommendedRecipes.slice(1, 4)

	useEffect(() => {
		if (!isHydrated || launchStartedRef.current) return
		launchStartedRef.current = true

		if (!isAuthenticated) {
			setIsCheckingSession(false)
			return
		}

		const openCookingUi = () => {
			const isDesktop = window.innerWidth >= 1280
			if (isDesktop) {
				openCookingPanel()
			} else {
				expandCookingPanel()
			}
		}

		const launch = async () => {
			const hasStoreSession = hasActiveCookSession(session)
			if (hasStoreSession) {
				setIsCheckingSession(false)
				openCookingUi()
				router.replace(PATHS.DASHBOARD)
				return
			}

			const resumed = await resumeExistingSession()
			setIsCheckingSession(false)
			if (resumed) {
				openCookingUi()
				router.replace(PATHS.DASHBOARD)
				return
			}
		}

		void launch()
	}, [
		isAuthenticated,
		isHydrated,
		router,
		session,
		resumeExistingSession,
		openCookingPanel,
		expandCookingPanel,
	])

	useEffect(() => {
		if (!isHydrated || isCheckingSession) return

		if (!isAuthenticated) {
			setRecommendedRecipes([])
			setRecipeLoadFailed(false)
			setRecipesLoading(false)
			return
		}

		let cancelled = false
		const loadLaunchpadRecipes = async () => {
			setRecipesLoading(true)
			setRecipeLoadFailed(false)

			try {
				const [tonightsPickRes, trendingRes] = await Promise.all([
					withLaunchpadTimeout(
						getTonightsPick({ timeoutMs: 6000 }).catch(err => {
							logDevError('Cook launcher: failed to load tonight pick', err)
							return null
						}),
						null,
					),
					withLaunchpadTimeout(
						getTrendingRecipes({ limit: 4 }).catch(err => {
							logDevError(
								'Cook launcher: failed to load trending recipes',
								err,
							)
							return null
						}),
						null,
					),
				])

				if (cancelled) return

				const recipesById = new Map<string, Recipe>()
				const tonightsPick = tonightsPickRes?.success
					? tonightsPickRes.data?.recipe
					: null
				if (tonightsPick?.id) {
					recipesById.set(tonightsPick.id, tonightsPick)
				}

				for (const recipe of trendingRes?.data ?? []) {
					if (recipe?.id && !recipesById.has(recipe.id)) {
						recipesById.set(recipe.id, recipe)
					}
				}

				const recipes = Array.from(recipesById.values()).slice(0, 4)
				setRecommendedRecipes(recipes)
				setRecipeLoadFailed(recipes.length === 0)
			} finally {
				if (!cancelled) {
					setRecipesLoading(false)
				}
			}
		}

		void loadLaunchpadRecipes()

		return () => {
			cancelled = true
		}
	}, [isAuthenticated, isHydrated, isCheckingSession])

	if (!isHydrated || isCheckingSession) {
		return (
			<PageTransition>
				<PageContainer maxWidth='md'>
					<div className='mx-auto mt-16 rounded-2xl border border-border-subtle bg-bg-card p-8 text-center shadow-card'>
						<Loader2 className='mx-auto mb-4 size-8 animate-spin text-brand' />
						<p className='text-sm font-semibold uppercase tracking-widest text-text-muted'>
							{t('startCooking')}
						</p>
						<h1 className='mt-2 text-2xl font-black text-text-primary'>
							{t('cookLauncherPreparingKitchen')}
						</h1>
					</div>
				</PageContainer>
			</PageTransition>
		)
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='xl'>
				<div className='mx-auto mt-6 max-w-6xl pb-10 md:mt-10'>
					<div className='mb-6'>
						<p className='text-xs font-semibold uppercase tracking-widest text-text-muted'>
							{t('startCooking')}
						</p>
						<h1 className='mt-2 text-3xl font-black tracking-tight text-text-primary md:text-4xl'>
							{t('cookLauncherChooseNextCook')}
						</h1>
						<p className='mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base'>
							{t('cookLauncherNoActiveSession')}
						</p>
					</div>

					<div className='grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]'>
						<section className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card'>
							{recipesLoading ? (
								<div className='grid min-h-[16rem] place-items-center p-6 text-center md:min-h-[23rem] md:p-8'>
									<div>
										<Loader2 className='mx-auto mb-4 size-8 animate-spin text-brand' />
										<h2 className='text-xl font-black text-text-primary'>
											{t('cookLauncherFindingBestCook')}
										</h2>
										<p className='mt-2 text-sm text-text-secondary'>
											{t('cookLauncherFindingBestCookDesc')}
										</p>
									</div>
								</div>
							) : featuredRecipe ? (
								<div className='grid min-h-[16rem] md:min-h-[23rem] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]'>
									<Link
										href={`/recipes/${featuredRecipe.id}?cook=true`}
										className='group relative block min-h-[14rem] overflow-hidden bg-bg-elevated md:min-h-full'
									>
										<Image
											src={getRecipeImage(featuredRecipe)}
											alt={featuredRecipe.title}
											fill
											className='object-cover transition-transform duration-500 group-hover:scale-105'
											sizes='(max-width: 768px) 100vw, 45vw'
										/>
										<div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent' />
										<div className='absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white'>
											<span className='rounded-full bg-black/45 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-sm'>
												{t('cookLauncherBestNextCook')}
											</span>
											<span className='rounded-full bg-brand px-3 py-1 text-xs font-bold shadow-card'>
												{t('cookLauncherCookNow')}
											</span>
										</div>
									</Link>

									<div className='flex flex-col justify-between p-6 md:p-8'>
										<div>
											<div className='mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted'>
												{getRecipeTimeLabel(featuredRecipe) && (
													<span className='inline-flex items-center gap-1 rounded-full bg-bg-elevated px-3 py-1'>
														<Clock className='size-3.5 text-brand' />
														{getRecipeTimeLabel(featuredRecipe)}
													</span>
												)}
												<span className='inline-flex items-center gap-1 rounded-full bg-bg-elevated px-3 py-1'>
													<Flame className='size-3.5 text-streak' />
													{difficultyToDisplay(featuredRecipe.difficulty)}
												</span>
												{featuredRecipe.xpReward > 0 && (
													<span className='inline-flex items-center gap-1 rounded-full bg-xp/10 px-3 py-1 text-xp'>
														+{featuredRecipe.xpReward} XP
													</span>
												)}
											</div>

											<h2 className='text-2xl font-black leading-tight text-text-primary md:text-3xl'>
												{featuredRecipe.title}
											</h2>
											<p className='mt-3 line-clamp-3 text-sm leading-relaxed text-text-secondary md:text-base'>
												{featuredRecipe.description ||
													t('cookLauncherFeaturedFallbackDesc')}
											</p>
										</div>

										<div className='mt-6 flex flex-col gap-3 sm:flex-row'>
											<Button
												asChild
												variant='brand'
												className='h-11 rounded-xl px-5 font-bold'
											>
												<Link href={`/recipes/${featuredRecipe.id}?cook=true`}>
													{t('cookLauncherCookThis')}
													<ArrowRight className='ml-2 size-4' />
												</Link>
											</Button>
											<Button
												asChild
												variant='outline'
												className='h-11 rounded-xl px-5 font-semibold'
											>
												<Link href={`/recipes/${featuredRecipe.id}`}>
													{t('cookLauncherPreviewRecipe')}
												</Link>
											</Button>
										</div>
									</div>
								</div>
							) : (
								<div className='grid min-h-[16rem] place-items-center p-6 text-center md:min-h-[23rem] md:p-8'>
									<div className='max-w-md'>
										<Search className='mx-auto mb-4 size-9 text-brand' />
										<h2 className='text-xl font-black text-text-primary'>
											{t('cookLauncherNoRecipeTitle')}
										</h2>
										<p className='mt-2 text-sm text-text-secondary'>
											{recipeLoadFailed
												? t('cookLauncherRecipeLoadFailed')
												: t('cookLauncherNoRecipeDesc')}
										</p>
									</div>
								</div>
							)}
						</section>

						<aside className='grid gap-3'>
							<Link
								href={`${PATHS.SEARCH}?q=${QUICK_COOK_MAX_MINUTES}%20minute%20recipes&from=cook-launcher`}
								className='group rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card transition-colors hover:bg-bg-hover'
							>
								<div className='flex items-start justify-between gap-4'>
									<div>
										<div className='mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-brand/10'>
											<Clock className='size-5 text-brand' />
										</div>
										<h3 className='font-bold text-text-primary'>
											{t('cookLauncherQuickCookTitle')}
										</h3>
										<p className='mt-1 text-sm leading-relaxed text-text-secondary'>
											{t('cookLauncherQuickCookDesc', {
												minutes: QUICK_COOK_MAX_MINUTES,
											})}
										</p>
									</div>
									<ArrowRight className='mt-1 size-5 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand' />
								</div>
							</Link>

							<Link
								href={`${PATHS.EXPLORE}?from=cook-launcher`}
								className='group rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card transition-colors hover:bg-bg-hover'
							>
								<div className='flex items-start justify-between gap-4'>
									<div>
										<div className='mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-info/10'>
											<Compass className='size-5 text-info' />
										</div>
										<h3 className='font-bold text-text-primary'>
											{t('cookLauncherFindRecipe')}
										</h3>
										<p className='mt-1 text-sm leading-relaxed text-text-secondary'>
											{t('cookLauncherFindRecipeDesc')}
										</p>
									</div>
									<ArrowRight className='mt-1 size-5 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand' />
								</div>
							</Link>

							<Link
								href='/cook-together'
								className='group rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card transition-colors hover:bg-bg-hover'
							>
								<div className='flex items-start justify-between gap-4'>
									<div>
										<div className='mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-streak/10'>
											<Users className='size-5 text-streak' />
										</div>
										<h3 className='font-bold text-text-primary'>
											{t('cookLauncherStartCookTogether')}
										</h3>
										<p className='mt-1 text-sm leading-relaxed text-text-secondary'>
											{t('cookLauncherStartCookTogetherDesc')}
										</p>
									</div>
									<ArrowRight className='mt-1 size-5 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand' />
								</div>
							</Link>

							{supportingRecipes.length > 0 && (
								<div className='rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card'>
									<div className='mb-4 flex items-center gap-2'>
										<Bookmark className='size-4 text-brand' />
										<h3 className='text-sm font-bold text-text-primary'>
											{t('cookLauncherMoreReady')}
										</h3>
									</div>
									<div className='grid gap-2'>
										{supportingRecipes.map(recipe => (
											<Link
												key={recipe.id}
												href={`/recipes/${recipe.id}?cook=true`}
												className='flex items-center justify-between gap-3 rounded-xl bg-bg-elevated px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-hover'
											>
												<span className='line-clamp-1'>{recipe.title}</span>
												<span className='shrink-0 text-xs text-text-muted'>
													{getRecipeTimeLabel(recipe) || t('cookLauncherCookNow')}
												</span>
											</Link>
										))}
									</div>
								</div>
							)}
						</aside>
					</div>
				</div>
			</PageContainer>
		</PageTransition>
	)
}
