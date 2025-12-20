'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { SIGN_UP_MESSAGES } from '@/constants/messages'
import dynamic from 'next/dynamic'
import lottieRegister from '@/../public/lottie/lottie-register.json'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, Sparkles, Zap, Trophy, Users } from 'lucide-react'

const LottieAnimation = dynamic(
	() => import('@/components/shared/LottieAnimation'),
	{ ssr: false },
)

// Floating gradient orbs for visual delight
const FloatingOrb = ({
	className,
	delay,
}: {
	className: string
	delay: number
}) => (
	<motion.div
		initial={{ opacity: 0, scale: 0.5 }}
		animate={{
			opacity: [0.3, 0.6, 0.3],
			scale: [1, 1.2, 1],
			y: [0, -20, 0],
		}}
		transition={{
			duration: 8,
			delay,
			repeat: Infinity,
			ease: 'easeInOut',
		}}
		className={className}
	/>
)

const SignUpPage = () => {
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4 py-8'>
			{/* Warm gradient background */}
			<div className='absolute inset-0 bg-gradient-to-br from-xp/5 via-bg to-brand/5' />

			{/* Floating decorative orbs */}
			<FloatingOrb
				className='absolute -right-32 top-1/4 size-64 rounded-full bg-gradient-to-br from-xp/20 to-xp/5 blur-3xl'
				delay={0}
			/>
			<FloatingOrb
				className='absolute -left-32 bottom-1/4 size-80 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 blur-3xl'
				delay={2}
			/>
			<FloatingOrb
				className='absolute -top-20 right-1/3 size-48 rounded-full bg-gradient-to-br from-level/20 to-level/5 blur-3xl'
				delay={4}
			/>

			{/* Background Lottie Animation */}
			<div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-10'>
				<LottieAnimation
					lottie={lottieRegister}
					sizeOfIllustrator={(w, h) => Math.min(w * 0.5, h * 0.6, 400)}
					loop
					autoplay
				/>
			</div>

			{/* Main Content */}
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className='relative z-10 w-full max-w-md'
			>
				{/* Logo & Branding */}
				<motion.div
					variants={staggerItem}
					className='mb-6 flex flex-col items-center'
				>
					<motion.div
						whileHover={{ rotate: -10, scale: 1.1 }}
						transition={TRANSITION_SPRING}
						className='mb-4 flex size-20 items-center justify-center rounded-2xl bg-gradient-xp shadow-lg shadow-xp/30'
					>
						<ChefHat className='size-10 text-white' />
					</motion.div>
					<motion.h1
						className='mb-1 text-3xl font-bold text-text'
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						Join ChefKix
					</motion.h1>
					<motion.p
						className='flex items-center gap-1 text-sm text-text-muted'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<Sparkles className='size-3.5 text-level' />
						Start your culinary adventure
					</motion.p>
				</motion.div>

				{/* Benefits Pills */}
				<motion.div
					variants={staggerItem}
					className='mb-6 flex flex-wrap justify-center gap-2'
				>
					{[
						{ icon: Zap, label: 'Earn XP', color: 'bg-xp/10 text-xp' },
						{
							icon: Trophy,
							label: 'Level Up',
							color: 'bg-level/10 text-level',
						},
						{
							icon: Users,
							label: 'Join Community',
							color: 'bg-brand/10 text-brand',
						},
					].map((benefit, i) => (
						<motion.span
							key={benefit.label}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.4 + i * 0.1, ...TRANSITION_SPRING }}
							className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${benefit.color}`}
						>
							<benefit.icon className='size-3.5' />
							{benefit.label}
						</motion.span>
					))}
				</motion.div>

				{/* Sign Up Card */}
				<motion.div
					variants={staggerItem}
					className='overflow-hidden rounded-3xl border border-border-subtle bg-bg-card/95 p-8 shadow-xl shadow-black/5 backdrop-blur-md'
				>
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='mb-2 text-center text-2xl font-bold text-text'
					>
						{SIGN_UP_MESSAGES.PAGE_TITLE}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className='mb-6 text-center text-text-secondary'
					>
						{SIGN_UP_MESSAGES.PAGE_SUBTITLE}
					</motion.p>
					<SignUpForm />
				</motion.div>
			</motion.div>
		</div>
	)
}

export default SignUpPage
