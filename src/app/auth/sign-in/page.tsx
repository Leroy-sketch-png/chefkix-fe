'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SignInForm } from '@/components/auth/SignInForm'
import { SIGN_IN_MESSAGES } from '@/constants/messages'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, Sparkles } from 'lucide-react'
import { LazyLottie } from '@/components/shared/LazyLottie'
import { cn } from '@/lib/utils'

/**
 * Floating gradient orbs - purely decorative ambient effects
 * Uses CSS animations (GPU-accelerated, zero JS overhead) instead of Framer Motion
 * Animation is subtle and stops after 3 cycles to save CPU
 */
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

const SignInPage = () => {
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4'>
			{/* Warm gradient background */}
			<div className='absolute inset-0 bg-gradient-to-br from-brand/5 via-bg to-xp/5' />

			{/* Floating decorative orbs */}
			<FloatingOrb
				className='absolute -left-32 top-1/4 size-64 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 blur-3xl'
				delay={0}
			/>
			<FloatingOrb
				className='absolute -right-32 bottom-1/4 size-80 rounded-full bg-gradient-to-br from-xp/20 to-xp/5 blur-3xl'
				delay={2}
			/>
			<FloatingOrb
				className='absolute -bottom-20 left-1/3 size-48 rounded-full bg-gradient-to-br from-streak/20 to-streak/5 blur-3xl'
				delay={4}
			/>

			{/* Background Lottie Animation - lazy loaded with theatrical entrance */}
			<div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-10'>
				<LazyLottie
					src='/lottie/lottie-login.json'
					sizeOfIllustrator={(w, h) => Math.min(w * 0.5, h * 0.6, 400)}
					entrance='fade'
					loop
					autoplay
				/>
			</div>

			{/* Main Content - No z-index manipulation to avoid stacking context issues */}
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className='relative w-full max-w-md'
			>
				{/* Logo & Branding */}
				<motion.div
					variants={staggerItem}
					className='mb-8 flex flex-col items-center'
				>
					<motion.div
						whileHover={{ rotate: 10, scale: 1.1 }}
						transition={TRANSITION_SPRING}
						className='mb-4 flex size-20 items-center justify-center rounded-2xl bg-gradient-hero shadow-lg shadow-brand/30'
					>
						<ChefHat className='size-10 text-white' />
					</motion.div>
					<motion.h1
						className='mb-1 text-3xl font-bold text-text'
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						ChefKix
					</motion.h1>
					<motion.p
						className='flex items-center gap-1 text-sm text-text-muted'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<Sparkles className='size-3.5 text-streak' />
						Level up your cooking journey
					</motion.p>
				</motion.div>

				{/* Sign In Card - NOTE: No backdrop-blur to avoid stacking context issues with modals */}
				<motion.div
					variants={staggerItem}
					className='overflow-hidden rounded-3xl border border-border-subtle bg-bg-card p-8 shadow-xl shadow-black/5'
				>
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='mb-2 text-center text-2xl font-bold text-text'
					>
						{SIGN_IN_MESSAGES.PAGE_TITLE}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className='mb-8 text-center text-text-secondary'
					>
						{SIGN_IN_MESSAGES.PAGE_SUBTITLE}
					</motion.p>
					<SignInForm />
				</motion.div>
			</motion.div>
		</div>
	)
}

export default SignInPage
