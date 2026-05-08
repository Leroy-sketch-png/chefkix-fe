'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

const STORAGE_KEY = 'chefkix-cookie-consent'

interface CookieConsentProps {
	/** Called when user accepts cookies. */
	onAccept?: () => void
	/** Called when user declines cookies. */
	onDecline?: () => void
	/** Link to privacy policy page. */
	privacyHref?: string
	className?: string
}

/**
 * Cookie consent banner — slides up from bottom.
 * Persists choice to localStorage so it only shows once.
 *
 * @example
 * <CookieConsent privacyHref="/privacy" />
 */
export function CookieConsent({
	onAccept,
	onDecline,
	privacyHref = '/privacy',
	className,
}: CookieConsentProps) {
	const [visible, setVisible] = useState(false)
	const t = useTranslations('shared')
	const isMobile = useMediaQuery('(max-width: 767px)')
	const pathname = usePathname()
	const { isAuthenticated, isHydrated } = useAuth()
	const deferUntilInteraction =
		isMobile &&
		!pathname?.startsWith('/auth') &&
		pathname !== '/privacy' &&
		pathname !== '/terms'

	useEffect(() => {
		if (!isHydrated) {
			return
		}

		if (isAuthenticated) {
			setVisible(false)
			return
		}

		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (!stored) {
				if (deferUntilInteraction) {
					const revealConsent = () => {
						window.removeEventListener('scroll', revealConsent)
						window.removeEventListener('pointerdown', revealConsent)
						window.removeEventListener('keydown', revealConsent)
						setVisible(true)
					}

					window.addEventListener('scroll', revealConsent, { once: true })
					window.addEventListener('pointerdown', revealConsent, {
						once: true,
					})
					window.addEventListener('keydown', revealConsent, { once: true })

					return () => {
						window.removeEventListener('scroll', revealConsent)
						window.removeEventListener('pointerdown', revealConsent)
						window.removeEventListener('keydown', revealConsent)
					}
				}

				const timer = setTimeout(() => setVisible(true), 1500)
				return () => clearTimeout(timer)
			}
		} catch {
			/* localStorage restricted */
		}
	}, [deferUntilInteraction, isAuthenticated, isHydrated])

	const handleAccept = () => {
		try {
			localStorage.setItem(STORAGE_KEY, 'accepted')
		} catch {
			/* restricted */
		}
		setVisible(false)
		onAccept?.()
	}

	const handleDecline = () => {
		try {
			localStorage.setItem(STORAGE_KEY, 'declined')
		} catch {
			/* restricted */
		}
		setVisible(false)
		onDecline?.()
	}

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ type: 'spring', damping: 25, stiffness: 300 }}
					className={cn(
						'fixed inset-x-0 bottom-[calc(var(--h-mobile-nav)+var(--space-3)+env(safe-area-inset-bottom))] z-notification px-3 sm:bottom-0 sm:px-4 sm:pb-4',
						className,
					)}
					role='dialog'
					aria-label={t('cookieConsent')}
				>
					<div className='mx-auto max-w-xl rounded-radius border border-border-subtle bg-bg-card p-3 shadow-warm sm:max-w-2xl sm:p-4'>
						<div className='flex items-start gap-2.5 sm:gap-3'>
							<Cookie className='mt-0.5 size-4 flex-shrink-0 text-brand sm:size-5' />
							<div className='min-w-0 flex-1'>
								<p className='pr-6 text-xs leading-5 text-text-secondary sm:pr-0 sm:text-sm'>
									{isMobile
										? t('cookieConsentMessageCompact')
										: t('cookieConsentMessage')}{' '}
									<a
										href={privacyHref}
										className='font-medium text-brand underline underline-offset-4 hover:no-underline'
									>
										{t('cookiePrivacyPolicy')}
									</a>
								</p>
								<div className='mt-2.5 flex flex-wrap gap-2 sm:mt-3'>
									<Button
										size='sm'
										className='h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm'
										onClick={handleAccept}
									>
										{t('cookieAccept')}
									</Button>
									<Button
										size='sm'
										variant='outline'
										className='h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm'
										onClick={handleDecline}
									>
										{t('cookieDecline')}
									</Button>
								</div>
							</div>
							<button
								type='button'
								onClick={handleDecline}
								className='rounded-sm p-1 text-text-muted transition-colors hover:text-text'
								aria-label={t('cookieDismiss')}
							>
								<X className='size-4' />
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
