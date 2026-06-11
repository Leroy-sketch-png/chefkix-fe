'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ChefHat,
	Trophy,
	Flame,
	Users,
	BookOpen,
	Share2,
	Sparkles,
	TrendingUp,
	Clock,
	Target,
	Zap,
	ArrowRight,
	Loader2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { PATHS } from '@/constants'
import { Button } from '@/components/ui/button'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_HOVER,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import { cn } from '@/lib/utils'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { WavyBackground } from '@/components/ui/wavy-background'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { MagicCard } from '@/components/ui/magic-card'
import { BlurFade } from '@/components/ui/blur-fade'
import { ShinyButton } from '@/components/ui/shiny-button'
import { WordRotate } from '@/components/ui/word-rotate'
import {
	ScrollVelocityContainer,
	ScrollVelocityRow,
} from '@/components/ui/scroll-velocity'
import { StackedCards } from '@/components/ui/stacked-cards'

// ============================================
// HERO SECTION
// ============================================

const HeroSection = () => {
	const t = useTranslations('welcome')
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()
	const socialSignals = [
		{ icon: Sparkles, label: t('socialProofChefs') },
		{ icon: Users, label: t('socialProofRecipes') },
		{ icon: ChefHat, label: t('socialProofMeals') },
	]

	return (
		<AuroraBackground className='relative min-h-[90vh] flex items-center justify-start pt-24 pb-20 w-full bg-bg'>
			<div className='container relative mx-auto max-w-7xl px-6 z-10'>
				<div className='grid lg:grid-cols-2 gap-12 items-center'>
					{/* Left: Text Content */}
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={TRANSITION_SPRING}
						className='max-w-2xl text-left'
					>
						{/* Logo + Brand */}
						<div className='mb-8 inline-flex items-center gap-3 rounded-full border border-brand/30 bg-brand/10 px-6 py-3 text-sm font-semibold text-brand shadow-glow backdrop-blur-md'>
							<Sparkles className='size-4' />
							<span>{t('heroTagline')}</span>
						</div>

						<h1 className='mb-6 text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight text-text-primary'>
							{t('heroTitle1')}{' '}
							<AnimatedGradientText
								from='var(--color-brand)'
								via='var(--color-xp)'
								to='var(--color-combo)'
								duration={6}
								className='drop-shadow-sm font-black'
							>
								<WordRotate
									words={[
										t('heroPro'),
										t('heroChef'),
										t('heroLegend'),
										t('heroStar'),
									]}
									className='text-brand font-black'
									duration={2500}
								/>
							</AnimatedGradientText>
							<br />
							{t('heroTitle2')}{' '}
							<AnimatedGradientText
								from='var(--color-streak)'
								via='var(--color-combo)'
								to='var(--color-brand)'
								duration={6}
								className='drop-shadow-sm font-black'
							>
								{t('heroTitleGamer')}
							</AnimatedGradientText>
						</h1>

						<p className='mb-10 max-w-xl text-xl leading-relaxed text-text-secondary font-medium'>
							{t('heroDescription')}
						</p>

						{/* CTA Buttons */}
						<div className='flex flex-wrap items-center gap-6'>
							<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
								<Button
									onClick={() =>
										startNavigationTransition(() => {
											router.push(PATHS.AUTH.SIGN_UP)
										})
									}
									disabled={isNavigating}
									size='lg'
									className='group relative overflow-hidden bg-brand px-10 py-7 text-xl font-bold text-white shadow-glow transition-all disabled:opacity-50 rounded-2xl'
								>
									<span className='relative z-10 flex items-center gap-3'>
										{t('startCooking')}
										<ArrowRight className='size-6 transition-transform group-hover:translate-x-1.5' />
									</span>
								</Button>
							</motion.div>

							<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
								<Button
									onClick={() =>
										startNavigationTransition(() => {
											router.push('/community')
										})
									}
									disabled={isNavigating}
									variant='outline'
									size='lg'
									className='border-2 border-border-medium bg-bg/50 backdrop-blur-md px-8 py-7 text-xl font-semibold text-text-primary transition-all hover:border-brand hover:text-brand disabled:opacity-50 rounded-2xl'
								>
									<Users className='mr-3 size-6' />
									{t('exploreRecipes')}
								</Button>
							</motion.div>
						</div>

						<ScrollVelocityContainer className='mt-10 border-y border-border-subtle/40 py-3'>
							<ScrollVelocityRow
								baseVelocity={3}
								className='gap-8 text-sm font-medium text-text-muted'
							>
								<span className='flex items-center gap-2 px-4'>
									🍳 {t('socialProofMeals')}
								</span>
								<span className='flex items-center gap-2 px-4'>
									⭐ {t('socialProofRating')}
								</span>
								<span className='flex items-center gap-2 px-4'>
									🔥 {t('socialProofStreaks')}
								</span>
								<span className='flex items-center gap-2 px-4'>
									👨‍🍳 {t('socialProofChefs')}
								</span>
							</ScrollVelocityRow>
						</ScrollVelocityContainer>

						{/* Social Proof */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.4 }}
							className='mt-14 flex flex-wrap items-center gap-3 text-sm font-semibold text-text-secondary'
						>
							{socialSignals.map(signal => {
								const Icon = signal.icon
								return (
									<span
										key={signal.label}
										className='inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card/80 px-4 py-2 shadow-card'
									>
										<Icon className='size-4 text-brand' />
										{signal.label}
									</span>
								)
							})}
						</motion.div>
					</motion.div>

					{/* Right: Stunning Visuals */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ ...TRANSITION_SPRING, delay: 0.2 }}
						className='relative min-h-[40rem] hidden lg:block'
					>
						{/* Main Image */}
						<motion.div
							className='absolute right-0 top-1/2 -translate-y-1/2 w-96 lg:w-[28rem] h-[32rem] rounded-3xl overflow-hidden shadow-2xl z-20 border-8 border-bg/80'
						>
							<Image
								src='/images/hero/cacio-e-pepe.png'
								alt='Cacio e Pepe'
								fill
								className='object-cover'
								sizes='448px'
								priority
								loading='eager'
								fetchPriority='high'
							/>
							<div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent' />
							<div className='absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-black/40 p-5 rounded-2xl border border-white/20 text-white shadow-xl'>
								<span className='inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/85'>
									<Sparkles className='size-3.5' />
									{t('heroTagline')}
								</span>
								<div className='mt-3 font-bold text-xl'>
									{t('heroFoodCacio')}
								</div>
							</div>
						</motion.div>

						{/* Secondary Image 1 */}
						<motion.div
							className='absolute left-4 top-8 w-64 h-80 rounded-3xl overflow-hidden shadow-xl z-10 border-8 border-bg/80'
						>
							<Image
								src='/images/hero/miso-ramen.png'
								alt='Tonkotsu Ramen'
								fill
								className='object-cover'
								sizes='256px'
								priority
								loading='eager'
								fetchPriority='high'
							/>
							<div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
							<div className='absolute bottom-5 left-5 text-white'>
								<span className='font-bold text-lg drop-shadow-md'>
									{t('heroFoodRamen')}
								</span>
							</div>
						</motion.div>

						{/* Secondary Image 2 */}
						<motion.div
							className='absolute left-10 bottom-6 size-60 rounded-3xl overflow-hidden shadow-2xl z-30 border-8 border-bg/80'
						>
							<Image
								src='/images/hero/avocado-toast.png'
								alt='Avocado Toast'
								fill
								className='object-cover'
								sizes='240px'
								priority
								loading='eager'
								fetchPriority='high'
							/>
							<div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
							<div className='absolute bottom-5 left-5 text-white'>
								<span className='font-bold text-lg drop-shadow-md'>
									{t('heroFoodAvocado')}
								</span>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>

			{/* Loading indicator */}
			<AnimatePresence>
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className='fixed left-1/2 top-10 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-3 rounded-full bg-brand/90 backdrop-blur-md px-6 py-3 text-sm font-semibold text-white shadow-warm border border-white/20'>
							<Loader2 className='size-5 animate-spin' />
							{t('loading')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</AuroraBackground>
	)
}

// ============================================
// FEATURES SECTION
// ============================================

const features = [
	{
		icon: Trophy,
		titleKey: 'featureXpTitle',
		descriptionKey: 'featureXpDesc',
		gradient: 'from-brand to-brand/60',
		color: 'text-brand',
	},
	{
		icon: Flame,
		titleKey: 'featureStreaksTitle',
		descriptionKey: 'featureStreaksDesc',
		gradient: 'from-streak to-streak/60',
		color: 'text-streak',
	},
	{
		icon: Target,
		titleKey: 'featureCookingTitle',
		descriptionKey: 'featureCookingDesc',
		gradient: 'from-xp to-xp/60',
		color: 'text-xp',
	},
	{
		icon: Users,
		titleKey: 'featureFriendsTitle',
		descriptionKey: 'featureFriendsDesc',
		gradient: 'from-combo to-combo/60',
		color: 'text-combo',
	},
	{
		icon: Sparkles,
		titleKey: 'featureQualityTitle',
		descriptionKey: 'featureQualityDesc',
		gradient: 'from-accent-purple to-accent-purple/60',
		color: 'text-accent-purple',
	},
	{
		icon: TrendingUp,
		titleKey: 'featureCreatorTitle',
		descriptionKey: 'featureCreatorDesc',
		color: 'text-brand',
	},
]

const FeaturesSection = () => {
	const t = useTranslations('welcome')
	return (
		<section className='bg-bg py-24'>
			<div className='container mx-auto max-w-7xl px-6'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={TRANSITION_SPRING}
					className='mb-16 text-center'
				>
					<h2 className='mb-4 text-4xl font-bold text-text-primary md:text-5xl'>
						{t('whyDifferentTitle')}
					</h2>
					<p className='mx-auto max-w-2xl text-lg text-text-secondary'>
						{t('whyDifferentSubtitle')}
					</p>
				</motion.div>

				<motion.div
					variants={staggerContainer}
					initial='hidden'
					whileInView='visible'
					viewport={{ once: true }}
					className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'
				>
					{features.map((feature, index) => {
						const Icon = feature.icon
						return (
							<BlurFade
								key={feature.titleKey}
								delay={0.05 * index}
								duration={0.4}
							>
								<MagicCard
									mode='orb'
									glowFrom='var(--color-brand)'
									glowTo='var(--color-xp)'
									className='group rounded-2xl border border-border-subtle bg-bg-card p-8 shadow-card transition-all hover:shadow-warm'
								>
									<div
										className={cn(
											'mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-card',
											feature.gradient,
										)}
									>
										<Icon className='size-7 text-white' />
									</div>
									<h3 className='mb-3 text-xl font-bold text-text-primary'>
										{t(feature.titleKey)}
									</h3>
									<p className='leading-relaxed text-text-secondary'>
										{t(feature.descriptionKey)}
									</p>
								</MagicCard>
							</BlurFade>
						)
					})}
				</motion.div>
			</div>
		</section>
	)
}

// ============================================
// HOW IT WORKS SECTION
// ============================================

const HowItWorksSection = () => {
	const t = useTranslations('welcome')

	return (
		<section className='bg-bg-elevated py-24'>
			<div className='container mx-auto max-w-7xl px-6'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={TRANSITION_SPRING}
					className='mb-16 text-center'
				>
					<h2 className='mb-4 text-4xl font-bold text-text-primary md:text-5xl'>
						{t('howItWorksTitle')}
					</h2>
					<p className='mx-auto max-w-2xl text-lg text-text-secondary'>
						{t('howItWorksSubtitle')}
					</p>
				</motion.div>

				<StackedCards stackOffset={20} scaleStep={0.04}>
					<div className='flex h-[70vh] items-center justify-center rounded-3xl bg-gradient-to-br from-brand/10 to-xp/10 p-12'>
						<div className='max-w-lg text-center'>
							<ChefHat className='mx-auto mb-4 size-12 text-brand' />
							<h3 className='mb-3 text-3xl font-black text-text-primary'>
								{t('featureCookingTitle')}
							</h3>
							<p className='text-lg text-text-secondary'>
								{t('featureCookingDesc')}
							</p>
						</div>
					</div>
					<div className='flex h-[70vh] items-center justify-center rounded-3xl bg-gradient-to-br from-xp/10 to-level/10 p-12'>
						<div className='max-w-lg text-center'>
							<Share2 className='mx-auto mb-4 size-12 text-xp' />
							<h3 className='mb-3 text-3xl font-black text-text-primary'>
								{t('featureCreatorTitle')}
							</h3>
							<p className='text-lg text-text-secondary'>
								{t('featureCreatorDesc')}
							</p>
						</div>
					</div>
					<div className='flex h-[70vh] items-center justify-center rounded-3xl bg-gradient-to-br from-streak/10 to-brand/10 p-12'>
						<div className='max-w-lg text-center'>
							<Trophy className='mx-auto mb-4 size-12 text-streak' />
							<h3 className='mb-3 text-3xl font-black text-text-primary'>
								{t('featureXpTitle')}
							</h3>
							<p className='text-lg text-text-secondary'>
								{t('featureXpDesc')}
							</p>
						</div>
					</div>
				</StackedCards>
			</div>
		</section>
	)
}

// ============================================
// CTA SECTION
// ============================================

const CTASection = () => {
	const t = useTranslations('welcome')
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()

	return (
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
			<div className='container relative mx-auto max-w-4xl px-6 text-center z-10'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={TRANSITION_SPRING}
				>
					<h2 className='mb-6 text-4xl font-bold text-text-primary md:text-5xl'>
						{t('readyToLevelUp')}
					</h2>
					<p className='mb-10 text-lg text-text-secondary'>
						{t('ctaDescription')}
					</p>

					<div className='flex flex-col items-center justify-center gap-6 sm:flex-row'>
						<motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
							<ShinyButton
								onClick={() =>
									startNavigationTransition(() => {
										router.push(PATHS.AUTH.SIGN_UP)
									})
								}
								disabled={isNavigating}
								size='lg'
								className='px-10 py-6 text-lg font-bold text-white shadow-warm rounded-2xl'
							>
								{t('createFreeAccount')}
								<ArrowRight className='ml-2 size-5' />
							</ShinyButton>
						</motion.div>

						<motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
							<Button
								onClick={() =>
									startNavigationTransition(() => {
										router.push(PATHS.AUTH.SIGN_IN)
									})
								}
								disabled={isNavigating}
								variant='outline'
								size='lg'
								className='border-2 border-border-medium bg-bg-card/50 backdrop-blur-md px-8 py-6 text-lg font-semibold text-text-primary hover:border-brand hover:text-brand disabled:opacity-50 rounded-2xl'
							>
								{t('signIn')}
							</Button>
						</motion.div>
					</div>

					<p className='mt-6 text-sm text-text-muted'>{t('ctaDisclaimer')}</p>
				</motion.div>
			</div>

			{/* Loading indicator */}
			<AnimatePresence>
				{isNavigating && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed left-1/2 top-20 z-toast -translate-x-1/2'
					>
						<div className='flex items-center gap-2 rounded-full bg-bg-card px-4 py-2 text-sm font-semibold text-brand shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
							{t('loading')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</WavyBackground>
	)
}

// ============================================
// MAIN PAGE
// ============================================

export default function WelcomePage() {
	return (
		<div className='min-h-screen bg-bg'>
			<HeroSection />
			<FeaturesSection />
			<HowItWorksSection />
			<CTASection />
		</div>
	)
}
