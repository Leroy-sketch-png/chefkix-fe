'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SignInForm } from '@/components/auth/SignInForm'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, ArrowLeft, Compass, Users } from 'lucide-react'
import { DevQuickLogin } from '@/components/auth/DevQuickLogin'
import { useTranslations } from '@/i18n/hooks'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { getGuestBrowseHref, PATHS } from '@/constants'

const SignInPage = () => {
	const t = useTranslations('auth')
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	const showDevQuickLogin =
		process.env.NEXT_PUBLIC_ENABLE_DEV_QUICK_LOGIN === 'true'
	const guestExploreHref = getGuestBrowseHref(returnTo)
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

					<motion.div variants={staggerItem}>
						<div className='overflow-hidden rounded-3xl border border-border-subtle/80 bg-bg-card/96 shadow-card'>
							<div className='border-b border-border-subtle/80 bg-gradient-to-r from-brand/8 via-bg-card to-streak/8 px-4 py-4 sm:px-8 sm:py-5'>
								<div className='mb-4 flex items-center justify-between'>
									<Link
										href={PATHS.HOME}
										className='flex size-10 items-center justify-center rounded-full border border-border-subtle bg-bg-card text-text-secondary shadow-sm transition-all hover:border-brand hover:text-brand sm:size-12'
										title={t('backToWelcome')}
									>
										<ArrowLeft className='size-5' />
									</Link>

									<Link
										href={guestExploreHref}
										className='inline-flex h-10 items-center rounded-full border border-border-subtle bg-bg-card px-4 text-xs font-bold text-text-secondary transition-all hover:border-brand hover:bg-brand/10 hover:text-brand sm:h-12 sm:px-5 sm:text-sm'
									>
										{t('exploreAsGuest')}
									</Link>
								</div>

								<div className='space-y-2 text-center sm:text-left'>
									<div className='flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
										<span className='inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
											<Users className='size-3' />
											{t('signInAudiencePrimary')}
										</span>
										<span className='inline-flex items-center gap-1.5 rounded-full bg-bg-elevated px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary'>
											<Compass className='size-3' />
											{t('signInAudienceSecondary')}
										</span>
									</div>
									<motion.h2
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3 }}
										className='text-lg font-bold text-text-primary sm:text-2xl'
									>
										{t('pageTitle')}
									</motion.h2>
									<p className='text-sm text-text-secondary'>
										{t('pageSubtitle')}
									</p>
								</div>
							</div>

							<div className='px-4 py-4 sm:px-8 sm:py-6'>
								<SignInForm />
							</div>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</AuthLayout>
	)
}

export default SignInPage
