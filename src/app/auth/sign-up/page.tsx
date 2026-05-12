'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { useTranslations } from '@/i18n/hooks'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, Sparkles, ArrowLeft } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
const SignUpPage = () => {
	const t = useTranslations('auth')
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
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
			<motion.div
				variants={staggerContainer}
				initial='hidden'
				animate='visible'
				className='relative w-full max-w-md'
			>
				{/* header controls removed here and will be rendered inside the card for cohesive surface */}

				<motion.div
					variants={staggerItem}
					className='mb-3 flex flex-col items-center sm:mb-4'
				>
					<motion.div className='mb-2 flex size-10 items-center justify-center rounded-2xl bg-gradient-xp shadow-warm shadow-xp/30 sm:mb-4 sm:size-16'>
						<ChefHat className='size-5 text-white sm:size-8' />
					</motion.div>
					<motion.h1
						className='mb-0.5 text-xl font-bold text-text-primary sm:text-3xl'
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

				<motion.div
					variants={staggerItem}
					className='relative overflow-hidden rounded-3xl border border-border-subtle/80 bg-gradient-to-br from-bg-card/98 via-bg-card to-bg-elevated/70 p-4 shadow-warm shadow-black/5 sm:p-8'
				>
					<div className='pointer-events-none absolute -left-10 -top-14 size-32 rounded-full bg-brand/10 blur-3xl' />
					<div className='pointer-events-none absolute -bottom-16 -right-12 size-32 rounded-full bg-xp/10 blur-3xl' />
					<div className='pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/25 via-white/8 to-transparent' />
					<div className='pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/18' />

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
							className='hidden h-10 items-center rounded-full border border-border-subtle bg-bg-card/50 px-5 text-sm font-bold text-text-secondary backdrop-blur-md transition-all hover:border-brand hover:bg-brand/10 hover:text-brand sm:flex sm:h-12'
						>
							{t('exploreAsGuest')}
						</Link>
					</div>

					<div className='relative z-10'>
						<SignUpForm />
					</div>
				</motion.div>
			</motion.div>
		</AuthLayout>
	)
}

export default SignUpPage
