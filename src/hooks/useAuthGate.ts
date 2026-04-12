import { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import { useTranslations } from '@/i18n/hooks'

/**
 * Returns a gate function that checks auth before performing an action.
 * If the user is not authenticated, shows a sign-up prompt toast and returns false.
 * Preserves the current page as a returnTo parameter so the user returns after auth.
 *
 * Usage:
 *   const requireAuth = useAuthGate()
 *   const handleLike = () => {
 *     if (!requireAuth('like this recipe')) return
 *     // ... proceed with like
 *   }
 */
export function useAuthGate() {
	const { isAuthenticated } = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const t = useTranslations('auth')

	return useCallback(
		(action?: string): boolean => {
			if (isAuthenticated) return true

			const message = action
				? t('signUpTo', { action })
				: t('signUpToContinue')

			const returnTo = encodeURIComponent(pathname)

			toast(message, {
				action: {
					label: t('signUpAction'),
					onClick: () => router.push(`/auth/sign-up?returnTo=${returnTo}`),
				},
				duration: 5000,
			})

			return false
		},
		[isAuthenticated, router, pathname, t],
	)
}
