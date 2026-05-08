'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SignInForm } from '@/components/auth/SignInForm'
import { TRANSITION_SPRING, staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, ArrowLeft } from 'lucide-react'
import { LazyLottie } from '@/components/shared/LazyLottie'
import { DevQuickLogin } from '@/components/auth/DevQuickLogin'
import { useTranslations } from '@/i18n/hooks'
const SignInPage = () => {
	const t = useTranslations('auth')
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	return (
		<div className='relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-bg px-4 pb-8 pt-16 sm:justify-center sm:py-10'>
			<DevQuickLogin />
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
			<div className='absolute inset-0 bg-gradient-to-br from-brand/5 via-bg to-xp/5' />

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
				{/* Logo & Brand — compact, not a hero banner */}
				<motion.div
					variants={staggerItem}
					className='mb-3 flex items-center justify-center gap-2.5 sm:mb-5'
				>
					<motion.div
						whileHover={{ rotate: 10, scale: 1.1 }}
						transition={TRANSITION_SPRING}
						className='flex size-10 items-center justify-center rounded-xl bg-brand shadow-warm shadow-brand/20 sm:size-12'
					>
						<ChefHat className='size-5 text-white sm:size-6' />
					</motion.div>
					<motion.h1
						className='text-xl font-bold text-text sm:text-2xl'
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						{t('brandName')}
					</motion.h1>
				</motion.div>

				{/* Sign In Card */}
				<motion.div
					variants={staggerItem}
					className='relative overflow-hidden rounded-3xl border border-border-subtle/80 bg-gradient-to-br from-bg-card/97 via-bg-card/92 to-bg-elevated/70 p-5 shadow-warm shadow-black/5 backdrop-blur-sm sm:p-8'
				>
					{/* Ambient orbs */}
					<div className='pointer-events-none absolute -left-10 -top-14 size-32 rounded-full bg-brand/10 blur-3xl' />
					<div className='pointer-events-none absolute -bottom-16 -right-12 size-32 rounded-full bg-xp/10 blur-3xl' />
					{/* Top sheen */}
					<div className='pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/30 via-white/10 to-transparent dark:from-white/8' />
					{/* Inner ring */}
					<div className='pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 dark:ring-white/8' />
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='relative z-10 mb-5 text-center text-lg font-bold text-text sm:mb-6 sm:text-xl'
					>
						{t('pageTitle')}
					</motion.h2>
					<div className='relative z-10'>
						<SignInForm />
					</div>
				</motion.div>
			</motion.div>
		</div>
	)
}

export default SignInPage
