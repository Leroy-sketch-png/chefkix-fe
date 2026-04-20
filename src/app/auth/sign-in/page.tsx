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
			{/* Back to browsing escape hatch — guests must never be trapped */}
			<Link
				href={returnTo && returnTo.startsWith('/') ? returnTo : '/explore'}
				className='absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-radius px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
			>
				<ArrowLeft className='size-4' />
				{t('backToBrowsing')}
			</Link>
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
					className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-warm shadow-black/5 sm:p-8'
				>
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='mb-5 text-center text-lg font-bold text-text sm:mb-6 sm:text-xl'
					>
						{t('pageTitle')}
					</motion.h2>
					<SignInForm />
				</motion.div>
			</motion.div>
		</div>
	)
}

export default SignInPage
