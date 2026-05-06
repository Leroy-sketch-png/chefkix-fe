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
import { DotPattern } from '@/components/ui/dot-pattern'
import { HighlightOnScroll } from '@/components/ui/highlight-on-scroll'
import { CountUpStats } from '@/components/ui/count-up-stats'
import { AnnouncementBanner } from '@/components/ui/announcement-banner'
import { NoiseOverlay } from '@/components/ui/noise-overlay'
import { TextReveal } from '@/components/ui/text-reveal'

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

// ============================================
// DATA - Features are REAL product capabilities, not fake stats
// ============================================

const featureHighlights: FeatureHighlight[] = [
	{
		icon: Timer,
		titleKey: 'smartTimersTitle',
		descriptionKey: 'smartTimersDesc',
		accent: 'bg-info/10',
		iconColor: 'text-info',
	},
	{
		icon: Trophy,
		titleKey: 'earnXpTitle',
		descriptionKey: 'earnXpDesc',
		accent: 'bg-xp/10',
		iconColor: 'text-xp',
	},
	{
		icon: Zap,
		titleKey: 'stepByStepTitle',
		descriptionKey: 'stepByStepDesc',
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
			className='flex items-start gap-3 rounded-xl border border-border-subtle bg-bg-card/80 p-4 shadow-card backdrop-blur-sm'
		>
			<div
				className={cn(
					'flex size-10 shrink-0 items-center justify-center rounded-lg',
					feature.accent,
				)}
			>
				<Icon className={cn('size-5', feature.iconColor)} />
			</div>
			<div>
				<h3 className='font-semibold text-text'>{title}</h3>
				<p className='mt-0.5 text-sm text-text-secondary'>{description}</p>
			</div>
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
		>
			<Link
				href={`/recipes/${recipe.id}`}
				className='group block overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-all hover:border-brand/30 hover:shadow-warm'
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
								{formatCookingTime(totalTime)}
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
				<div className='p-4'>
					<h3 className='line-clamp-1 font-bold text-text transition-colors group-hover:text-brand'>
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
			{/* Subtle dot pattern background */}
			<DotPattern
				fade
				spacing={24}
				radius={0.8}
				color='var(--text-muted)'
				className='absolute inset-0 opacity-[0.15]'
			/>
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

				{/* Navigation */}
				<nav className='flex items-center justify-between px-6 py-4 md:px-12 md:py-6'>
					<div className='flex items-center gap-2'>
						<div className='flex size-10 items-center justify-center rounded-xl bg-gradient-hero'>
							<ChefHat className='size-5 text-white' />
						</div>
						<span className='text-xl font-bold text-text'>ChefKix</span>
					</div>
					<div className='flex items-center gap-3'>
						<Link
							href='/auth/sign-in'
							className='rounded-radius px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text'
						>
							{t('signIn')}
						</Link>
						<Link
							href='/auth/sign-up'
							className='rounded-radius bg-gradient-hero px-5 py-2 text-sm font-bold text-white shadow-card shadow-brand/25 transition-all hover:shadow-warm'
						>
							{t('getStarted')}
						</Link>
					</div>
				</nav>

				{/* Hero Section */}
				<motion.section
					variants={staggerContainer}
					initial='hidden'
					animate='visible'
					className='mx-auto max-w-5xl px-6 pb-12 pt-8 text-center md:px-12 md:pb-16 md:pt-16'
				>
					<motion.div variants={staggerItem}>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.1, ...TRANSITION_SPRING }}
							className='mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-hero shadow-warm shadow-brand/30'
						>
							<ChefHat className='size-8 text-white' />
						</motion.div>
					</motion.div>

					<motion.h1
						variants={staggerItem}
						className='mb-4 text-3xl font-extrabold leading-tight text-text md:text-4xl lg:text-5xl'
					>
						{t('heroTitle1')}{' '}
						<TextLoop
							texts={[t('heroTitlePro'), t('heroTitleGamer')]}
							interval={2500}
							textClassName='bg-gradient-hero-text bg-clip-text text-transparent'
						/>
					</motion.h1>

					<motion.p
						variants={staggerItem}
						className='mx-auto mb-6 max-w-xl text-lg text-text-secondary'
					>
						{t('heroDescription')}
					</motion.p>

					<motion.div
						variants={staggerItem}
						className='flex flex-col items-center justify-center gap-3 sm:flex-row'
					>
						<Link
							href='/auth/sign-up'
							className='group flex items-center gap-2 rounded-radius bg-gradient-hero px-8 py-3.5 text-base font-bold text-white shadow-card shadow-brand/30 transition-all hover:shadow-warm hover:shadow-brand/40'
						>
							{t('startCookingFree')}
							<ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
						</Link>
						<Link
							href='/explore'
							className='flex items-center gap-2 rounded-radius border border-border-subtle bg-bg-card px-8 py-3.5 text-base font-semibold text-text shadow-card transition-all hover:shadow-warm'
						>
							{t('browseRecipes')}
						</Link>
					</motion.div>
				</motion.section>

				{/* Trending Recipes Section */}
				<section className='mx-auto max-w-6xl px-6 py-10 md:px-12 md:py-16'>
					<div className='mb-6 flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<TrendingUp className='size-5 text-brand' />
							<h2 className='text-xl font-bold text-text'>
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
					) : recipesError ? (
						<div className='rounded-2xl border border-border-subtle bg-bg-card p-8 text-center'>
							<AlertTriangle className='mx-auto mb-3 size-10 text-warning' />
							<p className='mb-2 font-medium text-text'>
								{t('couldntLoadRecipes')}
							</p>
							<p className='mb-4 text-sm text-text-secondary'>{recipesError}</p>
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
												setRecipesError(res.message || t('couldNotLoadDefault'))
											}
										})
										.catch(() => setRecipesError(t('couldNotConnect')))
										.finally(() => setRecipesLoading(false))
								}}
								className='inline-flex items-center gap-2 rounded-lg bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/20'
							>
								<RefreshCw className='size-4' />
								{t('tryAgain')}
							</button>
						</div>
					) : trendingRecipes.length > 0 ? (
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
							<h2 className='text-2xl font-bold text-text md:text-3xl'>
								<HighlightOnScroll
									text={t('everythingYouNeed')}
									as='span'
									className='text-2xl font-bold md:text-3xl'
								/>
							</h2>
						</div>

						<div className='grid gap-4 md:grid-cols-3'>
							{featureHighlights.map((feature, i) => (
								<FeatureCard
									key={feature.titleKey}
									feature={feature}
									index={i}
									title={t(feature.titleKey)}
									description={t(feature.descriptionKey)}
								/>
							))}
						</div>
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
							<h2 className='mb-2 text-2xl font-bold text-text md:text-3xl'>
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
										<h3 className='font-bold text-text'>
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
									<p className='text-lg text-text'>{t('demoInstruction')}</p>
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
										<p className='text-2xl font-bold tabular-nums text-text'>
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
										className='rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated'
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
										className='flex items-center gap-2 rounded-lg bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/20'
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
									className='absolute right-4 top-4 rounded-full p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
								>
									<X className='size-5' />
								</button>
								<div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand/10'>
									<Timer className='size-8 text-brand' />
								</div>
								<h3 className='mb-2 text-xl font-bold text-text'>
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
				<section className='px-6 py-16 text-center md:px-12'>
					<div className='mx-auto max-w-lg'>
						{/* Community stats */}
						<div className='mx-auto mb-12 max-w-md'>
							<CountUpStats
								columns={3}
								stats={[
									{ value: 500, label: t('recipesAvailable'), suffix: '+' },
									{ value: 50, label: t('activeCooks'), suffix: '+' },
									{
										value: 4.8,
										label: t('avgRating'),
										prefix: '★ ',
										decimals: 1,
									},
								]}
							/>
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
						<h2 className='mb-3 text-2xl font-bold text-text md:text-3xl'>
							{t('kitchenWaiting')}
						</h2>
						<p className='mb-6 text-text-secondary'>{t('bottomCtaDesc')}</p>
						<Link
							href='/auth/sign-up'
							className='inline-flex items-center gap-2 rounded-radius bg-gradient-hero px-8 py-3.5 font-bold text-white shadow-card shadow-brand/30 transition-all hover:shadow-warm'
						>
							<ChefHat className='size-5' />
							{t('startCookingFree')}
						</Link>
						<p className='mt-4 text-xs text-text-muted'>{t('noCreditCard')}</p>
					</div>
				</section>

				{/* Footer */}
				<footer className='border-t border-border-subtle px-6 py-8 md:px-12'>
					<div className='mx-auto max-w-5xl'>
						<div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
							{/* Brand */}
							<div className='flex items-center gap-2'>
								<div className='flex size-8 items-center justify-center rounded-lg bg-gradient-hero'>
									<ChefHat className='size-4 text-white' />
								</div>
								<span className='font-bold text-text'>ChefKix</span>
							</div>

							{/* Footer links */}
							<div className='flex flex-wrap gap-x-8 gap-y-2 text-sm'>
								<Link
									href='/explore'
									className='text-text-muted transition-colors hover:text-text'
								>
									{t('browseRecipes')}
								</Link>
								<Link
									href='/auth/sign-up'
									className='text-text-muted transition-colors hover:text-text'
								>
									{t('createAccount')}
								</Link>
								<Link
									href='/auth/sign-in'
									className='text-text-muted transition-colors hover:text-text'
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
