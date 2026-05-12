'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SignInForm } from '@/components/auth/SignInForm'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, ArrowLeft } from 'lucide-react'
import { DevQuickLogin } from '@/components/auth/DevQuickLogin'
import { useTranslations } from '@/i18n/hooks'
import { AuthLayout } from '@/components/layout/AuthLayout'
const SignInPage = () => {
	const t = useTranslations('auth')
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	const showDevQuickLogin =
		process.env.NEXT_PUBLIC_ENABLE_DEV_QUICK_LOGIN === 'true'
	const guestExploreHref = (() => {
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
	})()
	return (
		<AuthLayout className='px-4 py-8 sm:py-8'>
			{showDevQuickLogin ? <DevQuickLogin /> : null}

			<div className='relative w-full max-w-md'>
				<motion.div
					variants={staggerContainer}
					initial='hidden'
					animate='visible'
					className='relative w-full'
				>
					<motion.div
						variants={staggerItem}
						className='mb-3 flex items-center justify-center gap-2 sm:mb-4'
					>
						<motion.div className='flex size-9 items-center justify-center rounded-xl bg-brand shadow-warm shadow-brand/20 sm:size-12'>
							<ChefHat className='size-4.5 text-white sm:size-6' />
						</motion.div>
						<motion.h1
							className='text-lg font-bold text-text-primary sm:text-2xl'
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
						>
							{t('brandName')}
						</motion.h1>
					</motion.div>

					{/* Sign In Card with header controls moved inside for cohesive layout */}
					<motion.div
						variants={staggerItem}
						className='relative overflow-hidden rounded-3xl border border-border-subtle/80 bg-gradient-to-br from-bg-card/97 via-bg-card/92 to-bg-elevated/70 p-4 shadow-warm shadow-black/5 backdrop-blur-sm sm:p-8'
					>
						<div className='pointer-events-none absolute -left-10 -top-14 size-32 rounded-full bg-brand/10 blur-3xl' />
						<div className='pointer-events-none absolute -bottom-16 -right-12 size-32 rounded-full bg-xp/10 blur-3xl' />
						<div className='pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/30 via-white/10 to-transparent dark:from-white/8' />
						<div className='pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 dark:ring-white/8' />

						<div className='relative z-10 mb-4 flex items-center justify-between'>
							<Link
								href='/'
								className='flex size-10 items-center justify-center rounded-full border border-border-subtle bg-bg-card text-text-secondary shadow-sm transition-all hover:border-brand hover:text-brand hover:shadow-warm sm:size-12'
								title={t('backToWelcome')}
							>
								<ArrowLeft className='size-5' />
							</Link>

							<Link
								href={guestExploreHref}
								className='inline-flex h-10 items-center rounded-full border border-border-subtle bg-bg-card/50 px-4 text-xs font-bold text-text-secondary backdrop-blur-md transition-all hover:border-brand hover:bg-brand/10 hover:text-brand sm:h-12 sm:px-5 sm:text-sm'
							>
								{t('exploreAsGuest')}
							</Link>
						</div>

						<motion.h2
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className='relative z-10 mb-4 text-center text-lg font-bold text-text-primary sm:mb-5 sm:text-xl'
						>
							{t('pageTitle')}
						</motion.h2>

						<div className='relative z-10'>
							<SignInForm />
						</div>
					</motion.div>
				</motion.div>
			</div>
		</AuthLayout>
	)
}

export default SignInPage
