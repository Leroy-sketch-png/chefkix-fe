'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import { cn } from '@/lib/utils'

// ============================================
// HERO SECTION
// ============================================

const HeroSection = () => {
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
						Level up your cooking game
					</div>

					<h1 className='mb-6 text-5xl font-bold leading-tight text-text md:text-7xl'>
						Cook like a{' '}
						<span className='bg-gradient-hero bg-clip-text text-transparent'>
							pro
						</span>
						,<br />
						play like a{' '}
						<span className='bg-gradient-xp bg-clip-text text-transparent'>
							gamer
						</span>
					</h1>

					<p className='mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl'>
						ChefKix turns every recipe into an adventure. Earn XP, unlock
						badges, build streaks, and compete with friends — all while mastering
						real cooking skills.
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
									Start Cooking
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
								Explore Recipes
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
							<span>50K+ home chefs</span>
						</div>
						<div className='flex items-center gap-2'>
							<BookOpen className='size-4 text-xp' />
							<span>10K+ recipes</span>
						</div>
						<div className='flex items-center gap-2'>
							<Trophy className='size-4 text-combo' />
							<span>500K+ meals cooked</span>
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
							Loading...
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
		title: 'XP & Leveling System',
		description:
			'Every dish you cook earns XP. Level up from Kitchen Newbie to Master Chef and unlock exclusive recipes and badges.',
		gradient: 'from-brand to-brand/60',
		color: 'text-brand',
	},
	{
		icon: Flame,
		title: 'Daily Streaks',
		description:
			'Cook consistently to build epic streaks. Lose them and everyone on your leaderboard knows — pressure creates diamonds.',
		gradient: 'from-streak to-streak/60',
		color: 'text-streak',
	},
	{
		icon: Target,
		title: 'Guided Cooking Mode',
		description:
			'Step-by-step HUD with hands-free voice navigation. Chef tips, timing cues, and visual guides keep you on track.',
		gradient: 'from-xp to-xp/60',
		color: 'text-xp',
	},
	{
		icon: Users,
		title: 'Friend Challenges',
		description:
			'Challenge friends to cook-offs, climb the weekly leaderboard, and show off your culinary achievements.',
		gradient: 'from-combo to-combo/60',
		color: 'text-combo',
	},
	{
		icon: Sparkles,
		title: 'Recipe Quality Score',
		description:
			'AI-powered quality ratings from Foolproof to Expert. Find your level and grow at your own pace.',
		gradient: 'from-accent-purple to-accent-purple/60',
		color: 'text-accent-purple',
	},
	{
		icon: TrendingUp,
		title: 'Creator Dashboard',
		description:
			'Share your recipes and track performance. See who is cooking your dishes and earn XP when they succeed.',
		gradient: 'from-brand to-brand/60',
		color: 'text-brand',
	},
]

const FeaturesSection = () => {
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
						Why ChefKix is Different
					</h2>
					<p className='mx-auto max-w-2xl text-lg text-text-secondary'>
						Not another recipe app. A complete cooking RPG where your skills actually
						matter.
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
								key={feature.title}
								variants={staggerItem}
								whileHover={{ y: -4, scale: 1.02 }}
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
									{feature.title}
								</h3>
								<p className='leading-relaxed text-text-secondary'>
									{feature.description}
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
	const steps = [
		{
			number: '01',
			title: 'Choose Your Recipe',
			description:
				'Browse 10K+ recipes filtered by difficulty, time, and your taste profile. Every recipe shows its quality score.',
			icon: BookOpen,
		},
		{
			number: '02',
			title: 'Enter Cooking Mode',
			description:
				'Hands-free HUD guides you through each step. Voice commands, timers, and chef tips keep you on track.',
			icon: ChefHat,
		},
		{
			number: '03',
			title: 'Earn XP & Badges',
			description:
				'Complete the recipe to earn XP, build your streak, and unlock badges. Share your creation with the community.',
			icon: Trophy,
		},
		{
			number: '04',
			title: 'Level Up',
			description:
				'Track your progress, compete on leaderboards, and unlock harder recipes as you master techniques.',
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
						How It Works
					</h2>
					<p className='mx-auto max-w-2xl text-lg text-text-secondary'>
						Four simple steps to transform your kitchen into a gaming arena
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
										{step.title}
									</h3>
									<p className='text-text-secondary'>{step.description}</p>
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
						Ready to Level Up?
					</h2>
					<p className='mb-10 text-lg text-white/90'>
						Join 50,000+ home chefs turning every meal into an achievement. Free
						forever.
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
								Create Free Account
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
								Sign In
							</Button>
						</motion.div>
					</div>

					<p className='mt-6 text-sm text-white/70'>
						No credit card required • Free forever • Cancel anytime
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
							Loading...
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
