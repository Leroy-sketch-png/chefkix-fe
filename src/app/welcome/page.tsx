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
	Sparkles,
	TrendingUp,
	Clock,
	Target,
	Zap,
	ArrowRight,
	PlayCircle,
	Loader2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
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

// ============================================
// HERO SECTION
// ============================================

const HeroSection = () => {
	const t = useTranslations('welcome')
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()

	return (
		<section className='relative overflow-hidden bg-gradient-to-br from-brand/10 via-bg to-xp/5 pb-20 pt-32'>
			{/* Animated background elements */}
			<div className='absolute inset-0 overflow-hidden opacity-30'>
				<motion.div
					animate={{
						rotate: [0, 360],
						scale: [1, 1.2, 1],
					}}
					transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
					className='absolute -right-32 -top-32 size-96 rounded-full bg-gradient-to-br from-brand to-xp blur-3xl'
				/>
				<motion.div
					animate={{
						rotate: [360, 0],
						scale: [1, 1.1, 1],
					}}
					transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
					className='absolute -bottom-32 -left-32 size-96 rounded-full bg-gradient-to-tr from-streak to-combo blur-3xl'
				/>
			</div>

			<div className='container relative mx-auto max-w-7xl px-6'>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mx-auto max-w-4xl text-center'
				>
					{/* Logo + Brand */}
					<div className='mb-6 inline-flex items-center gap-3 rounded-full border border-brand/30 bg-brand/10 px-6 py-3 text-sm font-semibold text-brand shadow-card'>
						<Sparkles className='size-4' />
						{t('heroTagline')}
					</div>

					<h1 className='mb-6 text-5xl font-bold leading-tight text-text md:text-7xl'>
						{t('heroTitle1')}{' '}
						<span className='bg-gradient-hero bg-clip-text text-transparent'>
							{t('heroTitlePro')}
						</span>
						,<br />
						{t('heroTitle2')}{' '}
						<span className='bg-gradient-xp bg-clip-text text-transparent'>
							{t('heroTitleGamer')}
						</span>
					</h1>

					<p className='mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl'>
						{t('heroDescription')}
					</p>

					{/* CTA Buttons */}
					<div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
						<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
							<Button
								onClick={() =>
									startNavigationTransition(() => {
										router.push('/signup')
									})
								}
								disabled={isNavigating}
								size='lg'
								className='group relative overflow-hidden bg-gradient-hero px-8 py-6 text-lg font-bold text-white shadow-warm shadow-brand/40 disabled:opacity-50'
							>
								<span className='relative z-10 flex items-center gap-2'>
									{t('startCooking')}
									<ArrowRight className='size-5 transition-transform group-hover:translate-x-1' />
								</span>
							</Button>
						</motion.div>

						<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
							<Button
								onClick={() =>
									startNavigationTransition(() => {
										router.push('/explore')
									})
								}
								disabled={isNavigating}
								variant='outline'
								size='lg'
								className='border-2 border-border-medium bg-bg-card px-8 py-6 text-lg font-semibold text-text transition-all hover:border-brand hover:text-brand disabled:opacity-50'
							>
								<PlayCircle className='mr-2 size-5' />
								{t('exploreRecipes')}
							</Button>
						</motion.div>
					</div>

					{/* Social Proof */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
						className='mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted'
					>
						<div className='flex items-center gap-2'>
							<Users className='size-4 text-brand' />
							<span>{t('socialProofChefs')}</span>
						</div>
						<div className='flex items-center gap-2'>
							<BookOpen className='size-4 text-xp' />
							<span>{t('socialProofRecipes')}</span>
						</div>
						<div className='flex items-center gap-2'>
							<Trophy className='size-4 text-combo' />
							<span>{t('socialProofMeals')}</span>
						</div>
					</motion.div>
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
						<div className='flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
						{t('loading')}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	</section>
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
					<h2 className='mb-4 text-4xl font-bold text-text md:text-5xl'>
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
							<motion.div
								key={feature.titleKey}
								variants={staggerItem}
								whileHover={CARD_HOVER}
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
								<h3 className='mb-3 text-xl font-bold text-text'>
								{t(feature.titleKey)}
							</h3>
							<p className='leading-relaxed text-text-secondary'>
								{t(feature.descriptionKey)}
								</p>
							</motion.div>
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
	const steps = [
		{
			number: '01',
			titleKey: 'step01Title' as const,
			descriptionKey: 'step01Desc' as const,
			icon: BookOpen,
		},
		{
			number: '02',
			titleKey: 'step02Title' as const,
			descriptionKey: 'step02Desc' as const,
			icon: ChefHat,
		},
		{
			number: '03',
			titleKey: 'step03Title' as const,
			descriptionKey: 'step03Desc' as const,
			icon: Trophy,
		},
		{
			number: '04',
			titleKey: 'step04Title' as const,
			descriptionKey: 'step04Desc' as const,
			icon: Zap,
		},
	]

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
					<h2 className='mb-4 text-4xl font-bold text-text md:text-5xl'>
						{t('howItWorksTitle')}
					</h2>
					<p className='mx-auto max-w-2xl text-lg text-text-secondary'>
						{t('howItWorksSubtitle')}
					</p>
				</motion.div>

				<div className='grid gap-12 md:grid-cols-2 lg:grid-cols-4'>
					{steps.map((step, index) => {
						const Icon = step.icon
						return (
							<motion.div
								key={step.number}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1, ...TRANSITION_SPRING }}
								className='relative'
							>
								{/* Connector line (except last) */}
								{index < steps.length - 1 && (
									<div className='absolute left-1/2 top-12 hidden h-0.5 w-full -translate-x-1/2 bg-gradient-to-r from-brand/50 to-transparent lg:block' />
								)}

								<div className='relative text-center'>
									<div className='relative mx-auto mb-6 inline-flex size-20 items-center justify-center rounded-2xl bg-gradient-hero shadow-warm shadow-brand/40'>
										<Icon className='size-10 text-white' />
										<span className='absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-xp text-xs font-bold text-white shadow-card'>
											{step.number}
										</span>
									</div>
									<h3 className='mb-3 text-xl font-bold text-text'>
										{t(step.titleKey)}
									</h3>
									<p className='text-text-secondary'>{t(step.descriptionKey)}</p>
								</div>
							</motion.div>
						)
					})}
				</div>
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
		<section className='relative overflow-hidden bg-gradient-to-br from-brand via-xp to-combo py-24'>
			<div className='container relative mx-auto max-w-4xl px-6 text-center'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={TRANSITION_SPRING}
				>
					<h2 className='mb-6 text-4xl font-bold text-white md:text-5xl'>
						{t('readyToLevelUp')}
					</h2>
					<p className='mb-10 text-lg text-white/90'>
						{t('ctaDescription')}
					</p>

					<div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
						<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
							<Button
								onClick={() =>
									startNavigationTransition(() => {
										router.push('/signup')
									})
								}
								disabled={isNavigating}
								size='lg'
								className='bg-white px-8 py-6 text-lg font-bold text-brand shadow-warm hover:bg-white/90 disabled:opacity-50'
							>
								{t('createFreeAccount')}
								<ArrowRight className='ml-2 size-5' />
							</Button>
						</motion.div>

						<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
							<Button
								onClick={() =>
									startNavigationTransition(() => {
										router.push('/login')
									})
								}
								disabled={isNavigating}
								variant='outline'
								size='lg'
								className='border-2 border-white bg-transparent px-8 py-6 text-lg font-semibold text-white hover:bg-white/10 disabled:opacity-50'
							>
								{t('signIn')}
							</Button>
						</motion.div>
					</div>

					<p className='mt-6 text-sm text-white/70'>
						{t('ctaDisclaimer')}
					</p>
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
						<div className='flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow-warm'>
							<Loader2 className='size-4 animate-spin' />
							{t('loading')}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</section>
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
