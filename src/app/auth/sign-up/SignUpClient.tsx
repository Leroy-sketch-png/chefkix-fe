'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { useTranslations } from '@/i18n/hooks'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { ChefHat, Sparkles, ArrowLeft, Compass, Users } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { getGuestBrowseHref, PATHS } from '@/constants'

const SignUpPage = () => {
	const t = useTranslations('auth')
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	const guestExploreHref = getGuestBrowseHref(returnTo)
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
					<motion.div className='mb-2 flex size-10 items-center justify-center rounded-2xl bg-brand shadow-warm shadow-brand/20 sm:mb-4 sm:size-16'>
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

				<motion.div variants={staggerItem}>
					<div className='overflow-hidden rounded-3xl border border-border-subtle/80 bg-bg-card/96 shadow-card'>
						<div className='border-b border-border-subtle/80 bg-gradient-to-r from-brand/8 via-bg-card to-xp/8 px-4 py-4 sm:px-8 sm:py-5'>
							<div className='mb-4 flex items-center justify-between'>
								<Link
									href={PATHS.HOME}
									className='flex size-10 items-center justify-center rounded-full border border-border-subtle bg-bg-card text-text-secondary shadow-card transition-all hover:border-brand hover:text-brand sm:size-12'
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
									<span className='inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-2xs font-bold uppercase tracking-widest text-brand'>
										<Users className='size-3' />
										{t('signUpAudiencePrimary')}
									</span>
									<span className='inline-flex items-center gap-1.5 rounded-full bg-bg-elevated px-3 py-1 text-2xs font-bold uppercase tracking-widest text-text-secondary'>
										<Compass className='size-3' />
										{t('signUpAudienceSecondary')}
									</span>
								</div>
								<p className='text-sm text-text-secondary'>
									{t('signUpPageSubtitle')}
								</p>
							</div>
						</div>

						<div className='px-4 py-4 sm:px-8 sm:py-6'>
							<SignUpForm />
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AuthLayout>
	)
}

export default SignUpPage
