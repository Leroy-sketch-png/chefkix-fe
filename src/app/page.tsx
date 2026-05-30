'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ChefHat,
	Sparkles,
	Clock,
	Flame,
	ArrowRight,
	Play,
	TrendingUp,
	Search,
	Timer,
	Trophy,
	Zap,
	AlertTriangle,
	RefreshCw,
	CheckCircle2,
	X,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
	TRANSITION_SPRING,
	ICON_BUTTON_HOVER,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import { cn } from '@/lib/utils'
import { getTrendingRecipes } from '@/services/recipe'
import { Recipe, formatCookingTime } from '@/lib/types/recipe'
import { difficultyToDisplay } from '@/lib/apiUtils'
import { logDevError } from '@/lib/dev-log'
import { TextLoop } from '@/components/ui/text-loop'
import { HighlightOnScroll } from '@/components/ui/highlight-on-scroll'
import { AnnouncementBanner } from '@/components/ui/announcement-banner'
import { NoiseOverlay } from '@/components/ui/noise-overlay'
import { TextReveal } from '@/components/ui/text-reveal'
import { SpotlightCards } from '@/components/ui/spotlight-cards'
import { WavyBackground } from '@/components/ui/wavy-background'
import { MagicCard } from '@/components/ui/magic-card'
import { Button } from '@/components/ui/button'

// ============================================
// TYPES
// ============================================

interface FeatureHighlight {
	icon: typeof Timer
	titleKey: string
	descriptionKey: string
	accent: string
	iconColor: string
}

interface LandingPathway {
	icon: typeof Timer
	titleKey: string
	descriptionKey: string
	href: string
	accent: string
	iconColor: string
}

// ============================================
// DATA - Features are REAL product capabilities, not fake stats
// ============================================

const featureHighlights: FeatureHighlight[] = [
	{
		icon: TrendingUp,
		titleKey: 'realFoodFeedTitle',
		descriptionKey: 'realFoodFeedDesc',
		accent: 'bg-info/10',
		iconColor: 'text-info',
	},
	{
		icon: Sparkles,
		titleKey: 'saveWhatHitsTitle',
		descriptionKey: 'saveWhatHitsDesc',
		accent: 'bg-streak/10',
		iconColor: 'text-streak',
	},
	{
		icon: ChefHat,
		titleKey: 'cookWhenReadyTitle',
		descriptionKey: 'cookWhenReadyDesc',
		accent: 'bg-xp/10',
		iconColor: 'text-xp',
	},
]

const discoveryPillKeys = [
	'heroPillQuickTips',
	'heroPillRecentCooks',
	'heroPillReviews',
	'heroPillBattles',
	'heroPillPolls',
] as const

const landingPathways: LandingPathway[] = [
	{
		icon: Sparkles,
		titleKey: 'entryCommunityTitle',
		descriptionKey: 'entryCommunityDesc',
		href: '/community',
		accent: 'bg-streak/10',
		iconColor: 'text-streak',
	},
	{
		icon: Search,
		titleKey: 'entrySearchTitle',
		descriptionKey: 'entrySearchDesc',
		href: '/search',
		accent: 'bg-info/10',
		iconColor: 'text-info',
	},
	{
		icon: TrendingUp,
		titleKey: 'entryExploreTitle',
		descriptionKey: 'entryExploreDesc',
		href: '/explore',
		accent: 'bg-brand/10',
		iconColor: 'text-brand',
	},
]

// ============================================
// COMPONENTS
// ============================================

const FeatureCard = ({
	feature,
	index,
	title,
	description,
}: {
	feature: FeatureHighlight
	index: number
	title: string
	description: string
}) => {
	const Icon = feature.icon
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.8 + index * 0.1, ...TRANSITION_SPRING }}
			className='rounded-2xl h-full'
		>
			<MagicCard
				mode='orb'
				glowFrom='var(--color-brand)'
				glowTo='var(--color-xp)'
				className='flex h-full items-start gap-3 rounded-2xl border border-border-subtle bg-bg-card/80 p-5 shadow-card transition-all duration-300 hover:shadow-warm p-5'
			>
				<div
					className={cn(
						'flex size-10 shrink-0 items-center justify-center rounded-xl',
						feature.accent,
					)}
				>
					<Icon className={cn('size-5', feature.iconColor)} />
				</div>
				<div className='text-left'>
					<h3 className='font-semibold text-text-primary'>{title}</h3>
					<p className='mt-1 text-sm text-text-secondary'>{description}</p>
				</div>
			</MagicCard>
		</motion.div>
	)
}

interface TrendingRecipeCardProps {
	recipe: Recipe
	index: number
	byLabel: string
	cookedLabel: string
}

const TrendingRecipeCard = ({
	recipe,
	index,
	byLabel,
	cookedLabel,
}: TrendingRecipeCardProps) => {
	const coverImage = recipe.coverImageUrl?.[0] || '/placeholder-recipe.svg'
	const difficulty = difficultyToDisplay(recipe.difficulty)
	const totalTime =
		recipe.totalTimeMinutes || recipe.prepTimeMinutes + recipe.cookTimeMinutes

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.6 + index * 0.1, ...TRANSITION_SPRING }}
			className='rounded-2xl h-full'
		>
			<Link
				href={`/recipes/${recipe.id}`}
				className='group block h-full rounded-2xl'
			>
				<MagicCard
					mode='orb'
					glowFrom='var(--color-brand)'
					glowTo='var(--color-streak)'
					className='overflow-hidden h-full rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-all duration-300 hover:border-brand/30 hover:shadow-warm p-0'
				>
					<div className='relative aspect-video w-full overflow-hidden sm:aspect-[4/3]'>
						<Image
							src={coverImage}
							alt={recipe.title}
							fill
							className='object-cover transition-transform duration-500 group-hover:scale-105'
							sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
						/>
						{/* Gradient overlay */}
						<div className='pointer-events-none absolute inset-0 bg-gradient-scrim' />
						{/* Cook CTA — always visible on mobile, hover-revealed on desktop */}
						<div className='absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20'>
							<motion.div
								className='rounded-full bg-brand p-3 opacity-80 shadow-card transition-opacity sm:opacity-0 sm:group-hover:opacity-100'
								whileHover={ICON_BUTTON_HOVER}
							>
								<Play className='size-5 text-white' fill='white' />
							</motion.div>
						</div>
						{/* Stats overlay */}
						<div className='absolute bottom-0 left-0 right-0 flex items-center justify-between p-3'>
							<div className='flex items-center gap-2 text-xs text-white/90'>
								<span className='flex items-center gap-1'>
									<Clock className='size-3' />
									{totalTime > 0 ? formatCookingTime(totalTime) : ''}
								</span>
								<span className='flex items-center gap-1'>
									<Flame className='size-3' />
									{difficulty}
								</span>
							</div>
							{recipe.xpReward > 0 && (
								<span className='rounded-full bg-xp/90 px-2 py-0.5 text-xs font-bold text-white'>
									+{recipe.xpReward} XP
								</span>
							)}
						</div>
					</div>
					<div className='p-4 text-left'>
						<h3 className='line-clamp-1 font-bold text-text-primary transition-colors group-hover:text-brand'>
							{recipe.title}
						</h3>
						<p className='mt-1 line-clamp-1 text-sm text-text-secondary'>
							{byLabel}
						</p>
						{recipe.cookCount > 0 && (
							<div className='mt-2 flex items-center gap-1 text-xs text-text-muted'>
								<ChefHat className='size-3' />
								<span>{cookedLabel}</span>
							</div>
						)}
					</div>
				</MagicCard>
			</Link>
		</motion.div>
	)
}
// ============================================
// MAIN PAGE
// ============================================

export default function HomePage() {
	const t = useTranslations('landing')
	const router = useRouter()
	const { user, isLoading } = useAuth()
	const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([])
	const [recipesLoading, setRecipesLoading] = useState(true)
	const [recipesError, setRecipesError] = useState<string | null>(null)
	const [showCookModeDemo, setShowCookModeDemo] = useState(false)
	const hasTrendingContent = trendingRecipes.length > 0

	useEffect(() => {
		if (!isLoading && user) {
			router.push('/dashboard')
		}
	}, [user, isLoading, router])

	// Fetch trending recipes for preview
	useEffect(() => {
		let cancelled = false
		const fetchTrending = async () => {
			setRecipesError(null)
			try {
				const res = await getTrendingRecipes({ limit: 4 })
				if (cancelled) return
				if (res.success && res.data) {
					setTrendingRecipes(res.data.slice(0, 4))
				} else {
					setRecipesError(res.message || t('couldNotLoadDefault'))
				}
			} catch (err) {
				if (cancelled) return
				logDevError('Landing page: failed to fetch trending recipes', err)
				setRecipesError(t('couldNotConnect'))
			} finally {
				if (!cancelled) setRecipesLoading(false)
			}
		}
		fetchTrending()
		return () => {
			cancelled = true
		}
	}, [t])

	// Authenticated users get redirected
	if (isLoading || user) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-bg'>
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={TRANSITION_SPRING}
					className='flex size-16 items-center justify-center rounded-2xl bg-gradient-hero shadow-warm shadow-brand/30'
				>
					<ChefHat className='size-8 text-white' />
				</motion.div>
			</div>
		)
	}

	return (
		<div className='relative min-h-screen bg-bg'>
			{/* Warm noise texture for depth */}
			<NoiseOverlay opacity={0.03} />

			{/* Content */}
			<div className='relative'>
				{/* Launch banner */}
				<AnnouncementBanner
					variant='brand'
					storageKey='chefkix-launch-banner'
					href='/auth/sign-up'
					message={t('launchBanner')}
				/>

				<div className='relative min-h-[90vh] overflow-hidden border-b border-border-subtle/50 bg-bg'>
					<div className='pointer-events-none absolute inset-0'>
						<div className='absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_top_center,rgba(255,90,54,0.16),transparent_26%),radial-gradient(circle_at_15%_22%,rgba(255,90,54,0.1),transparent_24%),radial-gradient(circle_at_82%_30%,rgba(234,179,8,0.09),transparent_24%),linear-gradient(180deg,rgba(248,244,239,0.22),rgba(248,244,239,0.5)_52%,rgba(248,244,239,0.74)_100%)]' />
						<div className='absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_top_center,rgba(255,90,54,0.24),transparent_28%),radial-gradient(circle_at_84%_24%,rgba(168,85,247,0.2),transparent_26%),linear-gradient(180deg,rgba(19,16,14,0.22),rgba(19,16,14,0.56)_52%,rgba(19,16,14,0.76)_100%)]' />
						<div className='absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-bg' />
					</div>
					{/* Navigation */}
					<nav className='relative z-30 flex w-full items-center justify-between px-4 py-3 md:px-12 md:py-6'>
						<Link href='/' className='group flex items-center gap-2'>
							<div className='relative flex size-10 items-center justify-center rounded-xl bg-gradient-hero transition-transform duration-300 group-hover:scale-105'>
								<ChefHat className='size-5 text-white' />
							</div>
							<span className='text-lg font-bold text-text-primary transition-colors duration-300 group-hover:text-brand sm:text-xl'>
								ChefKix
							</span>
						</Link>
						<div className='flex shrink-0 items-center gap-2 sm:gap-3'>
							<Link
								href='/auth/sign-in'
								className='hidden rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary min-[410px]:inline-flex'
							>
								{t('signIn')}
							</Link>
							<motion.div
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
							>
								<Button
									onClick={() => router.push('/auth/sign-up')}
									variant='brand'
									className='h-9 rounded-xl px-3 text-xs font-bold shadow-warm min-[410px]:h-10 min-[410px]:px-5 min-[410px]:text-sm'
								>
									{t('getStarted')}
								</Button>
							</motion.div>
						</div>
					</nav>

					{/* Hero Section */}
					<motion.section
						variants={staggerContainer}
						initial='hidden'
						animate='visible'
						className='mx-auto max-w-5xl px-6 pb-8 pt-2 text-center md:px-12 md:pb-16 md:pt-10 relative z-20 flex-1 flex flex-col justify-center'
					>
						<motion.div variants={staggerItem} className='mx-auto mb-6 w-fit'>
							<div className='inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand shadow-card'>
								<Sparkles className='size-4' />
								<span>{t('heroEyebrow')}</span>
							</div>
						</motion.div>

						<motion.h1
							variants={staggerItem}
							className='mb-4 text-4xl font-black leading-tight text-text-primary md:text-5xl lg:text-6xl tracking-tight'
						>
							{t('heroTitle1')}{' '}
							<span className='inline-block text-brand'>
								<TextLoop
									texts={[t('heroTitlePro'), t('heroTitleGamer')]}
									interval={2800}
									textClassName='inline-block font-black text-brand'
								/>
							</span>
						</motion.h1>

						<motion.p
							variants={staggerItem}
							className='mx-auto mb-8 max-w-2xl text-lg md:text-xl leading-relaxed text-text-secondary font-medium'
						>
							{t('heroDescription')}
						</motion.p>

						<motion.div
							variants={staggerItem}
							className='flex flex-col items-center justify-center gap-4 sm:flex-row'
						>
							<motion.div
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								className='w-full sm:w-auto'
							>
								<Button
									onClick={() => router.push('/community')}
									variant='brand'
									size='lg'
									className='w-full sm:w-auto rounded-xl px-8 py-6 text-base font-bold shadow-warm'
								>
									<span className='flex items-center justify-center gap-2'>
										{t('seeCommunityFeed')}
										<ArrowRight className='size-5 transition-transform group-hover:translate-x-1' />
									</span>
								</Button>
							</motion.div>

							<motion.div
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								className='w-full sm:w-auto'
							>
								<Button
									onClick={() => router.push('/auth/sign-up')}
									variant='outline'
									size='lg'
									className='w-full sm:w-auto rounded-xl border-2 border-border-medium bg-bg-card/80 px-8 py-6 text-base font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand'
								>
									{t('startCookingFree')}
								</Button>
							</motion.div>
						</motion.div>

						<motion.p
							variants={staggerItem}
							className='mx-auto mt-4 max-w-2xl text-sm font-medium text-text-muted md:text-base'
						>
							{t('heroFootnote')}
						</motion.p>

						<motion.div
							variants={staggerItem}
							className='mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2'
						>
							{discoveryPillKeys.map(key => (
								<span
									key={key}
									className='rounded-full border border-border-subtle bg-bg-card/80 px-3 py-1.5 text-sm font-medium text-text-secondary shadow-card'
								>
									{t(key)}
								</span>
							))}
						</motion.div>
					</motion.section>
				</div>

				{/* Trending Recipes Section */}
				<section className='mx-auto max-w-6xl px-6 py-8 md:px-12 md:py-16'>
					<div className='mb-8'>
						<div className='mb-5 text-center md:mb-6'>
							<div className='mb-2 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand'>
								<TrendingUp className='size-4' />
								<span>{t('entrySectionEyebrow')}</span>
							</div>
							<p className='mx-auto max-w-3xl text-base leading-relaxed text-text-secondary'>
								{t('entrySectionDesc')}
							</p>
						</div>

						<div className='grid gap-4 md:grid-cols-3'>
							{landingPathways.map(pathway => {
								const Icon = pathway.icon

								return (
									<Link
										key={pathway.titleKey}
										href={pathway.href}
										className='group block rounded-2xl h-full'
									>
										<MagicCard
											mode='orb'
											glowFrom='var(--color-brand)'
											glowTo='var(--color-xp)'
											className='flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-card/90 p-5 text-left shadow-card transition-all duration-300 hover:border-brand/30 hover:shadow-warm'
										>
											<div
												className={cn(
													'mb-4 flex size-11 items-center justify-center rounded-2xl',
													pathway.accent,
												)}
											>
												<Icon className={cn('size-5', pathway.iconColor)} />
											</div>
											<h3 className='font-semibold text-text-primary transition-colors group-hover:text-brand'>
												{t(pathway.titleKey)}
											</h3>
											<p className='mt-2 flex-1 text-sm leading-relaxed text-text-secondary'>
												{t(pathway.descriptionKey)}
											</p>
											<div className='mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand'>
												{t('seeAll')}
												<ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
											</div>
										</MagicCard>
									</Link>
								)
							})}
						</div>
					</div>

					<div className='mb-4 flex items-center justify-between md:mb-6'>
						<div className='flex items-center gap-2'>
							<TrendingUp className='size-5 text-brand' />
							<h2 className='text-xl font-bold text-text-primary'>
								{t('trendingTonight')}
							</h2>
						</div>
						<Link
							href='/explore'
							className='flex items-center gap-1 text-sm font-semibold text-brand hover:underline'
						>
							{t('seeAll')}
							<ArrowRight className='size-3.5' />
						</Link>
					</div>

					{recipesLoading ? (
						<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
							{[...Array(4)].map((_, i) => (
								<div
									key={i}
									className='animate-pulse rounded-2xl border border-border-subtle bg-bg-card'
								>
									<div className='aspect-video bg-bg-elevated sm:aspect-[4/3]' />
									<div className='space-y-2 p-4'>
										<div className='h-4 w-3/4 rounded bg-bg-elevated' />
										<div className='h-3 w-1/2 rounded bg-bg-elevated' />
									</div>
								</div>
							))}
						</div>
					) : hasTrendingContent ? (
						<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
							{trendingRecipes.map((recipe, i) => (
								<TrendingRecipeCard
									key={recipe.id}
									recipe={recipe}
									index={i}
									byLabel={t('by', {
										name: recipe.author?.displayName || 'ChefKix',
									})}
									cookedLabel={t('peopleCookedThis', {
										count: recipe.cookCount,
									})}
								/>
							))}
						</div>
					) : recipesError ? (
						<div className='rounded-3xl border border-warning/30 bg-gradient-to-br from-warning/8 via-bg-card to-brand/5 p-6 shadow-card'>
							<div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
								<div className='max-w-2xl'>
									<div className='mb-3 inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-warning'>
										<AlertTriangle className='size-3.5' />
										{t('trendingUnavailableEyebrow')}
									</div>
									<h3 className='text-xl font-bold text-text-primary'>
										{t('trendingUnavailableTitle')}
									</h3>
									<p className='mt-2 text-sm leading-relaxed text-text-secondary md:text-base'>
										{t('trendingUnavailableDesc')}
									</p>
								</div>
								<button
									type='button'
									onClick={() => {
										setRecipesLoading(true)
										setRecipesError(null)
										getTrendingRecipes({ limit: 4 })
											.then(res => {
												if (res.success && res.data) {
													setTrendingRecipes(res.data.slice(0, 4))
												} else {
													setRecipesError(
														res.message || t('couldNotLoadDefault'),
													)
												}
											})
											.catch(() => setRecipesError(t('couldNotConnect')))
											.finally(() => setRecipesLoading(false))
									}}
									className='inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-brand hover:text-brand'
								>
									<RefreshCw className='size-4' />
									{t('tryAgain')}
								</button>
							</div>
							<div className='mt-6 grid gap-3 md:grid-cols-2'>
								<Link
									href='/explore'
									className='group rounded-2xl border border-border-subtle bg-bg-card/90 p-4 transition-all hover:border-brand/30 hover:shadow-card'
								>
									<div className='flex items-start gap-3'>
										<div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand'>
											<TrendingUp className='size-5' />
										</div>
										<div className='min-w-0'>
											<h4 className='font-semibold text-text-primary'>
												{t('trendingUnavailableExploreTitle')}
											</h4>
											<p className='mt-1 text-sm text-text-secondary'>
												{t('trendingUnavailableExploreDesc')}
											</p>
										</div>
									</div>
									<div className='mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand'>
										{t('browseRecipes')}
										<ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
									</div>
								</Link>
								<Link
									href='/community'
									className='group rounded-2xl border border-border-subtle bg-bg-card/90 p-4 transition-all hover:border-brand/30 hover:shadow-card'
								>
									<div className='flex items-start gap-3'>
										<div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-streak/10 text-streak'>
											<Sparkles className='size-5' />
										</div>
										<div className='min-w-0'>
											<h4 className='font-semibold text-text-primary'>
												{t('trendingUnavailableCommunityTitle')}
											</h4>
											<p className='mt-1 text-sm text-text-secondary'>
												{t('trendingUnavailableCommunityDesc')}
											</p>
										</div>
									</div>
									<div className='mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand'>
										{t('seeCommunity')}
										<ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
									</div>
								</Link>
							</div>
						</div>
					) : (
						<div className='rounded-2xl border border-border-subtle bg-bg-card p-8 text-center'>
							<ChefHat className='mx-auto mb-3 size-10 text-text-muted' />
							<p className='text-text-secondary'>{t('beFirstToTrend')}</p>
							<Link
								href='/auth/sign-up'
								className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline'
							>
								{t('createFirstRecipe')}
								<ArrowRight className='size-3.5' />
							</Link>
						</div>
					)}
				</section>

				{/* Features Section - Real product capabilities */}
				<section className='border-t border-border-subtle bg-bg-card/30 px-6 py-16 md:px-12'>
					<div className='mx-auto max-w-4xl'>
						<div className='mb-8 text-center'>
							<div className='mb-2 flex items-center justify-center gap-1.5'>
								<Sparkles className='size-4 text-streak' />
								<span className='text-sm font-bold uppercase tracking-wider text-streak'>
									{t('builtForHomeCooks')}
								</span>
							</div>
							<h2 className='text-2xl font-bold text-text-primary md:text-3xl'>
								<HighlightOnScroll
									text={t('everythingYouNeed')}
									as='span'
									className='text-2xl font-bold md:text-3xl'
								/>
							</h2>
						</div>

						<SpotlightCards columns={3} dimAmount={0.4} className='gap-4'>
							{featureHighlights.map((feature, i) => (
								<FeatureCard
									key={feature.titleKey}
									feature={feature}
									index={i}
									title={t(feature.titleKey)}
									description={t(feature.descriptionKey)}
								/>
							))}
						</SpotlightCards>
					</div>
				</section>

				{/* Cook Mode Demo Section */}
				<section className='px-6 py-16 md:px-12'>
					<div className='mx-auto max-w-4xl'>
						<div className='mb-8 text-center'>
							<div className='mb-2 flex items-center justify-center gap-1.5'>
								<Play className='size-4 text-brand' />
								<span className='text-sm font-bold uppercase tracking-wider text-brand'>
									{t('seeHowItWorks')}
								</span>
							</div>
							<h2 className='mb-2 text-2xl font-bold text-text-primary md:text-3xl'>
								<TextReveal
									text={t('cookModeGuides')}
									preset='slideUp'
									as='span'
								/>
							</h2>
							<p className='text-text-secondary'>{t('neverLosePlaceDesc')}</p>
						</div>

						{/* Interactive Demo Card */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={TRANSITION_SPRING}
							className='overflow-hidden rounded-3xl border border-border-subtle bg-bg-card shadow-warm'
						>
							{/* Demo Header */}
							<div className='flex items-center justify-between border-b border-border-subtle bg-bg-elevated/50 px-6 py-4'>
								<div className='flex items-center gap-3'>
									<div className='flex size-10 items-center justify-center rounded-xl bg-brand/10'>
										<ChefHat className='size-5 text-brand' />
									</div>
									<div>
										<h3 className='font-bold text-text-primary'>
											{t('classicPastaDemo')}
										</h3>
										<p className='text-xs text-text-muted'>
											{t('stepOf', { current: 2, total: 4 })}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<span className='rounded-full bg-xp/10 px-2.5 py-1 text-xs font-bold text-xp'>
										{t('xpReward', { xp: 15 })}
									</span>
								</div>
							</div>

							{/* Demo Step Content */}
							<div className='p-6 md:p-8'>
								<div className='mb-6'>
									<div className='mb-2 flex items-center gap-2'>
										<span className='flex size-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white'>
											2
										</span>
										<span className='text-sm font-medium text-text-secondary'>
											{t('currentStep')}
										</span>
									</div>
									<p className='text-lg text-text-primary'>
										{t('demoInstruction')}
									</p>
								</div>

								{/* Demo Timer */}
								<div className='mb-6 flex items-center gap-4 rounded-xl bg-bg-elevated p-4'>
									<div className='flex size-12 items-center justify-center rounded-xl bg-brand/10'>
										<Timer className='size-6 text-brand' />
									</div>
									<div className='flex-1'>
										<p className='text-sm font-medium text-text-secondary'>
											{t('timer')}
										</p>
										<p className='text-2xl font-bold tabular-nums text-text-primary'>
											8:00
										</p>
									</div>
									<button
										type='button'
										onClick={() => setShowCookModeDemo(true)}
										className='flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand/90'
									>
										<Play className='size-4' fill='white' />
										{t('startTimer')}
									</button>
								</div>

								{/* Step Navigation Demo */}
								<div className='flex items-center justify-between'>
									<button
										type='button'
										className='rounded-xl border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated'
									>
										{t('previous')}
									</button>
									<div className='flex gap-1.5'>
										<div className='size-2 rounded-full bg-brand' />
										<div className='size-2 rounded-full bg-brand' />
										<div className='size-2 rounded-full bg-border-subtle' />
										<div className='size-2 rounded-full bg-border-subtle' />
									</div>
									<button
										type='button'
										className='flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/20'
									>
										{t('nextStep')}
										<ArrowRight className='size-4' />
									</button>
								</div>
							</div>
						</motion.div>

						<div className='mt-6 text-center'>
							<Link
								href='/auth/sign-up'
								className='inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline'
							>
								{t('signUpToCook')}
								<ArrowRight className='size-4' />
							</Link>
						</div>
					</div>
				</section>

				{/* Timer Demo Modal */}
				<AnimatePresence>
					{showCookModeDemo && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
							onClick={() => setShowCookModeDemo(false)}
						>
							<motion.div
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								onClick={e => e.stopPropagation()}
								className='relative w-full max-w-sm rounded-3xl bg-bg-card p-8 text-center shadow-warm'
							>
								<button
									type='button'
									aria-label='Close demo'
									onClick={() => setShowCookModeDemo(false)}
									className='absolute right-4 top-4 rounded-full p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary'
								>
									<X className='size-5' />
								</button>
								<div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand/10'>
									<Timer className='size-8 text-brand' />
								</div>
								<h3 className='mb-2 text-xl font-bold text-text-primary'>
									{t('timerStarted')}
								</h3>
								<p className='mb-6 text-text-secondary'>
									{t('timerModalDesc')}
								</p>
								<div className='mb-6 rounded-xl bg-bg-elevated py-6'>
									<p className='text-4xl font-bold tabular-nums text-brand'>
										7:59
									</p>
								</div>
								<div className='flex items-center justify-center gap-2 text-sm text-success'>
									<CheckCircle2 className='size-4' />
									<span>{t('neverForgetTimer')}</span>
								</div>
								<Link
									href='/auth/sign-up'
									className='mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand/90'
								>
									<ChefHat className='size-5' />
									{t('tryCookModeFree')}
								</Link>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Bottom CTA */}
				<WavyBackground
					layers={4}
					waveHeight={62}
					colors={[
						'oklch(from var(--color-brand) l c h / 32%)',
						'oklch(from var(--color-xp) l c h / 24%)',
						'oklch(from var(--color-combo) l c h / 18%)',
						'oklch(from var(--color-streak) l c h / 12%)',
					]}
					className='relative min-h-[30rem] py-24 overflow-hidden bg-bg border-t border-border-subtle flex items-center justify-center'
				>
					<div className='mx-auto w-full max-w-5xl rounded-3xl border border-border-subtle bg-bg-card/25 backdrop-blur-md p-8 sm:p-12 shadow-warm relative overflow-hidden z-10 px-4 sm:px-6'>
						{/* Subtle glowing radial background blobs */}
						<div className='absolute -left-20 -top-20 size-60 rounded-full bg-brand/5 blur-[60px] pointer-events-none' />
						<div className='absolute -right-20 -bottom-20 size-60 rounded-full bg-xp/5 blur-[60px] pointer-events-none' />

						<div className='relative z-10 max-w-lg mx-auto'>
							<div className='mb-8 flex flex-wrap items-center justify-center gap-2'>
								{discoveryPillKeys.map(key => (
									<span
										key={`cta-${key}`}
										className='rounded-full border border-border-subtle bg-bg-card/75 px-3 py-1.5 text-sm font-medium text-text-secondary shadow-card'
									>
										{t(key)}
									</span>
								))}
							</div>

							<motion.div
								initial={{ scale: 0 }}
								whileInView={{ scale: 1 }}
								viewport={{ once: true }}
								transition={TRANSITION_SPRING}
								className='mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-warm shadow-card shadow-brand/20'
							>
								<Flame className='size-8 text-white' />
							</motion.div>
							<h2 className='mb-3 text-2xl font-bold text-text-primary md:text-3xl'>
								{t('kitchenWaiting')}
							</h2>
							<p className='mb-6 text-text-secondary'>{t('bottomCtaDesc')}</p>
							<motion.div
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
							>
								<Button
									onClick={() => router.push('/auth/sign-up')}
									variant='brand'
									size='lg'
									className='px-10 py-6 text-lg font-bold text-white shadow-warm rounded-2xl bg-brand w-full'
								>
									<ChefHat className='mr-2 size-5' />
									{t('startCookingFree')}
								</Button>
							</motion.div>
							<p className='mt-4 text-xs text-text-muted'>
								{t('noCreditCard')}
							</p>
						</div>
					</div>
				</WavyBackground>

				{/* Footer */}
				<footer className='border-t border-border-subtle px-6 py-8 md:px-12 bg-bg relative z-20'>
					<div className='mx-auto max-w-5xl'>
						<div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
							{/* Brand */}
							<div className='flex items-center gap-2'>
								<div className='flex size-8 items-center justify-center rounded-xl bg-gradient-hero'>
									<ChefHat className='size-4 text-white' />
								</div>
								<span className='font-bold text-text-primary'>ChefKix</span>
							</div>

							{/* Footer links */}
							<div className='flex flex-wrap gap-x-8 gap-y-2 text-sm'>
								<Link
									href='/explore'
									className='text-text-muted transition-colors hover:text-text-primary'
								>
									{t('browseRecipes')}
								</Link>
								<Link
									href='/auth/sign-up'
									className='text-text-muted transition-colors hover:text-text-primary'
								>
									{t('createAccount')}
								</Link>
								<Link
									href='/auth/sign-in'
									className='text-text-muted transition-colors hover:text-text-primary'
								>
									{t('signIn')}
								</Link>
							</div>
						</div>

						<div className='mt-6 border-t border-border-subtle pt-6 text-center text-sm text-text-muted md:text-left'>
							{t('copyright', { year: new Date().getFullYear() })}
						</div>
					</div>
				</footer>
			</div>
		</div>
	)
}
