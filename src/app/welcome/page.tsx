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

// ============================================
// HERO SECTION
// ============================================

const HeroSection = () => {
	const t = useTranslations('welcome')
	const router = useRouter()
	const [isNavigating, startNavigationTransition] = useTransition()

	return (
		<section className='relative min-h-[90vh] overflow-hidden bg-bg flex items-center pt-24 pb-20'>
			{/* Dynamic background lighting */}
			<div className='absolute inset-0 overflow-hidden opacity-40 pointer-events-none'>
				<motion.div
					animate={{
						rotate: [0, 360],
						scale: [1, 1.2, 1],
					}}
					transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
					className='absolute -left-1/4 -top-1/4 size-[800px] rounded-full bg-gradient-to-br from-brand/30 via-xp/20 to-combo/10 blur-[120px]'
				/>
				<motion.div
					animate={{
						rotate: [360, 0],
						scale: [1, 1.3, 1],
					}}
					transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
					className='absolute -right-1/4 -bottom-1/4 size-[600px] rounded-full bg-gradient-to-tr from-streak/30 via-brand/20 to-xp/10 blur-[100px]'
				/>
			</div>

			<div className='container relative mx-auto max-w-7xl px-6'>
				<div className='grid lg:grid-cols-2 gap-12 items-center'>
					{/* Left: Text Content */}
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={TRANSITION_SPRING}
						className='max-w-2xl text-left'
					>
						{/* Logo + Brand */}
						<div className='mb-8 inline-flex items-center gap-3 rounded-full border border-brand/30 bg-brand/10 px-6 py-3 text-sm font-semibold text-brand shadow-[0_0_20px_rgba(var(--brand),0.2)] backdrop-blur-md'>
							<Sparkles className='size-4' />
							<span>{t('heroTagline')}</span>
						</div>

						<h1 className='mb-6 text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight text-text'>
							{t('heroTitle1')}{' '}
							<span className='bg-gradient-to-r from-brand via-xp to-combo bg-clip-text text-transparent drop-shadow-sm'>
								{t('heroTitlePro')}
							</span>
							<br />
							{t('heroTitle2')}{' '}
							<span className='bg-gradient-to-r from-streak to-combo bg-clip-text text-transparent drop-shadow-sm'>
								{t('heroTitleGamer')}
							</span>
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
									className='group relative overflow-hidden bg-gradient-hero px-10 py-7 text-xl font-bold text-white shadow-[0_0_40px_rgba(var(--brand),0.4)] transition-all hover:shadow-[0_0_60px_rgba(var(--brand),0.6)] disabled:opacity-50 rounded-2xl'
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
											router.push('/explore')
										})
									}
									disabled={isNavigating}
									variant='outline'
									size='lg'
									className='border-2 border-border-medium bg-bg/50 backdrop-blur-md px-8 py-7 text-xl font-semibold text-text transition-all hover:border-brand hover:text-brand disabled:opacity-50 rounded-2xl'
								>
									<PlayCircle className='mr-3 size-6' />
									{t('exploreRecipes')}
								</Button>
							</motion.div>
						</div>

						{/* Social Proof */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.4 }}
							className='mt-14 flex flex-wrap items-center gap-8 text-base font-medium text-text-muted'
						>
							<div className='flex items-center gap-3'>
								<div className='flex -space-x-4'>
									{[1, 2, 3, 4].map(i => (
										<div
											key={i}
											className='h-12 w-12 rounded-full border-2 border-bg bg-bg-card overflow-hidden relative shadow-sm'
										>
											<Image
												src='/placeholder-avatar.svg'
												alt='user'
												fill
												className='object-cover'
											/>
										</div>
									))}
								</div>
								<span>
									<strong className='text-text font-bold text-lg'>10k+</strong>{' '}
									{t('socialProofChefs')}
								</span>
							</div>
							<div className='hidden sm:flex items-center gap-2 border-l border-border pl-8'>
								<Trophy className='size-6 text-streak' />
								<div className='flex flex-col'>
									<span className='text-text font-bold leading-none'>
										4.9/5
									</span>
									<span className='text-xs leading-none mt-1'>App Store</span>
								</div>
							</div>
						</motion.div>
					</motion.div>

					{/* Right: Stunning Visuals */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ ...TRANSITION_SPRING, delay: 0.2 }}
						className='relative h-[650px] hidden lg:block'
					>
						{/* Main Image */}
						<motion.div
							className='absolute right-0 top-1/2 -translate-y-1/2 w-[420px] h-[520px] rounded-[2rem] overflow-hidden shadow-2xl z-20 border-[6px] border-bg/80'
							animate={{ y: ['-50%', '-52%', '-50%'] }}
							transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
						>
							<Image
								src='/images/hero/cacio-e-pepe.png'
								alt='Cacio e Pepe'
								fill
								className='object-cover'
								priority
							/>
							<div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent' />
							<div className='absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-black/40 p-5 rounded-2xl border border-white/20 text-white shadow-xl'>
								<div className='flex items-center justify-between mb-3'>
									<span className='font-bold text-xl'>
										Authentic Cacio e Pepe
									</span>
									<span className='flex items-center text-streak font-bold bg-streak/20 px-2 py-1 rounded-full text-sm'>
										<Flame className='w-4 h-4 mr-1' /> 94
									</span>
								</div>
								<div className='flex gap-2'>
									<span className='text-xs font-bold px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white/90'>
										Italian
									</span>
									<span className='text-xs font-bold px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white/90'>
										20m
									</span>
								</div>
							</div>
						</motion.div>

						{/* Secondary Image 1 */}
						<motion.div
							className='absolute left-4 top-8 w-[260px] h-[340px] rounded-[2rem] overflow-hidden shadow-xl z-10 border-[6px] border-bg/80'
							animate={{ y: [0, -15, 0] }}
							transition={{
								duration: 7,
								repeat: Infinity,
								ease: 'easeInOut',
								delay: 1,
							}}
						>
							<Image
								src='/images/hero/miso-ramen.png'
								alt='Miso Ramen'
								fill
								className='object-cover'
							/>
							<div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
							<div className='absolute bottom-5 left-5 text-white'>
								<span className='font-bold text-lg drop-shadow-md'>
									Tonkotsu Ramen
								</span>
							</div>
						</motion.div>

						{/* Secondary Image 2 */}
						<motion.div
							className='absolute left-10 bottom-6 w-[240px] h-[240px] rounded-[2rem] overflow-hidden shadow-2xl z-30 border-[6px] border-bg/80'
							animate={{ y: [0, 15, 0] }}
							transition={{
								duration: 5,
								repeat: Infinity,
								ease: 'easeInOut',
								delay: 2,
							}}
						>
							<Image
								src='/images/hero/avocado-toast.png'
								alt='Avocado Toast'
								fill
								className='object-cover'
							/>
							<div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
							<div className='absolute bottom-5 left-5 text-white'>
								<span className='font-bold text-lg drop-shadow-md'>
									Avocado Toast
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
									<p className='text-text-secondary'>
										{t(step.descriptionKey)}
									</p>
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
					<p className='mb-10 text-lg text-white/90'>{t('ctaDescription')}</p>

					<div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
						<motion.div whileHover={BUTTON_HOVER} whileTap={BUTTON_TAP}>
							<Button
								onClick={() =>
									startNavigationTransition(() => {
										router.push(PATHS.AUTH.SIGN_UP)
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
										router.push(PATHS.AUTH.SIGN_IN)
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

					<p className='mt-6 text-sm text-white/70'>{t('ctaDisclaimer')}</p>
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
