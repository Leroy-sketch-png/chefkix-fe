'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { useTranslations } from '@/i18n/hooks'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, Sparkles, Zap, Trophy, Users, ArrowLeft } from 'lucide-react'
import { LazyLottie } from '@/components/shared/LazyLottie'
const SignUpPage = () => {
	const t = useTranslations('auth')
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-bg px-4 pb-8 pt-16 sm:justify-center sm:py-8'>
			{/* Primary Escape Hatch: High-visibility exit for guests to restore 'Tree' integrity */}
			<div className='absolute left-4 top-4 z-20 flex items-center gap-2 sm:left-8 sm:top-8'>
				<Link
					href='/welcome'
					className='flex size-10 items-center justify-center rounded-full bg-bg-card border border-border-subtle text-text-secondary shadow-sm transition-all hover:border-brand hover:text-brand hover:shadow-warm sm:size-12'
					title={t('backToWelcome')}
				>
					<ArrowLeft className='size-5' />
				</Link>

				<Link
					href={(() => {
						const protectedRoutes = [
							'/create',
							'/dashboard',
							'/profile',
							'/settings',
							'/notifications',
							'/messages',
							'/pantry',
							'/meal-planner',
						]
						const isProtected = protectedRoutes.some(route =>
							returnTo?.startsWith(route),
						)
						return returnTo && !isProtected ? returnTo : '/explore'
					})()}
					className='hidden h-10 items-center rounded-full bg-bg-card/50 border border-border-subtle px-5 text-sm font-bold text-text-secondary backdrop-blur-md transition-all hover:bg-brand/10 hover:border-brand hover:text-brand sm:flex sm:h-12'
				>
					{t('exploreAsGuest')}
				</Link>
			</div>
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
					className='mb-4 flex flex-col items-center sm:mb-6'
				>
					<motion.div
						whileHover={{ rotate: -10, scale: 1.1 }}
						transition={TRANSITION_SPRING}
						className='mb-2.5 flex size-12 items-center justify-center rounded-2xl bg-gradient-xp shadow-warm shadow-xp/30 sm:mb-4 sm:size-16'
					>
						<ChefHat className='size-6 text-white sm:size-8' />
					</motion.div>
					<motion.h1
						className='mb-1 text-2xl font-bold text-text sm:text-3xl'
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						{t('signUpTitle')}
					</motion.h1>
					<motion.p
						className='flex items-center gap-1 text-sm text-text-muted sm:text-base'
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
					className='mb-4 grid w-full grid-cols-3 gap-2 sm:mb-6 sm:flex sm:flex-wrap sm:justify-center'
				>
					{[
						{ icon: Zap, label: t('earnXp'), color: 'text-xp' },
						{
							icon: Trophy,
							label: t('levelUp'),
							color: 'text-level',
						},
						{
							icon: Users,
							label: t('joinCommunity'),
							color: 'text-brand',
						},
					].map((benefit, i) => (
						<motion.span
							key={benefit.label}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.4 + i * 0.1, ...TRANSITION_SPRING }}
							className='flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border-subtle bg-bg-card px-2 py-2 text-center text-xs font-semibold leading-tight text-text sm:min-h-0 sm:flex-row sm:rounded-full sm:px-3 sm:py-1.5 sm:text-sm'
						>
							<benefit.icon className={`size-3.5 ${benefit.color}`} />
							{benefit.label}
						</motion.span>
					))}
				</motion.div>

				{/* Sign Up Card - NOTE: No backdrop-blur to avoid stacking context issues with modals */}
				<motion.div
					variants={staggerItem}
					className='overflow-hidden rounded-3xl border border-border-subtle bg-bg-card p-5 shadow-warm shadow-black/5 sm:p-8'
				>
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='mb-2 text-center text-xl font-bold text-text sm:text-2xl'
					>
						{t('signUpPageTitle')}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className='mb-5 text-center text-sm leading-relaxed text-text-secondary sm:mb-6 sm:text-base'
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
