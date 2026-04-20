'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (!stored) {
				// Delay appearance so page loads first
				const timer = setTimeout(() => setVisible(true), 1500)
				return () => clearTimeout(timer)
			}
		} catch {
			/* localStorage restricted */
		}
	}, [])

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
						'fixed inset-x-0 bottom-0 z-notification px-4 pb-4',
						className,
					)}
					role='dialog'
					aria-label={t('cookieConsent')}
				>
					<div className='mx-auto max-w-2xl rounded-radius border border-border-subtle bg-bg-card p-4 shadow-warm'>
						<div className='flex items-start gap-3'>
							<Cookie className='mt-0.5 size-5 flex-shrink-0 text-brand' />
							<div className='flex-1'>
								<p className='text-sm text-text-secondary'>
									{t('cookieConsentMessage')}{' '}
									<a
										href={privacyHref}
										className='font-medium text-brand underline underline-offset-4 hover:no-underline'
									>
										{t('cookiePrivacyPolicy')}
									</a>
								</p>
								<div className='mt-3 flex gap-2'>
									<Button size='sm' onClick={handleAccept}>
										{t('cookieAccept')}
									</Button>
									<Button size='sm' variant='outline' onClick={handleDecline}>
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
