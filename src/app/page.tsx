'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import {
	ChefHat,
	Sparkles,
	Trophy,
	Users,
	Flame,
	BookOpen,
	ArrowRight,
	Zap,
} from 'lucide-react'
import Link from 'next/link'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

const FloatingOrb = ({
	className,
	delay,
}: {
	className: string
	delay: number
}) => (
	<div
		className={cn('animate-float-orb opacity-30', className)}
		style={{ animationDelay: `${delay}s` }}
	/>
)

const features = [
	{
		icon: BookOpen,
		title: 'Smart Recipes',
		description: 'AI-powered recipe parsing with step-by-step guidance',
		gradient: 'bg-gradient-brand',
	},
	{
		icon: Flame,
		title: 'Cooking Sessions',
		description: 'Hands-free cooking with timers, voice, and live progress',
		gradient: 'bg-gradient-streak',
	},
	{
		icon: Trophy,
		title: 'Earn XP & Level Up',
		description: 'Gamified cooking — earn badges, climb leaderboards',
		gradient: 'bg-gradient-xp',
	},
	{
		icon: Users,
		title: 'Chef Community',
		description: 'Share creations, follow chefs, cook together live',
		gradient: 'bg-gradient-social',
	},
]

export default function HomePage() {
	const router = useRouter()
	const { user, isLoading } = useAuth()

	useEffect(() => {
		if (!isLoading && user) {
			router.push('/dashboard')
		}
	}, [user, isLoading, router])

	// Authenticated users get redirected — show nothing while loading
	if (isLoading || user) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-bg'>
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={TRANSITION_SPRING}
					className='flex size-20 items-center justify-center rounded-2xl bg-gradient-hero shadow-lg shadow-brand/30'
				>
					<ChefHat className='size-10 text-white' />
				</motion.div>
			</div>
		)
	}

	// Landing page for unauthenticated users
	return (
		<div className='relative min-h-screen overflow-hidden bg-bg'>
			{/* Ambient background */}
			<div className='absolute inset-0 bg-gradient-to-br from-brand/5 via-bg to-xp/5' />
			<FloatingOrb
				className='absolute -left-32 top-1/4 size-64 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 blur-3xl'
				delay={0}
			/>
			<FloatingOrb
				className='absolute -right-32 top-1/2 size-80 rounded-full bg-gradient-to-br from-xp/20 to-xp/5 blur-3xl'
				delay={2}
			/>
			<FloatingOrb
				className='absolute -bottom-20 left-1/3 size-48 rounded-full bg-gradient-to-br from-streak/20 to-streak/5 blur-3xl'
				delay={4}
			/>

			{/* Content */}
			<div className='relative'>
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
							Sign In
						</Link>
						<Link
							href='/auth/sign-up'
							className='rounded-radius bg-gradient-hero px-5 py-2 text-sm font-bold text-white shadow-card shadow-brand/25 transition-all hover:shadow-warm'
						>
							Get Started
						</Link>
					</div>
				</nav>

				{/* Hero Section */}
				<motion.section
					variants={staggerContainer}
					initial='hidden'
					animate='visible'
					className='mx-auto max-w-4xl px-6 pb-16 pt-12 text-center md:px-12 md:pt-20'
				>
					<motion.div variants={staggerItem}>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.1, ...TRANSITION_SPRING }}
							className='mx-auto mb-6 flex size-24 items-center justify-center rounded-2xl bg-gradient-hero shadow-xl shadow-brand/30'
						>
							<ChefHat className='size-12 text-white' />
						</motion.div>
					</motion.div>

					<motion.h1
						variants={staggerItem}
						className='mb-4 text-4xl font-extrabold leading-tight text-text md:text-6xl'
					>
						Cook. Level Up.
						<br />
						<span className='bg-gradient-to-r from-brand via-xp to-streak bg-clip-text text-transparent'>
							Share Your Journey.
						</span>
					</motion.h1>

					<motion.p
						variants={staggerItem}
						className='mx-auto mb-8 max-w-2xl text-lg text-text-secondary md:text-xl'
					>
						ChefKix turns cooking into a rewarding experience. AI-powered
						recipes, gamified progress, and a community of passionate home
						chefs.
					</motion.p>

					<motion.div
						variants={staggerItem}
						className='flex flex-col items-center justify-center gap-3 sm:flex-row'
					>
						<Link
							href='/auth/sign-up'
							className='group flex items-center gap-2 rounded-radius bg-gradient-hero px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/30 transition-all hover:shadow-xl hover:shadow-brand/40'
						>
							Start Cooking Free
							<ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
						</Link>
						<Link
							href='/auth/sign-in'
							className='flex items-center gap-2 rounded-radius border border-border-subtle bg-bg-card px-8 py-3.5 text-base font-semibold text-text shadow-card transition-all hover:shadow-warm'
						>
							I Have an Account
						</Link>
					</motion.div>

					{/* Social proof */}
					<motion.div
						variants={staggerItem}
						className='mt-8 flex items-center justify-center gap-2 text-sm text-text-muted'
					>
						<Sparkles className='size-4 text-streak' />
						<span>Join chefs earning XP and leveling up every day</span>
					</motion.div>
				</motion.section>

				{/* Features Grid */}
				<section className='mx-auto max-w-5xl px-6 pb-20 md:px-12'>
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
						{features.map((feature, i) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5 + i * 0.1, ...TRANSITION_SPRING }}
								className='group rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card transition-all hover:shadow-warm'
							>
								<div
									className={cn(
										'mb-3 flex size-10 items-center justify-center rounded-xl shadow-card',
										feature.gradient,
									)}
								>
									<feature.icon className='size-5 text-white' />
								</div>
								<h3 className='mb-1 font-bold text-text'>{feature.title}</h3>
								<p className='text-sm leading-relaxed text-text-secondary'>
									{feature.description}
								</p>
							</motion.div>
						))}
					</div>
				</section>

				{/* Bottom CTA */}
				<section className='border-t border-border-subtle bg-bg-card/50 px-6 py-12 text-center'>
					<div className='mx-auto max-w-lg'>
						<div className='mb-4 flex items-center justify-center gap-2'>
							<Zap className='size-5 text-xp' />
							<span className='text-sm font-semibold text-xp'>
								Gamified Cooking
							</span>
						</div>
						<h2 className='mb-3 text-2xl font-bold text-text'>
							Ready to level up your kitchen?
						</h2>
						<p className='mb-6 text-text-secondary'>
							Create your free account and start earning XP with every recipe
							you cook.
						</p>
						<Link
							href='/auth/sign-up'
							className='inline-flex items-center gap-2 rounded-radius bg-gradient-hero px-8 py-3 font-bold text-white shadow-lg shadow-brand/30 transition-all hover:shadow-xl'
						>
							<ChefHat className='size-5' />
							Get Started Free
						</Link>
					</div>
				</section>
			</div>
		</div>
	)
}
