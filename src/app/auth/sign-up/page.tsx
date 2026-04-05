'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { useTranslations } from '@/i18n/hooks'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, Sparkles, Zap, Trophy, Users } from 'lucide-react'
import { LazyLottie } from '@/components/shared/LazyLottie'
const SignUpPage = () => {
	const t = useTranslations('auth')
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4 py-8'>
			{/* Warm gradient background */}
			<div className='absolute inset-0 bg-gradient-to-br from-xp/5 via-bg to-brand/5' />

			{/* Background Lottie Animation - lazy loaded with theatrical entrance */}
			<div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-10'>
				<LazyLottie
					src='/lottie/lottie-register.json'
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
						{t('signUpTitle')}
					</motion.h1>
					<motion.p
						className='flex items-center gap-1 text-sm text-text-muted'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<Sparkles className='size-3.5 text-level' />
						{t('signUpSubtitle')}
					</motion.p>
				</motion.div>

				{/* Benefits Pills */}
				<motion.div
					variants={staggerItem}
					className='mb-6 flex flex-wrap justify-center gap-2'
				>
					{[
						{ icon: Zap, label: t('earnXp'), color: 'bg-xp/10 text-xp' },
						{
							icon: Trophy,
							label: t('levelUp'),
							color: 'bg-level/10 text-level',
						},
						{
							icon: Users,
							label: t('joinCommunity'),
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

				{/* Sign Up Card - NOTE: No backdrop-blur to avoid stacking context issues with modals */}
				<motion.div
					variants={staggerItem}
					className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card p-8 shadow-xl shadow-black/5'
				>
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='mb-2 text-center text-2xl font-bold text-text'
					>
						{t('signUpPageTitle')}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className='mb-6 text-center text-text-secondary'
					>
						{t('signUpPageSubtitle')}
					</motion.p>
					<SignUpForm />
				</motion.div>
			</motion.div>
		</div>
	)
}

export default SignUpPage
